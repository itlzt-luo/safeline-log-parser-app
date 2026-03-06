#!/bin/bash

# SafeLine 日志解析器 - PM2 启动脚本
# 用途：使用 PM2 启动生产环境

echo "🚀 SafeLine 日志解析器 - PM2 启动..."
echo ""

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "⚠️  未安装 PM2，正在安装..."
    npm install -g pm2
    echo ""
fi

echo "✅ PM2 版本: $(pm2 --version)"
echo ""

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

# 确保日志目录存在
mkdir -p logs

# 停止旧进程（如果存在）
echo "🔄 检查现有进程..."
if pm2 describe log-parser-app &> /dev/null; then
    echo "   停止旧进程..."
    pm2 stop log-parser-app
    pm2 delete log-parser-app
fi

echo ""
echo "🎬 启动应用..."

# 启动应用
pm2 start config/ecosystem.config.js

echo ""
echo "✅ 应用已启动！"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs log-parser-app"
echo "  重启应用: pm2 restart log-parser-app"
echo "  停止应用: pm2 stop log-parser-app"
echo "  监控面板: pm2 monit"
echo ""
echo "🌐 访问地址:"
echo "  应用界面: http://localhost:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 显示状态
pm2 status
