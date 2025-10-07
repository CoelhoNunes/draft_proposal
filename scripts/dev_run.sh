#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"
echo "==> Starting Dev (WSL/Linux/macOS)."

# Load .env if present
if [ -f ".env" ]; then set -a; source .env; set +a; fi
if [ -z "${OPENAI_API_KEY:-}" ]; then echo "WARNING: OPENAI_API_KEY not set"; fi

# Activate Python venv if available
if [ -f ".venv/bin/activate" ]; then source .venv/bin/activate; fi

# Ensure pnpm (via corepack)
command -v pnpm >/dev/null 2>&1 || corepack enable

# Free ports 3000/5173 (WSL-safe)
for P in 3000 5173; do (fuser -k "${P}/tcp" >/dev/null 2>&1 || true); done

echo "==> pnpm install --frozen-lockfile"
pnpm install --frozen-lockfile

echo "==> Build workspace"
pnpm -w -r build

# Start API + Web concurrently (fall back if root script missing)
if pnpm -s run | grep -q "\"dev\""; then
  pnpm dev
else
  (pnpm --filter "./apps/api" dev &)
  (pnpm --filter "./apps/web" dev &)
  wait
fi

# HOW TO RUN:
#   WSL/Linux/macOS:   chmod +x scripts/dev_run.sh && ./scripts/dev_run.sh
#   Windows PowerShell: bash scripts/dev_run.sh   (via WSL or Git Bash)
