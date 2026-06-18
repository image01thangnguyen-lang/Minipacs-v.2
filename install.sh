#!/bin/bash

# --- Bảng màu cho Terminal ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# 1. Clear màn hình và In Logo
clear
echo -e "${MAGENTA}"
cat << "EOF"
 __  __ᏆNᏆ  ᏢᎪᏟS   _____ ______ _______ _    _ _____  
|  \/  |  _ \_   _| |  __ \  ____|__   __| |  | |  __ \ 
| \  / | |_) || |   | |__) | |__     | |  | |  | | |__) |
| |\/| |  _ < | |   |  ___/|  __|    | |  | |  | |  ___/ 
| |  | | |_) || |_  | |    | |____   | |  | |__| | |     
|_|  |_|____/_____| |_|    |______|  |_|   \____/|_|     
                                                         
EOF
echo -e "${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "${GREEN}      HỆ THỐNG MINI PACS - TỰ ĐỘNG CÀI ĐẶT            ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Kiểm tra và Cài đặt Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[*] Đang cài đặt Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}[+] Đã cài đặt Docker thành công.${NC}"
else
    echo -e "${GREEN}[+] Docker đã có sẵn trên máy.${NC}"
fi

# Cài đặt Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}[*] Đang cài đặt Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}[+] Đã cài đặt Docker Compose thành công.${NC}"
fi

# 2. Thu thập cấu hình (Interactive Prompts)
echo -e "\n${CYAN}--- CẤU HÌNH HỆ THỐNG ---${NC}"
read -p "Nhập IP của máy Server hiện tại (VD: 192.168.1.100): " SERVER_IP
read -p "Nhập Username Admin cho Orthanc [mặc định: admin]: " ORTHANC_ADMIN_USER
ORTHANC_ADMIN_USER=${ORTHANC_ADMIN_USER:-admin}
read -s -p "Nhập Password cho Admin Orthanc: " ORTHANC_ADMIN_PASSWORD
echo ""
read -s -p "Nhập Password cho PostgreSQL Database: " POSTGRES_PASSWORD
echo ""

# 3. Tạo file .env và dashboard/.env
echo -e "\n${YELLOW}[*] Đang tạo các file môi trường (.env)...${NC}"
cat <<EOF > .env
SERVER_IP=${SERVER_IP}
ORTHANC_ADMIN_USER=${ORTHANC_ADMIN_USER}
ORTHANC_ADMIN_PASSWORD=${ORTHANC_ADMIN_PASSWORD}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
EOF

mkdir -p ./dashboard
cat <<EOF > ./dashboard/.env
NEXT_PUBLIC_OHIF_URL=http://${SERVER_IP}:3000
ORTHANC_API_URL=http://orthanc:8042
ORTHANC_USERNAME=${ORTHANC_ADMIN_USER}
ORTHANC_PASSWORD=${ORTHANC_ADMIN_PASSWORD}
EOF

# 4. Sinh các file JSON và JS từ Templates
echo -e "${YELLOW}[*] Đang sinh file cấu hình hệ thống từ templates...${NC}"
mkdir -p ./config

export SERVER_IP ORTHANC_ADMIN_USER ORTHANC_ADMIN_PASSWORD POSTGRES_PASSWORD
envsubst < ./config_templates/orthanc.json.template > ./config/orthanc.json
envsubst < ./config_templates/app-config.js.template > ./config/app-config.js

# 5. Phân quyền thư mục Data (Volume Mount sống còn)
echo -e "${YELLOW}[*] Đang tạo thư mục Data lưu trữ...${NC}"
mkdir -p ./pacs_data/postgres
mkdir -p ./pacs_data/orthanc
sudo chmod -R 777 ./pacs_data

# 6. Khởi động hệ thống
echo -e "\n${CYAN}======================================================${NC}"
echo -e "${GREEN}     ĐANG XÂY DỰNG & KHỞI ĐỘNG HỆ THỐNG...${NC}"
echo -e "${CYAN}======================================================${NC}"

docker compose up -d --build || docker-compose up -d --build

# 7. In ra màn hình các đường link
echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}[THÀNH CÔNG] Hệ thống Mini PACS đã chạy ngầm!${NC}"
echo -e "\n${CYAN}Truy cập các dịch vụ:${NC}"
echo -e " 🚀 ${GREEN}Dashboard (Next.js)      : http://${SERVER_IP}${NC}"
echo -e " 👁️  ${GREEN}OHIF Viewer (DICOM)      : http://${SERVER_IP}:3000${NC}"
echo -e " ⚙️  ${GREEN}Orthanc Admin Portal     : http://${SERVER_IP}:8042${NC}"
echo -e "\n${YELLOW}Tài khoản Orthanc: ${ORTHANC_ADMIN_USER} / <Mật khẩu bạn đã điền>${NC}"
echo -e "${GREEN}======================================================${NC}"

