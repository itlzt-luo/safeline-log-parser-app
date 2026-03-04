#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}日志解析器 - 更新脚本${NC}"
echo -e "${GREEN}================================${NC}\n"

# 备份当前版本
echo -e "${YELLOW}[1/6] 备份当前版本...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$BACKUP_DIR"
cp -r . "../$BACKUP_DIR/" 2>/dev/null
echo "✓ 备份到: ../$BACKUP_DIR"

# 拉取最新代码（如果使用 Git）
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}[2/6] 拉取最新代码...${NC}"
    if git pull; then
        echo "✓ 代码更新完成"
    else
        echo -e "${RED}✗ 代码拉取失败${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}[2/6] 跳过 Git 更新（非 Git 仓库）${NC}"
fi

# 更新后端依赖
echo -e "\n${YELLOW}[3/6] 更新后端依赖...${NC}"
if npm install --production; then
    echo "✓ 后端依赖更新完成"
else
    echo -e "${RED}✗ 后端依赖更新失败${NC}"
    exit 1
fi

# 更新前端依赖
echo -e "\n${YELLOW}[4/6] 更新前端依赖...${NC}"
cd client
if npm install; then
    echo "✓ 前端依赖更新完成"
else
    echo -e "${RED}✗ 前端依赖更新失败${NC}"
    exit 1
fi

# 重新构建前端
echo -e "\n${YELLOW}[5/6] 重新构建前端...${NC}"
echo "构建中，请稍候..."
if npm run build; then
    echo "✓ 前端构建完成"
else
    echo -e "${RED}✗ 前端构建失败${NC}"
    exit 1
fi

cd ..

# 重启服务
echo -e "\n${YELLOW}[6/6] 重启服务...${NC}"

# 检查是否使用 PM2
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "log-parser-app"; then
        pm2 reload log-parser-app
        echo "✓ 使用 PM2 重启服务"
        pm2 status
    else
        echo -e "${YELLOW}PM2 中未找到应用，请手动启动:${NC}"
        echo "  pm2 start ecosystem.config.js"
    fi
else
    # 查找并停止旧进程
    PID=$(lsof -ti:3001 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill $PID
        sleep 2
        echo "✓ 已停止旧服务 (PID: $PID)"
    fi
    
    # 提示手动启动
    echo -e "${YELLOW}请手动启动服务:${NC}"
    echo "  nohup node server/index.js > server.log 2>&1 &"
    echo "或使用 PM2:"
    echo "  pm2 start ecosystem.config.js"
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ 更新完成！${NC}"
echo -e "${GREEN}================================${NC}\n"

# 显示服务状态
if command -v pm2 &> /dev/null && pm2 list | grep -q "log-parser-app"; then
    echo -e "${BLUE}当前服务状态:${NC}"
    pm2 status log-parser-app
fi
