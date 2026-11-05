import type { ReadyResponse } from "@meritory/contracts";

export const dynamic = "force-dynamic";

async function apiStatus(): Promise<ReadyResponse | null> {
  const origin = process.env.API_ORIGIN ?? "http://localhost:4000";
  try {
    const res = await fetch(`${origin}/v1/health/ready`, { cache: "no-store" });
    return (await res.json()) as ReadyResponse;
  } catch {
    return null;
  }
}

export default async function Home() {
  const status = await apiStatus();
  const label = status === null ? "unreachable" : status.status;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4">
      <div className="rounded-card border border-border bg-card p-6">
        <h1 className="text-display">Meritory</h1>
        <p className="mt-2 text-secondary">Web app is running.</p>
        <dl className="mt-6 flex items-center justify-between rounded-item bg-sunken px-4 py-3 text-small">
          <dt className="text-secondary">API</dt>
          <dd
            className={`font-mono ${label === "ok" ? "text-success" : "text-danger"}`}
          >
            {label}
          </dd>
        </dl>
      </div>
    </main>
  );
}
