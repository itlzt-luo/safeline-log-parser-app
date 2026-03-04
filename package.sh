#!/bin/bash

# 快速打包脚本 - 用于在本地生成部署包

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}生成部署包${NC}"
echo -e "${GREEN}================================${NC}\n"

# 包名
PACKAGE_NAME="log-parser-app-$(date +%Y%m%d_%H%M%S).tar.gz"

echo -e "${YELLOW}正在打包...${NC}"
echo "排除: node_modules, client/node_modules, client/build, .git, uploads, logs"
echo ""

# 创建压缩包
tar -czf "$PACKAGE_NAME" \
  --exclude='node_modules' \
  --exclude='client/node_modules' \
  --exclude='client/build' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='logs' \
  --exclude='backup_*' \
  --exclude='*.log' \
  --exclude='*.pid' \
  --exclude='.DS_Store' \
  --exclude='log-parser-app-*.tar.gz' \
  .

if [ $? -eq 0 ]; then
    PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
    echo -e "${GREEN}✓ 打包完成！${NC}"
    echo ""
    echo -e "${BLUE}包文件: ${NC}$PACKAGE_NAME"
    echo -e "${BLUE}包大小: ${NC}$PACKAGE_SIZE"
    echo ""
    echo -e "${YELLOW}上传到服务器:${NC}"
    echo "  scp $PACKAGE_NAME user@server-ip:/opt/"
    echo ""
    echo -e "${YELLOW}在服务器上解压并部署:${NC}"
    echo "  ssh user@server-ip"
    echo "  cd /opt"
    echo "  tar -xzf $PACKAGE_NAME"
    echo "  cd log-parser-app"
    echo "  chmod +x deploy.sh"
    echo "  ./deploy.sh"
    echo ""
else
    echo -e "${RED}✗ 打包失败${NC}"
    exit 1
fi
