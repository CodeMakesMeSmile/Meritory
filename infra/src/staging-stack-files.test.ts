import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const read = (name: string) =>
  readFileSync(new URL(`../staging/${name}`, import.meta.url), "utf8");

interface Service {
  image: string;
  depends_on?: Record<string, { condition: string }>;
  environment?: Record<string, string>;
  pre_start?: { command: string[] }[];
  ports?: string[];
  mem_limit?: string;
  restart?: string;
}

const compose = parse(read("compose.yml")) as {
  name: string;
  services: Record<string, Service>;
};
const { services } = compose;
const APPS = ["api", "worker", "web"];
const SCRIPTS = ["deploy.sh", "install.sh"];
const hasDash = spawnSync("dash", ["-c", "true"]).status === 0;

const megabytes = (limit: string) => Number(limit.replace(/m$/, ""));

describe("the staging compose file", () => {
  it("never shares containers or volumes with the local dev stack", () => {
    const local = parse(
      readFileSync(
        new URL("../../docker-compose.yml", import.meta.url),
        "utf8",
      ),
    ) as { name: string };
    expect(compose.name).not.toBe(local.name);
  });

  it("starts Postgres, then the api with its migrations, then worker, then web", () => {
    expect(services.api?.depends_on).toEqual({
      postgres: { condition: "service_healthy" },
    });
    expect(services.api?.pre_start?.[0]?.command).toEqual([
      "node",
      "packages/server/src/db/migrate.ts",
    ]);
    expect(services.worker?.depends_on).toEqual({
      api: { condition: "service_healthy" },
    });
    expect(services.web?.depends_on).toMatchObject({
      api: { condition: "service_healthy" },
      worker: { condition: "service_started" },
    });
  });

  it.each(APPS)("caps %s's memory and its Node heap below that", (name) => {
    const service = services[name];
    const heap = /--max-old-space-size=(\d+)/.exec(
      service?.environment?.NODE_OPTIONS ?? "",
    );
    expect(service?.mem_limit).toMatch(/^\d+m$/);
    expect(Number(heap?.[1])).toBeLessThan(megabytes(service?.mem_limit ?? ""));
  });

  it("fits every cap into the 1 GB server with room for the system", () => {
    const total = Object.values(services).reduce(
      (sum, service) => sum + megabytes(service.mem_limit ?? ""),
      0,
    );
    expect(total).toBeLessThanOrEqual(900);
  });

  it("runs the staging images from ghcr.io and a pinned Postgres", () => {
    for (const name of APPS) {
      expect(services[name]?.image).toBe(
        `ghcr.io/codemakesmesmile/meritory-${name}:staging`,
      );
    }
    expect(services.postgres?.image).toMatch(/^postgres:\d+\.\d+-alpine$/);
  });

  it("publishes only web, and only on the server itself", () => {
    for (const [name, service] of Object.entries(services)) {
      expect(service.ports ?? []).toEqual(
        name === "web" ? ["127.0.0.1:3000:3000"] : [],
      );
    }
  });

  it("restarts every service after a crash or a reboot", () => {
    for (const service of Object.values(services)) {
      expect(service.restart).toBe("unless-stopped");
    }
  });

  it("leaves GitHub and Google sign-in off", () => {
    const keys = Object.values(services).flatMap((service) =>
      Object.keys(service.environment ?? {}),
    );
    expect(keys.filter((key) => /GITHUB|GOOGLE/.test(key))).toEqual([]);
  });
});

describe("the .env template", () => {
  const template = read(".env.example");
  const keys = [...template.matchAll(/^([A-Z_]+)=(.*)$/gm)];

  it("names every setting the compose file reads from it", () => {
    const used = new Set(
      [...read("compose.yml").matchAll(/\$\{([A-Z_]+)/g)].map((m) => m[1]),
    );
    expect(new Set(keys.map((m) => m[1]))).toEqual(used);
  });

  it("holds no values", () => {
    expect(keys.filter((m) => m[2] !== "")).toEqual([]);
  });
});

describe("the deploy scripts", () => {
  it("checks for new images every 5 minutes", () => {
    expect(read("meritory-deploy.timer")).toContain("OnUnitActiveSec=5min");
    expect(read("meritory-deploy.service")).toContain(
      "ExecStart=/opt/meritory/deploy.sh",
    );
  });

  it("recreates only what changed, after checking the new compose file", () => {
    const deploy = read("deploy.sh");
    const steps = [
      "config --quiet",
      "mv compose.yml.new",
      "pull",
      "up --detach",
    ];
    const at = steps.map((step) => deploy.indexOf(step));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(deploy).not.toContain("--force-recreate");
  });

  it("keeps the .env readable by root only", () => {
    expect(read("install.sh")).toContain("chmod 0600 /opt/meritory/.env");
  });

  it.each(SCRIPTS)("%s downloads only from this repo's main branch", (name) => {
    const urls = read(name).match(/https:\/\/\S+/g) ?? [];
    expect(urls).toEqual([
      "https://raw.githubusercontent.com/CodeMakesMeSmile/Meritory/main/infra/staging",
    ]);
  });

  it.each(SCRIPTS)("%s is plain POSIX sh with Unix line endings", (name) => {
    const script = read(name);
    expect(script).toMatch(/^#!\/bin\/sh\n/);
    expect(script).toMatch(/^set -eu$/m);
    expect(script).not.toMatch(/pipefail|\[\[|\bfunction\b|\bsource\b|\r/);
  });

  it.runIf(hasDash).each(SCRIPTS)("%s parses under dash", (name) => {
    const check = spawnSync("dash", ["-n"], { input: read(name) });
    expect(check.stderr.toString()).toBe("");
    expect(check.status).toBe(0);
  });
});
