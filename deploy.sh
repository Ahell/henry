#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NVM_DIR="/home/initium/.nvm"
NODE_VERSION="$(tr -d '[:space:]' < "$ROOT_DIR/.nvmrc")"
NODE_BIN="$NVM_DIR/versions/node/v${NODE_VERSION#v}/bin/node"
NPM_BIN="$NVM_DIR/versions/node/v${NODE_VERSION#v}/bin/npm"

if [[ ! -x "$NODE_BIN" || ! -x "$NPM_BIN" ]]; then
  echo "Missing Node runtime for Henry: $NODE_VERSION"
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):/usr/local/bin:/usr/bin:/bin:/usr/games"

echo "Deploying Henry with $("$NODE_BIN" -v)"
"$NPM_BIN" ci
"$NPM_BIN" run build

echo "Henry build complete. Start production with PM2 using ecosystem.config.cjs."
