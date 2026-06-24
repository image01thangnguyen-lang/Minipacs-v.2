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
UPDATE_REEXECED="${MINIPACS_UPDATE_REEXECED:-0}"
OHIF_VERSION="v3.7.0"
OHIF_IMAGE_NAME="minipacs-ohif:v3.7.0"
OHIF_SOURCE_DOCKERFILE="docker/ohif-v3.7/Dockerfile"
OHIF_CUSTOM_MARKER="mpacs-workstation-shell"
OHIF_VIEWPORT_GUARD_MARKER="element.id === 'root'"
OHIF_ROUTE_FIX_MARKER="OHIF v3 accepts /viewer?StudyInstanceUIDs=..."
OHIF_INDEX_MARKER="mpacs-20260624-ohif370-source"
OHIF_CONFIG_MARKER="defaultDataSourceName: 'dicomweb'"
OHIF_NGINX_HEADER_MARKER="Cross-Origin-Embedder-Policy require-corp"

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

http_get() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    return 127
  fi
}

contains_text() {
  local haystack="$1"
  local needle="$2"

  grep -Fq -- "$needle" <<< "$haystack"
}

run_as_repo_user() {
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    sudo -u "$RUN_USER" -H bash -lc "cd '$PROJECT_DIR' && $*"
  else
    bash -lc "cd '$PROJECT_DIR' && $*"
  fi
}

fix_repo_permissions() {
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    local run_group
    run_group="$(id -gn "$RUN_USER")"

    info "Fixing repository permissions..."
    chown "$RUN_USER:$run_group" "$PROJECT_DIR"

    # Keep PACS data untouched; it may contain large medical image and database volumes.
    find "$PROJECT_DIR" -mindepth 1 -maxdepth 1 ! -name pacs_data -exec chown -R "$RUN_USER:$run_group" {} +
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
  info "[1/9] Pulling latest code..."

  [ -d .git ] || fail "This folder is not a git repository: $PROJECT_DIR"

  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ]; then
    run_as_repo_user "git fetch origin"
    run_as_repo_user "git reset --hard origin/main"
  else
    git fetch origin
    git reset --hard origin/main
  fi

  if [ "$UPDATE_REEXECED" != "1" ]; then
    info "Reloading updated update.sh before continuing..."
    export MINIPACS_UPDATE_REEXECED=1
    exec bash "$PROJECT_DIR/update.sh"
  fi
}

wait_for_database() {
  info "Waiting for PostgreSQL..."

  local max_attempts=45
  local attempt=1
  local db_user="${POSTGRES_USER:-orthanc}"
  local db_name="${POSTGRES_DB:-orthanc_db}"

  while [ "$attempt" -le "$max_attempts" ]; do
    if compose exec -T db pg_isready -U "$db_user" -d "$db_name" >/dev/null 2>&1; then
      return 0
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  compose ps || true
  fail "PostgreSQL did not become ready."
}

apply_database_schema() {
  info "[8/9] Applying dashboard Prisma schema..."
  compose run --rm --no-deps dashboard ./node_modules/.bin/prisma db push --skip-generate
}

validate_ohif_custom_assets() {
  info "Validating OHIF custom viewer assets..."

  [ -f config/ohif-custom.js ] || fail "Missing config/ohif-custom.js"
  [ -f config/ohif-custom.css ] || fail "Missing config/ohif-custom.css"
  [ -f config/ohif-nginx.conf ] || fail "Missing config/ohif-nginx.conf"
  [ -f "$OHIF_SOURCE_DOCKERFILE" ] || fail "Missing $OHIF_SOURCE_DOCKERFILE"

  grep -Fq "$OHIF_CUSTOM_MARKER" config/ohif-custom.js || fail "config/ohif-custom.js does not contain the MiniPACS workstation shell marker."
  grep -Fq "$OHIF_VIEWPORT_GUARD_MARKER" config/ohif-custom.js || fail "config/ohif-custom.js does not contain the MiniPACS viewport root guard."
  grep -Fq "$OHIF_ROUTE_FIX_MARKER" config/ohif-custom.js || fail "config/ohif-custom.js still looks like it may rewrite OHIF v3 viewer routes."
  grep -Fq "mpacs-workstation-viewer" config/ohif-custom.css || fail "config/ohif-custom.css does not contain the MiniPACS workstation viewer styles."
  grep -Fq "OHIF_GIT_REF=$OHIF_VERSION" "$OHIF_SOURCE_DOCKERFILE" || fail "$OHIF_SOURCE_DOCKERFILE is not pinned to OHIF $OHIF_VERSION."
  grep -Fq "$OHIF_INDEX_MARKER" "$OHIF_SOURCE_DOCKERFILE" || fail "$OHIF_SOURCE_DOCKERFILE does not inject the MiniPACS OHIF v3.7 assets."
  grep -Fq "$OHIF_IMAGE_NAME" docker-compose.yml || fail "docker-compose.yml is not configured to use $OHIF_IMAGE_NAME."
  grep -Fq "$OHIF_NGINX_HEADER_MARKER" config/ohif-nginx.conf || fail "config/ohif-nginx.conf is missing the OHIF v3 cross-origin isolation header."
}

build_and_start() {
  info "[4/9] Rebuilding dashboard image..."
  compose build dashboard

  info "[5/9] Building OHIF Viewer $OHIF_VERSION from OHIF/Viewers source..."
  compose build ohif

  info "[6/9] Stopping old containers..."
  compose down

  info "[7/9] Starting database and PACS services..."
  compose up -d db orthanc
  wait_for_database
  apply_database_schema

  info "[9/9] Starting Mini PACS..."
  compose up -d

  info "Recreating OHIF viewer so $OHIF_IMAGE_NAME and custom viewer shell are active..."
  compose up -d --force-recreate --no-deps ohif
}

wait_for_dashboard() {
  info "Checking services..."

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

wait_for_ohif_custom_assets() {
  info "Checking OHIF $OHIF_VERSION custom viewer shell and DICOMweb config..."

  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    warn "curl/wget is not installed. Skipping HTTP verification of OHIF custom assets."
    return 0
  fi

  local max_attempts=35
  local attempt=1
  local index_content
  local js_content
  local css_content
  local app_config_content

  while [ "$attempt" -le "$max_attempts" ]; do
    index_content="$(http_get http://127.0.0.1:3000/index.html 2>/dev/null || true)"
    js_content="$(http_get http://127.0.0.1:3000/ohif-custom.js 2>/dev/null || true)"
    css_content="$(http_get http://127.0.0.1:3000/ohif-custom.css 2>/dev/null || true)"
    app_config_content="$(http_get http://127.0.0.1:3000/app-config.js 2>/dev/null || true)"

    if contains_text "$index_content" "ohif-custom.js" &&
       contains_text "$index_content" "ohif-custom.css" &&
       contains_text "$index_content" "$OHIF_INDEX_MARKER" &&
       contains_text "$js_content" "$OHIF_CUSTOM_MARKER" &&
       contains_text "$js_content" "$OHIF_VIEWPORT_GUARD_MARKER" &&
       contains_text "$js_content" "$OHIF_ROUTE_FIX_MARKER" &&
       contains_text "$css_content" "mpacs-workstation-viewer" &&
       contains_text "$app_config_content" "$OHIF_CONFIG_MARKER" &&
       contains_text "$app_config_content" "qidoRoot: '/dicom-web'" &&
       contains_text "$app_config_content" "wadoRoot: '/dicom-web'"; then
      info "OHIF $OHIF_VERSION custom viewer shell is active and points to Orthanc DICOMweb."
      return 0
    fi

    sleep 2
    attempt=$((attempt + 1))
  done

  echo
  warn "OHIF did not serve the new custom viewer shell."
  echo "Local asset sizes:"
  wc -c config/ohif-custom.js config/ohif-custom.css || true
  echo
  echo "Served asset sizes:"
  http_get http://127.0.0.1:3000/ohif-custom.js 2>/dev/null | wc -c || true
  http_get http://127.0.0.1:3000/ohif-custom.css 2>/dev/null | wc -c || true
  http_get http://127.0.0.1:3000/app-config.js 2>/dev/null | wc -c || true
  echo
  fail_ohif_with_logs
}

fail_with_logs() {
  echo -e "${RED}Dashboard did not become healthy. Recent logs:${NC}"
  compose ps || true
  echo
  compose logs --tail=160 dashboard || true
  exit 1
}

fail_ohif_with_logs() {
  echo -e "${RED}OHIF custom viewer shell was not verified. Recent logs:${NC}"
  compose ps || true
  echo
  compose logs --tail=160 ohif || true
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
fix_repo_permissions
update_code

info "[2/9] Preparing local storage and config..."
load_env_file
ensure_data_dirs
generate_config config_templates/app-config.js.template config/app-config.js
generate_config config_templates/orthanc.json.template config/orthanc.json

info "[3/9] Validating Docker access..."
docker info >/dev/null 2>&1 || fail "Docker is not accessible. Run with sudo or add your user to the docker group."

validate_ohif_custom_assets
build_and_start
wait_for_dashboard
wait_for_ohif_custom_assets
docker image prune -f >/dev/null 2>&1 || true
print_urls
