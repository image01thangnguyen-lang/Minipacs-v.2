#!/bin/bash

# Màu sắc để hiển thị console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Đọc file .env nếu có để lấy cấu hình
SERVER_IP="localhost"
ORTHANC_ADMIN_USER="admin"
ORTHANC_ADMIN_PASSWORD="admin_password"

if [ ! -f .env ] && [ -f .env.example ]; then
  echo -e "${YELLOW}Không tìm thấy file .env. Đang tự động tạo từ .env.example...${NC}"
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
  echo -e "${GREEN}                             CÁC DỊCH VỤ PACS/RIS ĐANG CHẠY TRÊN CỔNG:${NC}"
  echo -e "${CYAN}====================================================================================================${NC}"
  echo -e " 🚀 ${GREEN}RIS Dashboard (Next.js)  : http://${SERVER_IP}${NC} (Cổng 80)"
  echo -e " 👁️  ${GREEN}OHIF Viewer (DICOM)      : http://${SERVER_IP}:3000${NC} (Cổng 3000)"
  echo -e " ⚙️  ${GREEN}Orthanc Web Interface    : http://${SERVER_IP}:8042${NC} (Cổng 8042) - Tài khoản: ${YELLOW}${ORTHANC_ADMIN_USER}${NC} / Mật khẩu: ${YELLOW}${ORTHANC_ADMIN_PASSWORD}${NC}"
  echo -e " 📦 ${GREEN}Orthanc DICOM Server     : Cổng 4242${NC}"
  echo -e "${CYAN}====================================================================================================${NC}\n"
}

ACTION=$1

if [ -z "$ACTION" ]; then
  echo -e "${YELLOW}Cách sử dụng: ./manage.sh [start | restart | stop | status]${NC}"
  exit 1
fi

case "$ACTION" in
  start)
    echo -e "${GREEN}Đang khởi động hệ thống...${NC}"
    if docker compose version &> /dev/null; then
        docker compose up -d
    else
        docker-compose up -d
    fi
    print_ports
    ;;
  restart)
    echo -e "${YELLOW}Đang khởi động lại hệ thống...${NC}"
    if docker compose version &> /dev/null; then
        docker compose restart
    fi
    print_ports
    ;;
  stop)
    echo -e "${YELLOW}Đang tắt các container...${NC}"
    if docker compose version &> /dev/null; then
        docker compose stop
    else
        docker-compose stop
    fi
    echo -e "${GREEN}Đã tắt toàn bộ dịch vụ.${NC}"
    ;;
  status)
    echo -e "${CYAN}Trạng thái các container:${NC}"
    if docker compose version &> /dev/null; then
        docker compose ps
    else
        docker-compose ps
    fi
    print_ports
    ;;
  *)
    echo -e "${YELLOW}Lựa chọn không hợp lệ. Hãy chọn: start | restart | stop | status${NC}"
    ;;
esac
