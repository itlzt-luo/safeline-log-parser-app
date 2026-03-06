#!/bin/bash

# 日志清理脚本
# 用于定期清理上传文件和日志

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}开始清理...${NC}"

# 当前目录
WORK_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$WORK_DIR"

# 清理上传的临时文件（7天前）
echo -e "\n${YELLOW}清理上传文件（7天前）...${NC}"
if [ -d "uploads" ]; then
    DELETED_UPLOADS=$(find uploads -type f -mtime +7 -delete -print | wc -l)
    echo "✓ 删除了 $DELETED_UPLOADS 个文件"
else
    echo "uploads 目录不存在"
fi

# 清理旧日志（30天前）
echo -e "\n${YELLOW}清理旧日志（30天前）...${NC}"
if [ -d "logs" ]; then
    DELETED_LOGS=$(find logs -name "*.log" -mtime +30 -delete -print | wc -l)
    echo "✓ 删除了 $DELETED_LOGS 个日志文件"
else
    echo "logs 目录不存在"
fi

# 清理 PM2 日志
echo -e "\n${YELLOW}清理 PM2 日志...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 flush log-parser-app 2>/dev/null
    echo "✓ PM2 日志已清理"
else
    echo "PM2 未安装，跳过"
fi

# 显示磁盘使用情况
echo -e "\n${YELLOW}当前磁盘使用情况:${NC}"
du -sh uploads 2>/dev/null || echo "uploads: 0"
du -sh logs 2>/dev/null || echo "logs: 0"

echo -e "\n${GREEN}清理完成！${NC}"
