#!/bin/bash

set -Eeuo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Màu sắc để hiển thị console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Đọc file .env nếu có để lấy cấu hình
SERVER_IP="localhost"
ORTHANC_ADMIN_USER="admin"
ORTHANC_ADMIN_PASSWORD="admin_password"

if [ ! -f .env ] || ! grep -q "POSTGRES_PASSWORD=" .env; then
  echo -e "${YELLOW}Không tìm thấy file .env hoặc file bị lỗi. Đang tự động tạo từ .env.example...${NC}"
  cp .env.example .env
fi

if [ -f .env ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ ! "$line" =~ ^# ]] && [[ "$line" =~ = ]]; then
      key=$(echo "$line" | cut -d'=' -f1 | xargs)
      val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)
      if [ "$key" == "SERVER_IP" ]; then
        SERVER_IP="$val"
      elif [ "$key" == "ORTHANC_ADMIN_USER" ]; then
        ORTHANC_ADMIN_USER="$val"
      elif [ "$key" == "ORTHANC_ADMIN_PASSWORD" ]; then
        ORTHANC_ADMIN_PASSWORD="$val"
      fi
    fi
  done < .env
fi

print_ports() {
  echo -e "\n${CYAN}====================================================================================================${NC}"
  echo -e "${GREEN}                        ĐƯỜNG DẪN TRUY CẬP (KHI HỆ THỐNG ĐANG CHẠY):${NC}"
  echo -e "${CYAN}====================================================================================================${NC}"
  echo -e " 🚀 ${GREEN}RIS Dashboard (Next.js)  : http://${SERVER_IP}:8080${NC} (Cổng 8080)"
  echo -e " 👁️  ${GREEN}OHIF Viewer (DICOM)      : http://${SERVER_IP}:8080/viewer${NC} (Cổng 8080)"
  echo -e " ⚙️  ${GREEN}Orthanc Web Interface    : http://${SERVER_IP}:8080/orthanc/${NC} (Cổng 8080) - Tài khoản: ${YELLOW}${ORTHANC_ADMIN_USER}${NC} / Mật khẩu: ${YELLOW}[Lưu trong file .env]${NC}"
  echo -e "${CYAN}====================================================================================================${NC}\n"
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo -e "${YELLOW}Docker Compose is not installed.${NC}"
    exit 1
  fi
}

ACTION="${1:-}"

if [ -z "$ACTION" ]; then
  echo -e "${YELLOW}Cách sử dụng: ./manage.sh [start | restart | stop | status]${NC}"
  exit 1
fi

case "$ACTION" in
  start)
    echo -e "${YELLOW}Lưu ý: Lệnh này KHÔNG cập nhật code hoặc build lại image. Dùng 'sudo bash ./update.sh' để deploy/update.${NC}"
    echo -e "${GREEN}Đang khởi động hệ thống...${NC}"
    compose up -d
    print_ports
    ;;
  restart)
    echo -e "${YELLOW}Đang khởi động lại hệ thống...${NC}"
    compose restart
    print_ports
    ;;
  stop)
    echo -e "${YELLOW}Đang tắt các container...${NC}"
    compose stop
    echo -e "${GREEN}Đã tắt toàn bộ dịch vụ.${NC}"
    ;;
  status)
    echo -e "${CYAN}Trạng thái các container:${NC}"
    compose ps
    print_ports
    ;;
  *)
    echo -e "${YELLOW}Lựa chọn không hợp lệ. Hãy chọn: start | restart | stop | status${NC}"
    ;;
esac
