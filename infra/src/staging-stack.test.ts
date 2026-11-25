import { spawnSync } from "node:child_process";
import { App } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { BUDGET_USD, LAUNCH_SCRIPT, StagingStack } from "./staging-stack.ts";

// Ubuntu CI runners have dash, Windows machines usually don't
const hasDash = spawnSync("dash", ["-c", "true"]).status === 0;

const template = Template.fromStack(
  new StagingStack(new App(), "Test", {
    env: { account: "111111111111", region: "ca-central-1" },
  }),
);

describe("the staging server", () => {
  it("is one 1 GB Ubuntu 24.04 server in ca-central-1", () => {
    template.resourceCountIs("AWS::Lightsail::Instance", 1);
    template.hasResourceProperties("AWS::Lightsail::Instance", {
      InstanceName: "meritory-staging",
      BundleId: "micro_3_0",
      BlueprintId: "ubuntu_24_04",
      AvailabilityZone: "ca-central-1a",
    });
  });

  it("opens only SSH, and only to Lightsail's browser terminal", () => {
    const [server] = Object.values(
      template.findResources("AWS::Lightsail::Instance"),
    );
    expect(server?.Properties.Networking.Ports).toEqual([
      {
        Protocol: "tcp",
        FromPort: 22,
        ToPort: 22,
        CidrListAliases: ["lightsail-connect"],
      },
    ]);
  });

  it("runs the launch script on first boot", () => {
    template.hasResourceProperties("AWS::Lightsail::Instance", {
      UserData: LAUNCH_SCRIPT,
    });
  });

  it("has no snapshots, since staging data is disposable", () => {
    template.hasResourceProperties("AWS::Lightsail::Instance", {
      AddOns: Match.absent(),
    });
  });
});

describe("the launch script", () => {
  it("installs Docker and cloudflared from their own repositories", () => {
    expect(LAUNCH_SCRIPT).toContain("https://download.docker.com/linux/ubuntu");
    expect(LAUNCH_SCRIPT).toContain("https://pkg.cloudflare.com/cloudflared");
    expect(LAUNCH_SCRIPT).toContain("docker-compose-plugin");
    expect(LAUNCH_SCRIPT).not.toContain("get.docker.com");
  });

  it("adds a 2 GB swap file that survives a restart", () => {
    expect(LAUNCH_SCRIPT).toContain("fallocate -l 2G /swapfile");
    expect(LAUNCH_SCRIPT).toContain("/swapfile none swap sw 0 0");
  });

  it("stops on the first failed step", () => {
    expect(LAUNCH_SCRIPT).toMatch(/^set -eu$/m);
  });

  // Lightsail runs it after its own #!/bin/sh setup, which is dash on Ubuntu
  it("is plain POSIX sh, not bash", () => {
    expect(LAUNCH_SCRIPT).not.toMatch(/^#!/);
    expect(LAUNCH_SCRIPT).not.toMatch(/pipefail|\[\[|\bfunction\b|\bsource\b/);
  });

  it.runIf(hasDash)("parses under dash", () => {
    const check = spawnSync("dash", ["-n"], { input: LAUNCH_SCRIPT });
    expect(check.stderr.toString()).toBe("");
    expect(check.status).toBe(0);
  });

  it("holds no secrets", () => {
    const commands = LAUNCH_SCRIPT.split("\n")
      .filter((line) => !line.trimStart().startsWith("#"))
      .join("\n");
    expect(commands).not.toMatch(
      /token|password|secret|api[_-]?key|BEGIN [A-Z ]*PRIVATE KEY|AKIA[0-9A-Z]{16}/i,
    );
    expect(commands).not.toMatch(/@[a-z0-9-]+\.[a-z]/i);
  });

  it("uses Unix line endings, which bash needs", () => {
    expect(LAUNCH_SCRIPT).not.toContain("\r");
  });
});

describe("the budget", () => {
  it("covers the whole account at $11 USD a month", () => {
    template.hasResourceProperties("AWS::Budgets::Budget", {
      Budget: {
        BudgetType: "COST",
        TimeUnit: "MONTHLY",
        BudgetLimit: { Amount: BUDGET_USD, Unit: "USD" },
        CostFilters: Match.absent(),
      },
    });
  });

  it("emails at actual 80% and 100%, and forecast 100%", () => {
    const [budget] = Object.values(
      template.findResources("AWS::Budgets::Budget"),
    );
    const alerts = budget?.Properties.NotificationsWithSubscribers.map(
      (n: {
        Notification: { NotificationType: string; Threshold: number };
        Subscribers: { SubscriptionType: string; Address: unknown }[];
      }) => {
        expect(n.Subscribers).toEqual([
          { SubscriptionType: "EMAIL", Address: { Ref: "AlertEmail" } },
        ]);
        return `${n.Notification.NotificationType} ${n.Notification.Threshold}`;
      },
    );
    expect(alerts).toEqual(["ACTUAL 80", "ACTUAL 100", "FORECASTED 100"]);
  });

  it("takes the email address at deploy time, not from the repo", () => {
    template.hasParameter("AlertEmail", { Type: "String" });
  });
});
