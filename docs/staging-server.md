# The staging server

This is the maintainers' setup, since every step needs the project's AWS account. The decision behind it is [0008: Staging on one Lightsail server](architecture/decisions/0008-staging-on-one-lightsail-server.md).

The `infra/` package is a CDK app with one stack, `MeritoryStaging`, in `ca-central-1`. It holds:

- One Lightsail server, `meritory-staging`, on the 1 GB plan ($7 USD a month) with Ubuntu 24.04.
- One port, SSH, open only to the browser terminal in the Lightsail console (the `lightsail-connect` alias). No web ports are open, because the Cloudflare Tunnel connects outward.
- A launch script that runs once on first boot. It adds a 2 GB swap file and installs Docker and `cloudflared` from their own apt repositories. It holds no secrets, so secrets go in a `.env` on the server.
- A monthly budget of $11 USD (about $15 CAD) for the whole account. It emails at 80% and 100% of actual spend, and when the forecast passes 100%.

CDK's telemetry and its version report are off in `infra/cdk.json`.

## 1. Sign in to AWS

Install the AWS CLI v2, then set up a profile that signs in through IAM Identity Center, so no long-lived keys sit on disk:

```
aws configure sso --profile meritory
aws sso login --profile meritory
```

Use `ca-central-1` as the default region. Run `aws sso login` again whenever the session runs out.

## 2. Check the plan and image IDs

Lightsail names its plans and images with IDs like `micro_3_0` and `ubuntu_24_04`. Confirm both still exist before the first deploy, and fix `SERVER` in `infra/src/staging-stack.ts` if not:

```
aws lightsail get-bundles --profile meritory --query "bundles[?bundleId=='micro_3_0'].[bundleId,price,ramSizeInGb]"
aws lightsail get-blueprints --profile meritory --query "blueprints[?blueprintId=='ubuntu_24_04'].[blueprintId,name,version]"
```

## 3. Bootstrap CDK once

CDK needs a small stack of its own in the account. It holds an S3 bucket, an ECR repository, IAM roles, and a version parameter, and it costs almost nothing ([Bootstrap your environment](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping-env.html)). Turn on termination protection, since deleting it breaks later deploys:

```
pnpm --filter @meritory/infra exec cdk bootstrap aws://<account-id>/ca-central-1 --termination-protection --profile meritory
```

## 4. Deploy

Pass the address for budget alerts as a parameter, so it never sits in the repo:

```
pnpm --filter @meritory/infra exec cdk deploy --profile meritory --parameters AlertEmail=<your address>
```

Later deploys keep the address, so leave `--parameters` off. `pnpm --filter @meritory/infra synth` builds the template without deploying, and needs no sign-in.

## 5. Check the server

Make sure only SSH is open, and only to the browser terminal:

```
aws lightsail get-instance-port-states --instance-name meritory-staging --profile meritory
```

Then connect from the Lightsail console and check that the launch script finished:

```
sudo tail -n 20 /var/log/cloud-init-output.log
docker --version
docker compose version
cloudflared --version
swapon --show
```

## Moving to the 2 GB plan

Lightsail can't change a server's plan in place ([upsizing](https://docs.aws.amazon.com/lightsail/latest/userguide/how-to-create-larger-instance-from-snapshot-using-console.html)), and CloudFormation can't update it either. Staging data is disposable, so build a fresh server instead:

1. Find the 2 GB plan's ID with `aws lightsail get-bundles`.
2. In `SERVER`, change `bundleId` to it and `name` to a new name, such as `meritory-staging-2`. The new name makes CloudFormation build a new server and remove the old one.
3. Deploy, then set up the stack, its `.env`, and the Tunnel on the new server again.

## Removing it

```
pnpm --filter @meritory/infra exec cdk destroy --profile meritory
```

This deletes the server and the budget. The bootstrap stack stays.
