#!/bin/sh
# Run once as root on the staging server. Puts the deploy script and its timer
# in place and makes an empty .env to fill in. Running it again keeps the .env.
set -eu

BASE=https://raw.githubusercontent.com/CodeMakesMeSmile/Meritory/main/infra/staging

install -d -m 0755 /opt/meritory
curl -fsSL --retry 3 -o /opt/meritory/deploy.sh "$BASE/deploy.sh"
chmod 0755 /opt/meritory/deploy.sh
curl -fsSL --retry 3 -o /etc/systemd/system/meritory-deploy.service "$BASE/meritory-deploy.service"
curl -fsSL --retry 3 -o /etc/systemd/system/meritory-deploy.timer "$BASE/meritory-deploy.timer"
systemctl daemon-reload

if [ ! -f /opt/meritory/.env ]
then
  curl -fsSL --retry 3 -o /opt/meritory/.env "$BASE/.env.example"
fi
chmod 0600 /opt/meritory/.env

echo "Fill in /opt/meritory/.env, then run: systemctl enable --now meritory-deploy.timer"
