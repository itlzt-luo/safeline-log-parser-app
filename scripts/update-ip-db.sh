#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}IP归属地数据库 (ip2region) 更新脚本${NC}"
echo -e "${GREEN}================================${NC}\n"

# 切换到项目根目录
cd "$(dirname "$0")/.." || exit 1
PROJECT_ROOT=$(pwd)

# 确保 data 目录存在
DATA_DIR="${PROJECT_ROOT}/server/data"
mkdir -p "${DATA_DIR}"

DB_PATH="${DATA_DIR}/ip2region.xdb"
DOWNLOAD_URL="https://ghfast.top/https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region_v4.xdb"

echo -e "${YELLOW}正在下载最新版本的 ip2region.xdb...${NC}"
echo "下载地址: ${DOWNLOAD_URL}"
echo ""

# 使用 curl 下载并显示进度条
if curl -L -o "${DB_PATH}.tmp" "${DOWNLOAD_URL}"; then
    echo -e "\n${GREEN}✓ 下载成功！${NC}"
    
    # 替换旧文件
    mv "${DB_PATH}.tmp" "${DB_PATH}"
    
    # 获取文件大小
    FILE_SIZE=$(ls -lh "${DB_PATH}" | awk '{print $5}')
    echo "文件大小: ${FILE_SIZE}"
    echo "保存位置: ${DB_PATH}"
    
    echo -e "\n${YELLOW}提示: 如果服务(Node.js / PM2)正在运行，建议重启服务以将新数据库加载到内存中。${NC}"
    
    # 尝试检测并重启 pm2 服务
    if command -v pm2 &> /dev/null; then
        if pm2 info log-parser-app &> /dev/null || pm2 info log-parser-api &> /dev/null; then
            echo -e "\n${YELLOW}检测到 PM2 进程，是否自动重启后端服务？[Y/n]${NC} \c"
            read -r RESTART_SVC
            if [[ "$RESTART_SVC" != "n" && "$RESTART_SVC" != "N" ]]; then
                echo "正在重启服务..."
                pm2 restart log-parser-app 2>/dev/null || pm2 restart log-parser-api 2>/dev/null || pm2 restart all
                echo -e "${GREEN}✓ 服务重启完毕！${NC}"
            fi
        fi
    fi
else
    echo -e "\n${RED}✗ 下载失败，请检查您的网络连接或稍后再试。${NC}"
    rm -f "${DB_PATH}.tmp"
    exit 1
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}更新流程执行完毕。${NC}"
echo -e "${GREEN}================================${NC}\n"
