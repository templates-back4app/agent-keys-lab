#!/usr/bin/env bash
# The same agent tool, carrying three different credentials.
#
#   ./run.sh
#
# Needs Docker and Node 22. The backend is destroyed and rebuilt every run.
set -uo pipefail
cd "$(dirname "$0")"

# Fail here rather than three minutes from now with an empty result.
docker info >/dev/null 2>&1 || {
  echo ""
  echo "  Docker is not running. Start Docker Desktop (or your daemon) and run this again."
  echo ""
  exit 1
}
docker compose down -v >/dev/null 2>&1
docker compose up -d >/dev/null 2>&1
docker compose restart parse >/dev/null 2>&1
node run.mjs
