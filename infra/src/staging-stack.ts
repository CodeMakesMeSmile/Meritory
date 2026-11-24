import { readFileSync } from "node:fs";
import { CfnParameter, Stack, type StackProps } from "aws-cdk-lib";
import { CfnBudget } from "aws-cdk-lib/aws-budgets";
import { CfnInstance } from "aws-cdk-lib/aws-lightsail";
import type { Construct } from "constructs";

export const REGION = "ca-central-1";

/**
 * The server's plan and image. Lightsail can't change either in place, so
 * upsizing means a new plan and a new name, which builds a fresh server.
 */
export const SERVER = {
  name: "meritory-staging",
  bundleId: "micro_3_0",
  blueprintId: "ubuntu_24_04",
  availabilityZone: `${REGION}a`,
} as const;

/** USD a month, about $15 CAD */
export const BUDGET_USD = 11;

export const LAUNCH_SCRIPT = readFileSync(
  new URL("./launch-script.sh", import.meta.url),
  "utf8",
);

/** One Lightsail server for staging, and a budget alert for the account */
export class StagingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Passed at deploy time, so the address never sits in the repo
    const alertEmail = new CfnParameter(this, "AlertEmail", {
      type: "String",
      description: "Where the budget alerts go",
      allowedPattern: "^[^@\\s]+@[^@\\s]+$",
      constraintDescription: "must be an email address",
    });

    new CfnInstance(this, "Server", {
      instanceName: SERVER.name,
      bundleId: SERVER.bundleId,
      blueprintId: SERVER.blueprintId,
      availabilityZone: SERVER.availabilityZone,
      userData: LAUNCH_SCRIPT,
      networking: {
        // Every port is listed, since an empty list opens the defaults
        ports: [
          {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrListAliases: ["lightsail-connect"],
          },
        ],
      },
      tags: [{ key: "project", value: "meritory-staging" }],
    });

    const notify = (
      notificationType: "ACTUAL" | "FORECASTED",
      threshold: number,
    ): CfnBudget.NotificationWithSubscribersProperty => ({
      notification: {
        notificationType,
        comparisonOperator: "GREATER_THAN",
        threshold,
        thresholdType: "PERCENTAGE",
      },
      subscribers: [
        { subscriptionType: "EMAIL", address: alertEmail.valueAsString },
      ],
    });

    new CfnBudget(this, "Budget", {
      budget: {
        budgetName: "meritory-monthly",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: BUDGET_USD, unit: "USD" },
      },
      notificationsWithSubscribers: [
        notify("ACTUAL", 80),
        notify("ACTUAL", 100),
        notify("FORECASTED", 100),
      ],
    });
  }
}
