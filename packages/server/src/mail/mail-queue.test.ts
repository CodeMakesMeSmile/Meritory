import { randomBytes, randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sealMail } from "./mail-crypto.ts";
import {
  createBoss,
  createQueuedMailer,
  MAIL_RETRY,
  type MailJob,
  setUpMailQueues,
} from "./mail-queue.ts";
import {
  createMailHandler,
  isPermanent,
  startMailWorker,
} from "./mail-worker.ts";
import type { Mail, Mailer, MailTag } from "./mailer.ts";

const url = process.env.TEST_DATABASE_URL;

const key = randomBytes(32);
const tag: MailTag = { kind: "reset-password", userId: randomUUID() };

const smtpError = (responseCode: number) =>
  Object.assign(
    new Error(`${responseCode} 5.1.1 <rowan@meritory.test>: rejected`),
    { code: "EENVELOPE", responseCode },
  );

const newMail = (): Mail => ({
  to: `mail-${randomUUID()}@meritory.test`,
  subject: "Reset your Meritory password",
  text: `https://meritory.test/reset-password/${randomUUID()}`,
});

const fakeLog = () => ({ warn: vi.fn(), error: vi.fn() });

// Spells out errors the way pino does, message and all
const logged = (calls: unknown[][]) =>
  JSON.stringify(calls, (_, value) =>
    value instanceof Error ? { ...value, message: value.message } : value,
  );

describe("isPermanent", () => {
  it("gives up on a 5xx reply only", () => {
    expect(isPermanent(smtpError(550))).toBe(true);
    expect(isPermanent(smtpError(554))).toBe(true);
    expect(isPermanent(smtpError(421))).toBe(false);
    expect(isPermanent(smtpError(454))).toBe(false);
    expect(
      isPermanent(Object.assign(new Error(), { code: "ECONNECTION" })),
    ).toBe(false);
    expect(isPermanent(new Error("unknown"))).toBe(false);
  });
});

describe("the mail handler", () => {
  const job = (retryCount: number) => ({
    id: randomUUID(),
    name: "mail",
    data: { ...tag, sealed: sealMail(key, newMail()) },
    retryCount,
    expireInSeconds: 60,
    heartbeatSeconds: null,
    signal: new AbortController().signal,
  });
  const boss = { deleteJob: vi.fn(async () => ({})) } as never;

  it("logs the last allowed try as giving up", async () => {
    const log = fakeLog();
    const handle = createMailHandler({
      boss,
      key,
      log,
      mailer: { send: () => Promise.reject(smtpError(451)) },
    });
    await handle([job(MAIL_RETRY.retryLimit - 1)]);
    expect(log.warn).toHaveBeenCalledOnce();
    await handle([job(MAIL_RETRY.retryLimit)]);
    expect(log.error).toHaveBeenCalledOnce();
    expect(log.error.mock.calls[0]?.[0]).toMatchObject({
      attempt: MAIL_RETRY.retryLimit + 1,
    });
  });
});

describe.skipIf(!url)("the mail queue against Postgres", () => {
  const sql = postgres(url ?? "", { max: 1, onnotice: () => {} });
  const boss = createBoss({ url: url ?? "", worker: true, onError: () => {} });
  // Its own queues, so a running dev worker never takes these jobs
  const id = randomUUID().slice(0, 8);
  const names = {
    queue: `mail_test_${id}`,
    deadLetter: `mail_test_dead_${id}`,
  };
  const queued = createQueuedMailer(boss, key, names.queue);

  beforeAll(async () => {
    await boss.start();
    await setUpMailQueues(boss, names);
  });

  afterAll(async () => {
    await boss.deleteQueue(names.queue);
    await boss.deleteQueue(names.deadLetter);
    await boss.stop({ graceful: false });
    await sql.end();
  });

  const rows = (name: string) => sql<
    { id: string; state: string; data: string; output: string | null }[]
  >`select id, state, data::text as data, output::text as output
    from pgboss.job where name = ${name}`;

  /** Runs a worker with this mailer until the check passes */
  async function withWorker(mailer: Mailer, check: () => Promise<void>) {
    const log = fakeLog();
    const workId = await startMailWorker({
      boss,
      key,
      mailer,
      log,
      queue: names.queue,
    });
    try {
      await vi.waitFor(check, { timeout: 15_000, interval: 100 });
    } finally {
      await boss.offWork(names.queue, { id: workId, wait: true });
    }
    return log;
  }

  const expectNothingReadable = (text: string | null, mail: Mail) => {
    for (const secret of [mail.to, mail.text, mail.subject, "meritory.test"]) {
      expect(text ?? "").not.toContain(secret);
    }
  };

  it("stores no address, text, or link in plain text", async () => {
    const mail = newMail();
    await queued.send(mail, tag);
    const [row] = await rows(names.queue);
    expect(row?.state).toBe("created");
    expect(JSON.parse(row?.data ?? "{}")).toMatchObject(tag);
    expectNothingReadable(row?.data ?? null, mail);
    await boss.deleteQueuedJobs(names.queue);
  });

  it("sends the mail and leaves no job behind", async () => {
    const mail = newMail();
    const sent: [Mail, MailTag][] = [];
    await queued.send(mail, tag);
    await withWorker(
      { send: async (...args) => void sent.push(args) },
      async () => {
        expect(sent).toEqual([[mail, tag]]);
        expect(await rows(names.queue)).toEqual([]);
      },
    );
  });

  it.each([
    ["a 4xx reply", smtpError(451), 451],
    [
      "a refused connection",
      Object.assign(new Error(), { code: "ECONNECTION" }),
      null,
    ],
  ])("tries again later after %s", async (_, error, smtpCode) => {
    const mail = newMail();
    await queued.send(mail, tag);
    const log = await withWorker(
      { send: () => Promise.reject(error) },
      async () => {
        expect((await rows(names.queue))[0]?.state).toBe("retry");
      },
    );
    const [row] = await rows(names.queue);
    expect(JSON.parse(row?.output ?? "{}")).toMatchObject({ smtpCode });
    expectNothingReadable(row?.output ?? null, mail);
    const [details, message] = log.warn.mock.calls[0] ?? [];
    expect(message).toBe("sign-in email will retry");
    expect(details).toMatchObject({ ...tag, attempt: 1, smtpCode });
    expectNothingReadable(logged(log.warn.mock.calls), mail);
    expect(await rows(names.deadLetter)).toEqual([]);
    await boss.deleteAllJobs(names.queue);
  });

  it("sends a 5xx reply straight to dead letters", async () => {
    const mail = newMail();
    const send = vi.fn(() => Promise.reject(smtpError(550)));
    await queued.send(mail, tag);
    const log = await withWorker({ send }, async () => {
      expect(await rows(names.deadLetter)).toHaveLength(1);
    });
    expect(send).toHaveBeenCalledOnce();
    const [failed] = await rows(names.queue);
    expect(failed?.state).toBe("failed");
    expectNothingReadable(failed?.output ?? null, mail);
    const [dead] = await rows(names.deadLetter);
    expectNothingReadable(dead?.data ?? null, mail);
    expect(log.error.mock.calls[0]?.[1]).toBe("sign-in email gave up");
    expectNothingReadable(logged(log.error.mock.calls), mail);
    await boss.deleteAllJobs(names.queue);
    await boss.deleteAllJobs(names.deadLetter);
  });

  it("sends a job it can't open straight to dead letters", async () => {
    const send = vi.fn(async () => {});
    const job: MailJob = {
      ...tag,
      sealed: sealMail(randomBytes(32), newMail()),
    };
    await boss.send(names.queue, { ...job });
    await withWorker({ send }, async () => {
      expect(await rows(names.deadLetter)).toHaveLength(1);
    });
    expect(send).not.toHaveBeenCalled();
    await boss.deleteAllJobs(names.queue);
    await boss.deleteAllJobs(names.deadLetter);
  });
});
