# The staging server

This is the maintainers' setup, since every step needs the project's AWS account. The decision behind it is [0008: Staging on one Lightsail server](architecture/decisions/0008-staging-on-one-lightsail-server.md).

The `infra/` package is a CDK app with one stack, `MeritoryStaging`, in `ca-central-1`. It holds:

- One Lightsail server, `meritory-staging`, on the 1 GB plan ($7 USD a month) with Ubuntu 24.04.
- One port, SSH, open only to the browser terminal in the Lightsail console (the `lightsail-connect` alias). No web ports are open, because the Cloudflare Tunnel connects outward.
- A launch script that runs once on first boot. It adds a 2 GB swap file and installs Docker and `cloudflared` from their own apt repositories. It holds no secrets, so secrets go in a `.env` on the server. Lightsail runs it after its own setup script under `sh`, so it has to stay plain POSIX shell.
- A monthly budget of $11 USD (about $15 CAD) for the whole account. It emails at 80% and 100% of actual spend, and when the forecast passes 100%.

CDK's telemetry and its version report are off in `infra/cdk.json`.

## 1. Sign in to AWS

Deploys run as the IAM user `meritory-admin`, which has the `AdministratorAccess` and `SignInLocalDevelopmentAccess` policies, a console password, and MFA, but no access keys. IAM Identity Center isn't used, because it needs AWS Organizations, and joining Organizations moves a Free plan account to the Paid plan ([Choosing a plan](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html)).

Install the AWS CLI v2 (2.32.0 or later), then sign in through the browser as `meritory-admin` ([Login using console credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sign-in.html)):

```
aws configure set region ca-central-1 --profile meritory
aws login --profile meritory
aws sts get-caller-identity --profile meritory
```

The last command should show `user/meritory-admin`. The CLI keeps short-term credentials and refreshes them for up to 12 hours, so no long-lived keys sit on disk. Run `aws login` again after that, and `aws logout --profile meritory` when you're done.

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
cloud-init status
sudo tail -n 20 /var/log/cloud-init-output.log
docker --version
docker compose version
cloudflared --version
swapon --show
```

## 6. Run the stack

The stack is in `infra/staging/`. A systemd timer on the server runs `deploy.sh` two minutes after boot and every 5 minutes after that. Each run downloads `compose.yml` from `main`, checks it, pulls the `staging` images that CI pushes on every merge, and runs `docker compose up`, which recreates only the containers whose image or settings changed. A merged change to the compose file deploys the same way.

| Service | Memory cap | Node heap | Starts after |
|---|---|---|---|
| Postgres | 160 MB | | |
| api | 288 MB | 192 MB | Postgres is healthy, then its migrations run |
| worker | 224 MB | 144 MB | the api is healthy |
| web | 192 MB | 128 MB | the api is healthy and the worker has started |

The migrations run in a `pre_start` step of the api, so they run once each time the api is recreated, not every 5 minutes. Only web is published, on `127.0.0.1:3000`, for the Tunnel. Staging has email and password sign-in only, public content only, an empty database, and no code runner, so coding exercises can't be checked there.

In the Lightsail browser terminal, as root (`sudo -i`):

1. Install the deploy script and timer, and make an empty `.env`:

   ```
   curl -fsSL -o /tmp/install.sh https://raw.githubusercontent.com/CodeMakesMeSmile/Meritory/main/infra/staging/install.sh
   less /tmp/install.sh
   sh /tmp/install.sh
   ```

2. Fill in `/opt/meritory/.env` with `nano /opt/meritory/.env`. Each line says how to make its value. The SES SMTP login is the one from [Sending test email through Amazon SES](email-sending.md). Paste values in, and never commit them anywhere.

3. Start the timer and watch the first deploy:

   ```
   systemctl enable --now meritory-deploy.timer
   systemctl start meritory-deploy.service
   journalctl -u meritory-deploy.service -n 50
   ```

## Checking on it

```
docker compose -f /opt/meritory/compose.yml ps
docker stats --no-stream
free -m
systemctl list-timers meritory-deploy.timer
journalctl -u meritory-deploy.service --since "1 hour ago"
docker compose -f /opt/meritory/compose.yml logs --tail 50 api
curl -s http://127.0.0.1:3000/ -o /dev/null -w "%{http_code}\n"
```

`docker stats` shows each container's memory against its cap. If a container keeps hitting its cap or swap stays busy, raise the cap in `compose.yml` or move to the 2 GB plan. Logs are capped at 30 MB a container.

## Rebuilding the server

Staging data is disposable. To start over, remove the stack and deploy again (see [Removing it](#removing-it) and step 4), then repeat step 6. The database starts empty.

## Moving to the 2 GB plan

Lightsail can't change a server's plan in place ([upsizing](https://docs.aws.amazon.com/lightsail/latest/userguide/how-to-create-larger-instance-from-snapshot-using-console.html)), and CloudFormation can't update it either. Staging data is disposable, so build a fresh server instead:

1. Find the 2 GB plan's ID with `aws lightsail get-bundles`.
2. In `SERVER`, change `bundleId` to it and `name` to a new name, such as `meritory-staging-2`. The new name makes CloudFormation build a new server and remove the old one.
3. Deploy, then repeat step 6 and set up the Tunnel on the new server.
4. With 2 GB, the memory caps in `infra/staging/compose.yml` can go up.

A changed launch script works the same way. CloudFormation can only apply it by building a new server, and it can't replace a server that keeps its name, so either rename it or remove the stack and deploy again.

## Removing it

```
pnpm --filter @meritory/infra exec cdk destroy --profile meritory
```

This deletes the server and the budget. The bootstrap stack stays.
