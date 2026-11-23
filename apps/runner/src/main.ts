import { execFileSync } from "node:child_process";
import { runCode } from "./run.ts";
import { isolateSandbox } from "./sandbox.ts";
import { createRunnerServer, readSlots } from "./server.ts";

const token = process.env.RUNNER_TOKEN ?? "";
if (token.length < 32) {
  console.error(
    "Set RUNNER_TOKEN to at least 32 characters. See docs/runner.md.",
  );
  process.exit(1);
}

try {
  execFileSync("isolate", ["--version"], { stdio: "ignore" });
} catch {
  console.error("Isolate isn't installed. See docs/runner.md.");
  process.exit(1);
}

const port = Number(process.env.RUNNER_PORT ?? 4100);
const slots = readSlots(process.env.RUNNER_SLOTS, 2);
if (slots === null) {
  console.error("Set RUNNER_SLOTS to a whole number of at least 1.");
  process.exit(1);
}

const server = createRunnerServer({
  token,
  slots,
  waiting: slots * 4,
  run: (request, slot) => runCode(request, isolateSandbox(slot)),
});

// Only this machine, which includes Windows through WSL's localhost forwarding
server.listen(port, "127.0.0.1", () => {
  console.log(
    `Runner listening on http://localhost:${port} with ${slots} slots`,
  );
});
