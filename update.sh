#!/bin/bash

# ==============================================================================
# MINI PACS V2 - UPDATE SCRIPT (DAY 2+)
# ==============================================================================
# Script này dành cho việc cập nhật code UI/Logic mới từ Github MÀ KHÔNG MẤT DỮ LIỆU
# ==============================================================================

set -e

# Màu sắc để hiển thị console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Cảnh báo an toàn dữ liệu
echo -e "${YELLOW}================================================================${NC}"
echo -e "${YELLOW}Đang tiến hành cập nhật hệ thống. Dữ liệu PACS_DATA (Postgres, Orthanc) và file cấu hình (.env) sẽ được giữ nguyên an toàn.${NC}"
echo -e "${YELLOW}================================================================${NC}"
sleep 2

# 2. Cập nhật code mới nhất từ Github (Ghi đè code cũ, không rớt dữ liệu nếu đã có gitignore)
echo -e "${GREEN}[1/4] Kéo mã nguồn mới nhất từ kho lưu trữ (Github)...${NC}"
# Đảm bảo bạn đang ở thư mục dự án khi chạy
git fetch origin
git reset --hard origin/main
echo "Đã lấy mã nguồn thành công."

# 3. Gỡ bỏ container cũ (Giữ lại Data Volumes)
echo -e "${GREEN}[2/4] Dọn dẹp container cũ đang chạy...${NC}"
if docker compose version &> /dev/null; then
    docker compose down
else
    docker-compose down
fi
echo "Đã hạ các container cũ."

# 4. Build và khởi động lại container với code mới
echo -e "${GREEN}[3/4] Build lại Image và tái khởi động hệ thống...${NC}"
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi
echo "Hệ thống đã khởi chạy thành công."

# 5. Dọn dẹp rác Docker
echo -e "${GREEN}[4/4] Dọn dẹp tài nguyên dư thừa...${NC}"
docker image prune -f
echo "Đã giải phóng ổ cứng."

# 6. Hoàn thành
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}Cập nhật thành công! Hệ thống đã online với phiên bản mới nhất.${NC}"
echo -e "${GREEN}================================================================${NC}"
