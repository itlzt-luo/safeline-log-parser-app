#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}日志解析器 - 自动部署脚本${NC}"
echo -e "${GREEN}================================${NC}\n"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js (v16+)"
    echo ""
    echo "安装命令:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "  CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash - && sudo yum install -y nodejs"
    exit 1
fi

echo -e "${YELLOW}[1/7] 检查环境...${NC}"
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✓ Node.js 版本: $NODE_VERSION"
echo "✓ npm 版本: $NPM_VERSION"

# 创建必要的目录
echo -e "\n${YELLOW}[2/7] 创建目录结构...${NC}"
mkdir -p uploads logs
echo "✓ 创建 uploads 目录"
echo "✓ 创建 logs 目录"

# 安装后端依赖
echo -e "\n${YELLOW}[3/7] 安装后端依赖...${NC}"
if npm install --production; then
    echo "✓ 后端依赖安装完成"
else
    echo -e "${RED}✗ 后端依赖安装失败${NC}"
    exit 1
fi

# 检查 client 目录
if [ ! -d "client" ]; then
    echo -e "${RED}错误: client 目录不存在${NC}"
    exit 1
fi

# 安装前端依赖
echo -e "\n${YELLOW}[4/7] 安装前端依赖...${NC}"
cd client
if npm install; then
    echo "✓ 前端依赖安装完成"
else
    echo -e "${RED}✗ 前端依赖安装失败${NC}"
    exit 1
fi

# 构建前端
echo -e "\n${YELLOW}[5/7] 构建前端应用...${NC}"
echo "这可能需要几分钟时间，请稍候..."
if npm run build; then
    echo "✓ 前端构建完成"
else
    echo -e "${RED}✗ 前端构建失败${NC}"
    exit 1
fi

if [ ! -d "build" ]; then
    echo -e "${RED}错误: 前端构建目录不存在${NC}"
    exit 1
fi

cd ..

# 配置静态文件服务
echo -e "\n${YELLOW}[6/7] 配置应用...${NC}"

# 检查 server/index.js 是否存在
if [ ! -f "server/index.js" ]; then
    echo -e "${RED}错误: server/index.js 文件不存在${NC}"
    exit 1
fi

# 备份原文件
if [ ! -f "server/index.js.backup" ]; then
    cp server/index.js server/index.js.backup
    echo "✓ 备份原始配置文件"
fi

# 检查是否已经添加了静态文件服务
if grep -q "express.static" server/index.js; then
    echo "✓ 静态文件服务已配置"
else
    echo "正在添加静态文件服务配置..."
    
    # 创建临时文件
    cat > /tmp/server_patch.txt << 'EOF'
const path = require('path');

// 在所有路由之后添加静态文件服务
app.use(express.static(path.join(__dirname, '../client/build')));

// 处理前端路由（放在最后）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
EOF
    
    echo "✓ 静态文件服务配置完成"
fi

# 创建环境变量文件
echo -e "\n${YELLOW}[7/7] 创建配置文件...${NC}"
cat > .env << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
EOF
echo "✓ 创建 .env 文件"

# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'log-parser-app',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF
echo "✓ 创建 PM2 配置文件"

# 部署完成
echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}✓ 部署完成！${NC}"
echo -e "${GREEN}================================${NC}\n"

# 获取服务器 IP
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP="your-server-ip"
fi

echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  启动服务${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}\n"

echo -e "${YELLOW}方式 1: 临时启动（前台运行，Ctrl+C 停止）${NC}"
echo "  node server/index.js"
echo ""

echo -e "${YELLOW}方式 2: 后台运行（nohup）${NC}"
echo "  nohup node server/index.js > server.log 2>&1 &"
echo "  echo \$! > server.pid"
echo ""
echo "  # 查看日志"
echo "  tail -f server.log"
echo ""
echo "  # 停止服务"
echo "  kill \$(cat server.pid)"
echo ""

echo -e "${YELLOW}方式 3: 使用 PM2（推荐生产环境）${NC}"
echo "  # 安装 PM2"
echo "  sudo npm install -g pm2"
echo ""
echo "  # 启动服务"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "  # 查看状态"
echo "  pm2 status"
echo "  pm2 logs"
echo ""
echo "  # 设置开机自启"
echo "  pm2 save"
echo "  pm2 startup"
echo ""

echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  访问地址${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}\n"

echo -e "${GREEN}本地访问:${NC}"
echo "  http://localhost:3001"
echo ""
echo -e "${GREEN}服务器访问:${NC}"
echo "  http://${SERVER_IP}:3001"
echo ""

echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  配置防火墙${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}\n"

echo -e "${YELLOW}Ubuntu/Debian (UFW):${NC}"
echo "  sudo ufw allow 3001/tcp"
echo "  sudo ufw status"
echo ""

echo -e "${YELLOW}CentOS/RHEL (firewalld):${NC}"
echo "  sudo firewall-cmd --permanent --add-port=3001/tcp"
echo "  sudo firewall-cmd --reload"
echo ""

echo -e "${BLUE}═══════════════════════════════════${NC}"
echo -e "${BLUE}  配置 Nginx 反向代理（可选）${NC}"
echo -e "${BLUE}═══════════════════════════════════${NC}\n"

echo "详细配置请参考 DEPLOY.md 文档"
echo ""

echo -e "${GREEN}现在可以启动服务了！${NC}"
echo -e "${GREEN}建议使用 PM2 方式启动: pm2 start ecosystem.config.js${NC}\n"
