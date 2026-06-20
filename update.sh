#!/bin/bash

# Mini PACS v2 updater.
# Goal: one command on the server:
#   sudo bash ./update.sh

set -Eeuo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_USER="${SUDO_USER:-$(id -un)}"

cd "$PROJECT_DIR"

info() {
  echo -e "${GREEN}$1${NC}"
}

warn() {
  echo -e "${YELLOW}$1${NC}"
}

fail() {
  echo -e "${RED}$1${NC}"
  exit 1
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    fail "Docker Compose is not installed."
  fi
}

run_as_repo_user() {
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    sudo -u "$RUN_USER" -H bash -lc "cd '$PROJECT_DIR' && $*"
  else
    bash -lc "cd '$PROJECT_DIR' && $*"
  fi
}

load_env_file() {
  if [ ! -f .env ] || ! grep -q "POSTGRES_PASSWORD=" .env; then
    warn "No valid .env found. Creating one from .env.example..."
    [ -f .env.example ] || fail ".env.example not found."
    cp .env.example .env
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    if [[ ! "$line" =~ ^# ]] && [[ "$line" =~ = ]]; then
      key=$(echo "$line" | cut -d'=' -f1 | xargs)
      val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)
      export "$key"="$val"
    fi
  done < .env
}

generate_config() {
  local template="$1"
  local output="$2"

  [ -f "$template" ] || return 0

  if [ -d "$output" ]; then
    warn "$output is a directory. Removing it so the config file can be recreated..."
    rm -rf "$output"
  fi

  mkdir -p "$(dirname "$output")"
  cp "$template" "$output"

  for var in SERVER_IP POSTGRES_PASSWORD ORTHANC_ADMIN_USER ORTHANC_ADMIN_PASSWORD; do
    val="${!var:-}"
    escaped_val=$(echo "$val" | sed 's/[\/&]/\\&/g')
    sed -i "s/\${$var}/$escaped_val/g" "$output"
    sed -i "s/\$$var/$escaped_val/g" "$output"
  done
}

ensure_data_dirs() {
  mkdir -p pacs_data/postgres pacs_data/orthanc pacs_data/report_images pacs_data/worklists config
  chmod -R 777 pacs_data
}

update_code() {
  info "[1/6] Pulling latest code..."

  [ -d .git ] || fail "This folder is not a git repository: $PROJECT_DIR"

  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    run_as_repo_user "git fetch origin"
    run_as_repo_user "git reset --hard origin/main"
  else
    git fetch origin
    git reset --hard origin/main
  fi
}

build_and_start() {
  info "[4/6] Stopping old containers..."
  compose down

  info "[5/6] Rebuilding and starting Mini PACS..."
  compose up -d --build
}

wait_for_dashboard() {
  info "[6/6] Checking services..."

  local max_attempts=45
  local attempt=1

  while [ "$attempt" -le "$max_attempts" ]; do
    if compose ps dashboard 2>/dev/null | grep -q "Up"; then
      if command -v curl >/dev/null 2>&1; then
        if curl -fsS -o /dev/null http://127.0.0.1; then
          return 0
        fi
      else
        return 0
      fi
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  echo
  fail_with_logs
}

fail_with_logs() {
  echo -e "${RED}Dashboard did not become healthy. Recent logs:${NC}"
  compose ps || true
  echo
  compose logs --tail=160 dashboard || true
  exit 1
}

print_urls() {
  local server_ip="${SERVER_IP:-localhost}"

  echo -e "\n${CYAN}============================================================${NC}"
  echo -e "${GREEN}Mini PACS updated and running.${NC}"
  echo -e "${CYAN}============================================================${NC}"
  echo -e "RIS Dashboard : ${GREEN}http://${server_ip}${NC}"
  echo -e "OHIF Viewer   : ${GREEN}http://${server_ip}:3000${NC}"
  echo -e "Orthanc       : ${GREEN}http://${server_ip}:8042${NC}"
  echo -e "${CYAN}============================================================${NC}\n"
}

warn "Updating Mini PACS. Existing pacs_data and .env will be preserved."

load_env_file
update_code

info "[2/6] Preparing local storage and config..."
load_env_file
ensure_data_dirs
generate_config config_templates/app-config.js.template config/app-config.js
generate_config config_templates/orthanc.json.template config/orthanc.json

info "[3/6] Validating Docker access..."
docker info >/dev/null 2>&1 || fail "Docker is not accessible. Run with sudo or add your user to the docker group."

build_and_start
wait_for_dashboard
docker image prune -f >/dev/null 2>&1 || true
print_urls
