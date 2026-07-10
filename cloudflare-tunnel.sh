#!/bin/bash

# Validate MiniPACS locally before opening a Cloudflare quick tunnel.
# Usage: bash ./cloudflare-tunnel.sh

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "ERROR: Docker Compose is not installed." >&2
    exit 1
  fi
}

fail_with_logs() {
  echo
  echo "MiniPACS is not healthy. Recent gateway/dashboard logs:"
  compose ps || true
  compose logs --tail=120 nginx-gateway dashboard || true
  exit 1
}

command -v cloudflared >/dev/null 2>&1 || {
  echo "ERROR: cloudflared is not installed or is not in PATH." >&2
  exit 1
}

echo "Checking Docker services..."
compose ps

echo "Checking Nginx gateway on 127.0.0.1:8080..."
curl -fsS --max-time 10 http://127.0.0.1:8080/healthz | grep -qx "ok" || fail_with_logs

echo "Checking Dashboard through the same gateway..."
status="$(curl -sS -o /dev/null --max-time 15 -w '%{http_code}' http://127.0.0.1:8080/login || true)"
case "$status" in
  200|301|302|303|307|308) ;;
  *)
    echo "ERROR: /login returned HTTP ${status:-connection-failed}." >&2
    fail_with_logs
    ;;
esac

echo "Local checks passed. Opening Cloudflare quick tunnel..."
echo "Keep this terminal running and use the https://...trycloudflare.com URL printed below."
exec cloudflared tunnel --no-autoupdate --protocol http2 --url http://127.0.0.1:8080