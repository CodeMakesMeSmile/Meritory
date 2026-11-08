import type { Job, JobResult, PgBoss } from "pg-boss";
import { openMail, UnreadableMailError } from "./mail-crypto.ts";
import { MAIL_QUEUE, MAIL_RETRY, type MailJob } from "./mail-queue.ts";
import type { Mailer } from "./mailer.ts";

export interface MailWorkerLog {
  warn(details: object, message: string): void;
  error(details: object, message: string): void;
}

interface MailWorkerDeps {
  boss: PgBoss;
  key: Buffer;
  mailer: Mailer;
  log: MailWorkerLog;
  queue?: string;
}

/** The SMTP reply code, when the server answered at all */
export function smtpCode(err: unknown): number | null {
  const code = (err as { responseCode?: unknown } | null)?.responseCode;
  return typeof code === "number" ? code : null;
}

/**
 * A 5xx reply is final under RFC 5321, and so is a job that can't be opened. A 4xx reply,
 * a dropped connection, or anything unknown may pass on a later try.
 */
export function isPermanent(err: unknown): boolean {
  if (err instanceof UnreadableMailError) return true;
  const code = smtpCode(err);
  return code !== null && code >= 500;
}

// Error messages can quote the address back, so only the codes leave this file
function failure(err: unknown) {
  const code = (err as { code?: unknown } | null)?.code;
  return {
    smtpCode: smtpCode(err),
    error: typeof code === "string" ? code : "unknown",
  };
}

export function createMailHandler({
  boss,
  key,
  mailer,
  log,
  queue = MAIL_QUEUE,
}: MailWorkerDeps) {
  async function sendOne(job: Job<MailJob>): Promise<JobResult> {
    const { kind, userId } = job.data;
    try {
      await mailer.send(openMail(key, job.data.sealed), { kind, userId });
    } catch (err) {
      const permanent = isPermanent(err);
      const attempt = job.retryCount + 1;
      const output = failure(err);
      const details = { jobId: job.id, kind, userId, attempt, ...output };
      if (permanent || attempt > MAIL_RETRY.retryLimit) {
        log.error(details, "sign-in email gave up");
      } else {
        log.warn(details, "sign-in email will retry");
      }
      return {
        id: job.id,
        status: permanent ? "deadletter" : "failed",
        output,
      };
    }
    // The job holds the sealed mail, so it goes as soon as the mail does
    await boss
      .deleteJob(queue, job)
      .catch((err: unknown) =>
        log.warn({ jobId: job.id, ...failure(err) }, "sent job not deleted"),
      );
    return { id: job.id, status: "completed" };
  }

  return async (jobs: Job<MailJob>[]): Promise<JobResult[]> => {
    const results: JobResult[] = [];
    for (const job of jobs) results.push(await sendOne(job));
    return results;
  };
}

export function startMailWorker(deps: MailWorkerDeps) {
  return deps.boss.work<MailJob>(
    deps.queue ?? MAIL_QUEUE,
    {
      perJobResults: true,
      localConcurrency: 2,
      // New jobs wake the worker at once. This poll picks up retries as they come due.
      notifyPollingIntervalSeconds: 5,
    },
    createMailHandler(deps),
  );
}
