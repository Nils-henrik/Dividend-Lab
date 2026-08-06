#!/usr/bin/env bash
#
# Cloud Agent start script for Dividend Lab.
#
# Runs on every container start. Brings up Docker and the local Supabase stack,
# writes the app's local .env.local, then runs the Next.js dev server in the
# foreground so it stays attached to this process.
#
# Supabase is best-effort: if it cannot start (e.g. the checked-out branch has
# no supabase/config.toml yet), the app still runs in its mock experience.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. Docker daemon (prerequisite for the local Supabase stack).
if ! docker info >/dev/null 2>&1; then
  sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
  sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true
  sudo rm -f /var/run/docker.pid
  sudo bash -c 'dockerd >/var/log/dockerd.log 2>&1 &'
  for _ in $(seq 1 60); do
    docker info >/dev/null 2>&1 && break
    sleep 1
  done
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
fi

# 2. Local Supabase stack (Postgres + Auth + Storage). `supabase start` is a
#    no-op when the stack is already running.
supabase_up=0
if command -v supabase >/dev/null 2>&1 && [ -f supabase/config.toml ]; then
  if supabase start; then
    supabase_up=1
  fi
fi

# 3. App environment for the local stack (gitignored). The publishable/anon keys
#    are the Supabase CLI's fixed local-dev demo values, not real secrets.
if [ "$supabase_up" = "1" ]; then
  cat > .env.local <<'ENV'
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV
else
  echo "cloud-agent-start: Supabase not started; running app in mock mode"
fi

# 4. Next.js development server in the foreground.
exec npm run dev
