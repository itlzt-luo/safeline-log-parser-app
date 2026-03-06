#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}配置自动更新 IP 库定时任务${NC}"
echo -e "${GREEN}================================${NC}\n"

# 切换到项目根目录
cd "$(dirname "$0")/.." || exit 1
PROJECT_ROOT=$(pwd)
UPDATE_SCRIPT="${PROJECT_ROOT}/scripts/update-ip-db.sh"

if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo -e "${RED}错误: 找不到更新脚本 $UPDATE_SCRIPT${NC}"
    exit 1
fi

# 每月 1 号凌晨 3 点执行
CRON_JOB="0 3 1 * * $UPDATE_SCRIPT > ${PROJECT_ROOT}/logs/update-ip.log 2>&1"

# 检查是否已存在
if crontab -l 2>/dev/null | grep -q "update-ip-db.sh"; then
    echo -e "${YELLOW}定时任务已存在！${NC}"
    echo "当前 crontab 配置:"
    crontab -l | grep "update-ip-db.sh"
else
    # 添加到 crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✓ 成功添加定时任务！${NC}"
    echo "新的定时任务: 每月 1 号 03:00 自动执行更新脚本。"
fi
