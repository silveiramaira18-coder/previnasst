#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Previna SST TanStack Start app.
# Installs the Bun toolchain (the package manager pinned via bun.lock / bunfig.toml)
# if it is missing, exposes it on PATH for every lifecycle phase, then installs
# project dependencies from the frozen lockfile.
set -euo pipefail

export BUN_INSTALL="$HOME/.bun"

if ! "$BUN_INSTALL/bin/bun" --version >/dev/null 2>&1; then
  echo "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
fi

# Make `bun` resolvable from install, start, terminals, and interactive shells.
sudo ln -sf "$BUN_INSTALL/bin/bun" /usr/local/bin/bun
sudo ln -sf "$BUN_INSTALL/bin/bunx" /usr/local/bin/bunx

bun --version

cd "$(dirname "$0")/.."
bun install --frozen-lockfile
