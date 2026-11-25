#!/bin/sh
# Run by meritory-deploy.timer. Gets the latest compose file and images, then
# recreates only the containers whose image or settings changed.
set -eu

BASE=https://raw.githubusercontent.com/CodeMakesMeSmile/Meritory/main/infra/staging
cd /opt/meritory

curl -fsSL --retry 3 -o compose.yml.new "$BASE/compose.yml"
# A broken file stays out, and the running stack keeps going
docker compose --file compose.yml.new config --quiet
mv compose.yml.new compose.yml

docker compose pull --quiet
docker compose up --detach --remove-orphans --wait --wait-timeout 300
docker image prune --force > /dev/null
