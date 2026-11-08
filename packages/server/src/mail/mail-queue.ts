import { PgBoss, type Queue } from "pg-boss";
import { sealMail } from "./mail-crypto.ts";
import type { Mailer, MailKind } from "./mailer.ts";

export const MAIL_QUEUE = "mail";
export const MAIL_DEAD_QUEUE = "mail-dead";

const DAY = 24 * 60 * 60;

/**
 * 9 tries over about 25 minutes. Waits double from 15 seconds up to 5 minutes, with jitter,
 * so the last try lands well inside the 1-hour life of a link.
 */
export const MAIL_RETRY = {
  retryLimit: 8,
  retryDelay: 15,
  retryBackoff: true,
  retryDelayMax: 300,
} as const;

export interface MailQueueNames {
  queue: string;
  deadLetter: string;
}

const NAMES: MailQueueNames = {
  queue: MAIL_QUEUE,
  deadLetter: MAIL_DEAD_QUEUE,
};

/** A queued mail. Only the sealed part holds the address, text, or link. */
export interface MailJob {
  kind: MailKind;
  userId: string;
  sealed: string;
}

interface BossOptions {
  url: string;
  /** The worker listens for new jobs and runs upkeep. The API only adds jobs. */
  worker?: boolean;
  onError: (err: Error) => void;
}

/** Never installs or migrates its schema. That's the migrate step's job. */
export function createBoss({ url, worker = false, onError }: BossOptions) {
  const boss = new PgBoss({
    connectionString: url,
    application_name: worker ? "meritory-worker" : "meritory-api",
    max: worker ? 4 : 2,
    migrate: false,
    schedule: false,
    supervise: worker,
    useListenNotify: worker,
  });
  boss.on("error", onError);
  return boss;
}

async function upsertQueue(
  boss: PgBoss,
  name: string,
  options: Omit<Queue, "name">,
) {
  if (await boss.getQueue(name)) await boss.updateQueue(name, options);
  else await boss.createQueue(name, options);
}

/** Run by the migrate step, so a change here lands with the next deploy */
export async function setUpMailQueues(boss: PgBoss, names = NAMES) {
  // Kept a week for a look at what failed, still sealed
  await upsertQueue(boss, names.deadLetter, {
    retentionSeconds: 7 * DAY,
    deleteAfterSeconds: 7 * DAY,
  });
  await upsertQueue(boss, names.queue, {
    ...MAIL_RETRY,
    deadLetter: names.deadLetter,
    notify: true,
    // Longer than the SMTP timeouts, so a stuck try is retried
    expireInSeconds: 60,
    retentionSeconds: DAY,
    // The worker deletes each job once it's sent. This catches any it couldn't.
    deleteAfterSeconds: 60,
  });
}

/** Seals each mail and adds it to the queue for the worker to send */
export function createQueuedMailer(
  boss: PgBoss,
  key: Buffer,
  queue = MAIL_QUEUE,
): Mailer {
  return {
    async send(mail, { kind, userId }) {
      const job: MailJob = { kind, userId, sealed: sealMail(key, mail) };
      await boss.send(queue, { ...job });
    },
  };
}
