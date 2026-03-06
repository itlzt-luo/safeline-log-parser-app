# Linux 服务器部署指南

## 📋 目录
1. [快速部署（推荐）](#快速部署推荐)
2. [手动部署](#手动部署)
3. [Docker 部署](#docker-部署)
4. [PM2 部署](#pm2-部署)
5. [Nginx 反向代理](#nginx-反向代理)
6. [自动化部署脚本](#自动化部署脚本)

---

## 🚀 快速部署（推荐）

### 方式一：一键部署脚本

#### 1. 准备工作
```bash
# 在本地生成部署包
tar -czf log-parser-app.tar.gz \
  --exclude=node_modules \
  --exclude=client/node_modules \
  --exclude=client/build \
  --exclude=.git \
  --exclude=uploads \
  --exclude=*.log \
  .
```

#### 2. 上传到服务器
```bash
# 替换为你的服务器信息
scp log-parser-app.tar.gz user@your-server-ip:/opt/
```

#### 3. 在服务器上执行部署
```bash
# SSH 登录服务器
ssh user@your-server-ip

# 解压并进入目录
cd /opt
tar -xzf log-parser-app.tar.gz -C log-parser-app
cd log-parser-app

# 一键部署（自动安装依赖、构建、启动）
./deploy.sh
```

---

## 📦 手动部署

### 步骤 1: 服务器环境准备

#### 安装 Node.js (推荐 v16+)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

### 步骤 2: 上传项目文件

#### 方式 A: 使用 SCP
```bash
# 在本地执行
scp -r /Volumes/Data/Work/Code/work user@server-ip:/opt/log-parser-app
```

#### 方式 B: 使用 Git
```bash
# 在服务器上执行
cd /opt
git clone your-git-repo log-parser-app
cd log-parser-app
```

#### 方式 C: 使用 rsync（推荐）
```bash
# 在本地执行，同步并排除不必要的文件
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='client/node_modules' \
  --exclude='client/build' \
  --exclude='.git' \
  --exclude='uploads' \
  --exclude='*.log' \
  /Volumes/Data/Work/Code/work/ \
  user@server-ip:/opt/log-parser-app/
```

### 步骤 3: 安装依赖
```bash
cd /opt/log-parser-app

# 安装后端依赖
npm install --production

# 安装前端依赖并构建
cd client
npm install
npm run build
cd ..
```

### 步骤 4: 配置应用

#### 创建配置文件
```bash
# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
EOF
```

#### 更新 server/index.js（如需要）
确保服务器监听所有网络接口：
```javascript
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(\`服务器运行在 http://\${HOST}:\${PORT}\`);
});
```

### 步骤 5: 启动服务

#### 临时启动（测试用）
```bash
# 启动后端
node server/index.js

# 或使用 npm
npm run server
```

#### 后台运行（使用 nohup）
```bash
nohup node server/index.js > server.log 2>&1 &
echo $! > server.pid
```

### 步骤 6: 配置静态文件服务

#### 修改 server/index.js 添加静态文件服务
```javascript
const path = require('path');

// 在路由之前添加
app.use(express.static(path.join(__dirname, '../client/build')));

// 在所有 API 路由之后添加
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});
```

---

## 🐳 Docker 部署

### 创建 Dockerfile
```dockerfile
# 多阶段构建
FROM node:16-alpine AS builder

# 构建前端
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 生产镜像
FROM node:16-alpine

WORKDIR /app

# 复制后端代码
COPY server/ ./server/
COPY package*.json ./
COPY log.txt ./

# 安装生产依赖
RUN npm install --production

# 复制构建好的前端
COPY --from=builder /app/client/build ./client/build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server/index.js"]
```

### 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  log-parser:
    build: .
    container_name: log-parser-app
    ports:
      - "3001:3001"
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=3001
    restart: unless-stopped
    networks:
      - log-parser-network

networks:
  log-parser-network:
    driver: bridge
```

### 创建 .dockerignore
```
node_modules
client/node_modules
client/build
.git
.gitignore
*.md
*.log
uploads/*
!uploads/.gitkeep
```

### 部署命令
```bash
# 构建镜像
docker build -t log-parser-app .

# 启动容器
docker run -d \
  --name log-parser-app \
  -p 3001:3001 \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  log-parser-app

# 或使用 docker-compose
docker-compose up -d

# 查看日志
docker logs -f log-parser-app

# 停止服务
docker stop log-parser-app

# 重启服务
docker restart log-parser-app
```

---

## ⚙️ PM2 部署（推荐生产环境）

### 安装 PM2
```bash
sudo npm install -g pm2
```

### 创建 PM2 配置文件 ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'log-parser-app',
    script: './server/index.js',
    instances: 'max',  // 或指定数量，如 2
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### PM2 常用命令
```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status
pm2 list

# 查看日志
pm2 logs log-parser-app
pm2 logs log-parser-app --lines 100

# 监控
pm2 monit

# 重启
pm2 restart log-parser-app

# 停止
pm2 stop log-parser-app

# 删除
pm2 delete log-parser-app

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup

# 更新应用
pm2 reload log-parser-app --update-env
```

---

## 🌐 Nginx 反向代理

### 安装 Nginx
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 配置 Nginx

#### 创建配置文件
```bash
sudo nano /etc/nginx/sites-available/log-parser-app
```

#### 基础配置（HTTP）
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或 IP

    # 访问日志
    access_log /var/log/nginx/log-parser-access.log;
    error_log /var/log/nginx/log-parser-error.log;

    # 静态资源
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API 路由
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 上传文件大小限制
        client_max_body_size 100M;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### HTTPS 配置（使用 Let's Encrypt）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书并自动配置 Nginx
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

#### 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/log-parser-app /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### Nginx 高级配置

#### 负载均衡
```nginx
upstream log_parser_backend {
    least_conn;
    server localhost:3001;
    server localhost:3002;
    server localhost:3003;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://log_parser_backend;
        # ... 其他配置
    }
}
```

#### Gzip 压缩
```nginx
server {
    # ... 其他配置

    # 启用 Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
}
```

---

## 🔧 自动化部署脚本

### 创建 deploy.sh
```bash
#!/bin/bash

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}日志解析器 - 自动部署脚本${NC}"
echo -e "${GREEN}================================${NC}\n"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先安装 Node.js (v16+)"
    exit 1
fi

echo -e "${YELLOW}[1/6] 检查环境...${NC}"
NODE_VERSION=$(node --version)
echo "Node.js 版本: $NODE_VERSION"

# 创建必要的目录
echo -e "\n${YELLOW}[2/6] 创建目录结构...${NC}"
mkdir -p uploads logs

# 安装后端依赖
echo -e "\n${YELLOW}[3/6] 安装后端依赖...${NC}"
npm install --production

# 安装前端依赖
echo -e "\n${YELLOW}[4/6] 安装前端依赖...${NC}"
cd client
npm install

# 构建前端
echo -e "\n${YELLOW}[5/6] 构建前端应用...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}错误: 前端构建失败${NC}"
    exit 1
fi

cd ..

# 更新 server/index.js 添加静态文件服务
echo -e "\n${YELLOW}[6/6] 配置静态文件服务...${NC}"

# 备份原文件
cp server/index.js server/index.js.backup

# 检查是否已经添加了静态文件服务
if ! grep -q "express.static" server/index.js; then
    echo "正在添加静态文件服务配置..."
    
    # 在文件开头添加 path 模块
    sed -i "1i const path = require('path');" server/index.js
    
    # 在路由之前添加静态文件服务
    sed -i "/\/\/ 路由/i app.use(express.static(path.join(__dirname, '../client/build')));\n" server/index.js
    
    # 在文件末尾添加前端路由处理
    echo "" >> server/index.js
    echo "// 处理前端路由" >> server/index.js
    echo "app.get('*', (req, res) => {" >> server/index.js
    echo "  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));" >> server/index.js
    echo "});" >> server/index.js
fi

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}================================${NC}\n"

echo -e "${YELLOW}启动选项:${NC}"
echo "1. 临时启动（前台）:"
echo "   node server/index.js"
echo ""
echo "2. 后台运行（nohup）:"
echo "   nohup node server/index.js > server.log 2>&1 &"
echo ""
echo "3. 使用 PM2（推荐）:"
echo "   npm install -g pm2"
echo "   pm2 start server/index.js --name log-parser-app"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo -e "${YELLOW}访问地址:${NC}"
echo "   http://your-server-ip:3001"
echo ""
echo -e "${YELLOW}配置 Nginx 反向代理后:${NC}"
echo "   http://your-domain.com"
```

### 创建 update.sh（更新脚本）
```bash
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}日志解析器 - 更新脚本${NC}"
echo -e "${GREEN}================================${NC}\n"

# 备份当前版本
echo -e "${YELLOW}[1/5] 备份当前版本...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$BACKUP_DIR"
cp -r . "../$BACKUP_DIR/"

# 拉取最新代码（如果使用 Git）
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}[2/5] 拉取最新代码...${NC}"
    git pull
fi

# 更新依赖
echo -e "\n${YELLOW}[3/5] 更新依赖...${NC}"
npm install --production
cd client && npm install && cd ..

# 重新构建前端
echo -e "\n${YELLOW}[4/5] 重新构建前端...${NC}"
cd client && npm run build && cd ..

# 重启服务
echo -e "\n${YELLOW}[5/5] 重启服务...${NC}"

if command -v pm2 &> /dev/null; then
    pm2 reload log-parser-app
    echo "使用 PM2 重启服务"
else
    # 查找并停止旧进程
    PID=$(lsof -ti:3001)
    if [ ! -z "$PID" ]; then
        kill $PID
        echo "已停止旧服务 (PID: $PID)"
    fi
    
    # 启动新服务
    nohup node server/index.js > server.log 2>&1 &
    echo "已启动新服务 (PID: $!)"
fi

echo -e "\n${GREEN}更新完成！${NC}"
```

### 赋予执行权限
```bash
chmod +x deploy.sh update.sh
```

---

## 📊 监控和维护

### 系统监控

#### 查看进程
```bash
# 查看 Node.js 进程
ps aux | grep node

# 查看端口占用
netstat -tlnp | grep 3001
lsof -i :3001
```

#### 查看日志
```bash
# 实时查看日志
tail -f server.log

# 查看最近 100 行
tail -n 100 server.log

# 搜索错误
grep -i error server.log
```

#### 磁盘空间
```bash
# 查看磁盘使用
df -h

# 查看目录大小
du -sh /opt/log-parser-app
du -sh /opt/log-parser-app/uploads
```

### 定期维护

#### 创建清理脚本 cleanup.sh
```bash
#!/bin/bash

# 清理上传的临时文件（7天前）
find /opt/log-parser-app/uploads -type f -mtime +7 -delete

# 清理旧日志（30天前）
find /opt/log-parser-app/logs -name "*.log" -mtime +30 -delete

# 清理 PM2 日志
pm2 flush

echo "清理完成"
```

#### 添加到 crontab
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨 2 点执行）
0 2 * * * /opt/log-parser-app/cleanup.sh >> /opt/log-parser-app/logs/cleanup.log 2>&1
```

---

## 🔒 安全建议

### 1. 防火墙配置
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 限制文件上传
在 server/index.js 中配置：
```javascript
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || 
        file.originalname.endsWith('.log') || 
        file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传 .log 和 .txt 文件'));
    }
  }
});
```

### 3. 添加访问认证（可选）
```bash
# 使用 Nginx Basic Auth
sudo htpasswd -c /etc/nginx/.htpasswd username

# 在 Nginx 配置中添加
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ... 其他配置
}
```

### 4. 定期更新
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Node.js 依赖
npm audit fix
```

---

## 🐛 故障排查

### 常见问题

#### 1. 端口被占用
```bash
# 查找占用进程
lsof -ti:3001

# 杀死进程
kill -9 $(lsof -ti:3001)
```

#### 2. 权限问题
```bash
# 修改文件所有者
sudo chown -R $USER:$USER /opt/log-parser-app

# 修改文件权限
chmod -R 755 /opt/log-parser-app
```

#### 3. 内存不足
```bash
# 查看内存使用
free -h

# 创建 swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 4. Node.js 版本问题
```bash
# 使用 nvm 管理版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

---

## 📚 相关文档

- [Node.js 官方文档](https://nodejs.org/docs/)
- [PM2 官方文档](https://pm2.keymetrics.io/docs/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Docker 官方文档](https://docs.docker.com/)

---

## ✅ 部署检查清单

- [ ] 服务器环境准备（Node.js v16+）
- [ ] 项目文件上传
- [ ] 依赖安装完成
- [ ] 前端构建成功
- [ ] 后端服务启动
- [ ] 防火墙配置
- [ ] Nginx 反向代理配置（可选）
- [ ] HTTPS 证书配置（可选）
- [ ] PM2 进程管理配置
- [ ] 开机自启配置
- [ ] 日志轮转配置
- [ ] 定期清理任务
- [ ] 备份策略制定

---

## 📞 技术支持

如遇到问题，请查看：
1. 应用日志: `tail -f server.log`
2. PM2 日志: `pm2 logs`
3. Nginx 日志: `/var/log/nginx/error.log`
4. 系统日志: `journalctl -u nginx`

---

**祝部署顺利！** 🚀
