#!/bin/bash

# ==============================================================================
# MINI PACS V2 - DEPLOYMENT SCRIPT (DAY 1)
# ==============================================================================
# Script này dành cho việc cài đặt hệ thống từ con số 0 trên máy Linux mới.
# ==============================================================================

set -e

# Màu sắc để hiển thị console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Bắt đầu quá trình Cài đặt Mini PACS v2...${NC}"

# 1. Kiểm tra và cài đặt các phụ thuộc (Docker, Docker Compose, Git)
echo -e "${YELLOW}[1/4] Kiểm tra các phần mềm cần thiết...${NC}"

if ! command -v git &> /dev/null; then
    echo "Git chưa được cài đặt. Đang tiến hành cài đặt Git..."
    sudo apt-get update && sudo apt-get install -y git
else
    echo "Git đã được cài đặt."
fi

if ! command -v docker &> /dev/null; then
    echo "Docker chưa được cài đặt. Đang lấy script cài đặt Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    # Thêm user hiện tại vào group docker
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}Lưu ý: Bạn có thể cần đăng xuất và đăng nhập lại để sử dụng Docker không cần sudo.${NC}"
else
    echo "Docker đã được cài đặt."
fi

# Kiểm tra Docker Compose (plugin hoặc standalone)
if ! docker compose version &> /dev/null && ! docker-compose version &> /dev/null; then
    echo "Docker Compose chưa được cài đặt. Đang tiến hành cài đặt..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
else
    echo "Docker Compose đã được cài đặt."
fi

# 2. Tạo cấu trúc thư mục chứa dữ liệu vật lý (Bất khả xâm phạm)
echo -e "${YELLOW}[2/4] Thiết lập không gian lưu trữ dữ liệu (pacs_data)...${NC}"
mkdir -p pacs_data/postgres pacs_data/orthanc pacs_data/report_images
sudo chmod -R 777 pacs_data
echo "Đã tạo và phân quyền thành công thư mục pacs_data."

# 3. Quản lý file cấu hình .env
echo -e "${YELLOW}[3/4] Kiểm tra cấu hình hệ thống (.env)...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}File .env đã tồn tại. Giữ nguyên cấu hình cũ nhằm đảm bảo an toàn dữ liệu.${NC}"
else
    if [ -f .env.example ]; then
        echo -e "${YELLOW}Không tìm thấy file .env. Hệ thống sẽ tự động tạo từ .env.example.${NC}"
        cp .env.example .env
        echo -e "${RED}Vui lòng kiểm tra và cập nhật file .env (IP Server, Database Password) trước khi tiếp tục, hoặc nhấn Enter để dùng mặc định.${NC}"
        read -p "Nhấn Enter để tiếp tục..."
    else
        echo -e "${RED}LỖI: Không tìm thấy file .env và .env.example! Vui lòng kiểm tra lại mã nguồn.${NC}"
        exit 1
    fi
fi

# 3.5. Kiểm tra và Tự động phục hồi Frontend Dashboard (Self-Healing)
echo -e "${YELLOW}[3.5] Kiểm tra cấu trúc thư mục dashboard (Next.js)...${NC}"
if [ ! -f ./dashboard/package.json ] || [ ! -f ./dashboard/Dockerfile ] || ! grep -q "legacy-peer-deps" ./dashboard/Dockerfile; then
    echo -e "${YELLOW}Phát hiện thiếu cấu hình hoặc Dockerfile chưa tối ưu (vẫn dùng kiểu cài của cũ).${NC}"
    echo -e "${YELLOW}Bắt đầu chạy kịch bản Tự động khôi phục / Đồng bộ cấu hình Next.js mới nhất...${NC}"
    if [ -f ./init-frontend.sh ]; then
        chmod +x ./init-frontend.sh
        bash ./init-frontend.sh
    else
        echo -e "${RED}LỖI: Không tìm thấy file init-frontend.sh để phục hồi!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}Mã nguồn và cấu hình Docker của Dashboard đã đầy đủ & tối ưu.${NC}"
fi

# 4. Khởi chạy hệ thống bằng Docker Compose
echo -e "${YELLOW}[4/4] Khởi tạo hệ thống (Build & Run)...${NC}"
# Sử dụng 'docker compose' (plugin mới) hoặc 'docker-compose' (bản cũ)
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo -e "${GREEN}======================================================${NC}"
echo -e "${GREEN}Hoàn tất! Hệ thống Mini PACS v2 đã được cài đặt và đang chạy.${NC}"
echo -e "${GREEN}======================================================${NC}"
