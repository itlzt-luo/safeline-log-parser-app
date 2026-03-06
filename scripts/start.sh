#!/bin/bash

# SafeLine 日志解析器 - 快速启动脚本
# 用途：一键启动开发环境

echo "🚀 SafeLine 日志解析器 - 启动中..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请访问 https://nodejs.org 下载安装"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

# 检查依赖
if [ ! -d "node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 首次启动，正在安装依赖..."
    echo "这可能需要几分钟时间，请耐心等待..."
    echo ""
    npm run install-all
    echo ""
    echo "✅ 依赖安装完成！"
    echo ""
fi

# 启动应用
echo "🎬 启动开发服务器..."
echo ""
echo "📝 提示:"
echo "  - 前端: http://localhost:3000"
echo "  - 后端: http://localhost:3001"
echo "  - 按 Ctrl+C 停止服务"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
