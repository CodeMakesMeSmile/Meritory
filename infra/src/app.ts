import { App } from "aws-cdk-lib";
import { REGION, StagingStack } from "./staging-stack.ts";

const app = new App();

new StagingStack(app, "MeritoryStaging", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: REGION },
  description: "Meritory staging server and budget alert",
});
