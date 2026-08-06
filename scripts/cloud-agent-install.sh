#!/usr/bin/env bash
#
# Cloud Agent install script for Dividend Lab.
#
# Idempotent, one-time environment setup. Runs after the repository is checked
# out and before the start script. Prepares the tools needed to run the app and
# its local Supabase stack, then installs project dependencies.
#
# System tools (Docker, the Supabase CLI) are normally already present in the
# base snapshot; the guards below make a from-scratch base work too.
set -euo pipefail

# Docker (used by the Supabase CLI to run the local Postgres/Auth/Storage stack).
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io fuse-overlayfs uidmap
fi

# Supabase CLI.
if ! command -v supabase >/dev/null 2>&1; then
  sb_arch="$(dpkg --print-architecture)"
  sb_url="$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest \
    | grep browser_download_url \
    | grep "_linux_${sb_arch}.deb" \
    | head -1 | cut -d '"' -f 4)"
  # Fall back to a pinned release if the GitHub API is rate-limited/unavailable.
  case "$sb_url" in
    *.deb) ;;
    *) sb_url="https://github.com/supabase/cli/releases/download/v2.111.0/supabase_2.111.0_linux_${sb_arch}.deb" ;;
  esac
  curl -fsSL -o /tmp/supabase.deb "$sb_url"
  sudo dpkg -i /tmp/supabase.deb
fi

# Docker daemon config tuned for this nested-container VM: fuse-overlayfs storage
# and an explicit bridge so host-gateway resolution works for the Supabase stack.
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json >/dev/null <<'JSON'
{
  "storage-driver": "fuse-overlayfs",
  "bip": "172.20.0.1/16",
  "default-address-pools": [{ "base": "172.21.0.0/16", "size": 24 }]
}
JSON

# Node dependencies and the Playwright browser used by the verification scripts.
npm ci
npx playwright install --with-deps chromium

echo "cloud-agent-install: done"
