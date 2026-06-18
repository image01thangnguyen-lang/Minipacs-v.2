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

# 3. Đồng bộ và sinh lại file cấu hình từ template nếu có cập nhật từ .env (Day 2+)
echo -e "${YELLOW}[2/5] Đồng bộ và sinh file cấu hình thực tế từ template...${NC}"
if [ -f .env ]; then
  # Load các biến môi trường từ .env một cách an toàn
  while IFS= read -r line || [ -n "$line" ]; do
    if [[ ! "$line" =~ ^# ]] && [[ "$line" =~ = ]]; then
      key=$(echo "$line" | cut -d'=' -f1 | xargs)
      val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)
      export "$key"="$val"
    fi
  done < .env
fi

# Đảm bảo thư mục config tồn tại
mkdir -p config

# Hàm sinh file cấu hình an toàn
generate_config() {
    local template="$1"
    local output="$2"
    
    # Kiểm tra xem có bị lỗi Docker tự động tạo thư mục rỗng hay không
    if [ -d "$output" ]; then
        echo -e "${YELLOW}Cảnh báo: Phát hiện lỗi Docker biến file $output thành một thư mục. Tiến hành xóa thư mục rỗng và phục hồi nâng cấp thành dạng file...${NC}"
        sudo rm -rf "$output"
    fi

    echo -e "${GREEN}Đang cấu hình: $output...${NC}"
    cp "$template" "$output"
    
    # Thay thế các biến từ file .env sang cấu hình thực tế
    for var in SERVER_IP POSTGRES_PASSWORD ORTHANC_ADMIN_USER ORTHANC_ADMIN_PASSWORD; do
        val="${!var}"
        # Thoát các ký tự đặc biệt cho sed trước khi thế vào
        escaped_val=$(echo "$val" | sed 's/[\/&]/\\&/g')
        sed -i "s/\${$var}/$escaped_val/g" "$output"
        sed -i "s/\$$var/$escaped_val/g" "$output"
    done
}

if [ -f config_templates/app-config.js.template ]; then
    generate_config config_templates/app-config.js.template config/app-config.js
fi

if [ -f config_templates/orthanc.json.template ]; then
    generate_config config_templates/orthanc.json.template config/orthanc.json
fi

# 4. Gỡ bỏ container cũ (Giữ lại Data Volumes)
echo -e "${GREEN}[3/5] Dọn dẹp container cũ đang chạy...${NC}"
if docker compose version &> /dev/null; then
    docker compose down
else
    docker-compose down
fi
echo "Đã hạ các container cũ."

# 5. Build và khởi động lại container với code mới
echo -e "${GREEN}[4/5] Build lại Image và tái khởi động hệ thống...${NC}"
if docker compose version &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi
echo "Hệ thống đã khởi chạy thành công."

# 6. Dọn dẹp rác Docker
echo -e "${GREEN}[5/5] Dọn dẹp tài nguyên dư thừa...${NC}"
docker image prune -f
echo "Đã giải phóng ổ cứng."

# 6. Hoàn thành
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}Cập nhật thành công! Hệ thống đã online với phiên bản mới nhất.${NC}"
echo -e "${GREEN}================================================================${NC}"
