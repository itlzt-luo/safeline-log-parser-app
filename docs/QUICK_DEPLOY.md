# 快速部署指南 - 5分钟上线

## 🚀 最快部署方式（推荐）

### 前置条件
- Linux 服务器（Ubuntu 18.04+ / CentOS 7+）
- 已安装 Node.js v16+
- 有 sudo 权限

### 步骤 1: 在本地打包（30秒）

```bash
# 在项目目录执行
chmod +x package.sh
./package.sh
```

会生成类似 `log-parser-app-20260304_143000.tar.gz` 的文件

### 步骤 2: 上传到服务器（1分钟）

```bash
# 替换为你的服务器信息
scp log-parser-app-*.tar.gz user@your-server-ip:/opt/
```

### 步骤 3: 在服务器上部署（3分钟）

```bash
# SSH 登录服务器
ssh user@your-server-ip

# 解压
cd /opt
mkdir -p log-parser-app
tar -xzf log-parser-app-*.tar.gz -C log-parser-app
cd log-parser-app

# 一键部署
chmod +x *.sh
./deploy.sh

# 启动服务（选择一种方式）

# 方式1: 临时启动（测试用）
node server/index.js

# 方式2: 后台运行
nohup node server/index.js > server.log 2>&1 &

# 方式3: PM2（推荐）
sudo npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 步骤 4: 访问应用

```
http://your-server-ip:3001
```

---

## 🔥 超快速部署（使用 Docker）

### 前置条件
- 已安装 Docker 和 Docker Compose

### 一条命令部署

```bash
# 在服务器上执行
cd /opt
git clone your-repo log-parser-app  # 或上传项目文件
cd log-parser-app

# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps
docker-compose logs -f
```

访问: `http://your-server-ip:3001`

---

## 📋 完整部署检查清单

### ✅ 部署前
- [ ] Node.js v16+ 已安装
- [ ] 服务器有足够磁盘空间（建议 2GB+）
- [ ] 端口 3001 未被占用
- [ ] 防火墙允许 3001 端口

### ✅ 部署中
- [ ] 项目文件已上传
- [ ] 依赖安装成功
- [ ] 前端构建完成
- [ ] 服务启动成功

### ✅ 部署后
- [ ] 可以访问应用
- [ ] 上传日志功能正常
- [ ] 配置 PM2 开机自启
- [ ] （可选）配置 Nginx 反向代理
- [ ] （可选）配置 HTTPS

---

## 🛠️ 常用命令速查

### 查看服务状态
```bash
# PM2
pm2 status
pm2 logs log-parser-app

# 进程
ps aux | grep node
netstat -tlnp | grep 3001
```

### 重启服务
```bash
# PM2
pm2 restart log-parser-app

# 手动
kill $(cat server.pid)
nohup node server/index.js > server.log 2>&1 &
```

### 查看日志
```bash
# 应用日志
tail -f server.log

# PM2 日志
pm2 logs log-parser-app

# Nginx 日志
tail -f /var/log/nginx/log-parser-access.log
```

### 更新应用
```bash
cd /opt/log-parser-app
./update.sh
```

---

## 🔧 配置 Nginx 反向代理（可选）

### 1. 安装 Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. 配置站点
```bash
sudo cp nginx.conf /etc/nginx/sites-available/log-parser-app
sudo nano /etc/nginx/sites-available/log-parser-app
# 修改 server_name 为你的域名

sudo ln -s /etc/nginx/sites-available/log-parser-app /etc/nginx/sites-enabled/
```

### 3. 测试并重启
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置 HTTPS（Let's Encrypt）
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

访问: `https://your-domain.com`

---

## 🐛 常见问题

### 1. 端口被占用
```bash
# 查找占用进程
sudo lsof -i :3001

# 杀死进程
sudo kill -9 $(lsof -ti:3001)
```

### 2. 权限不足
```bash
sudo chown -R $USER:$USER /opt/log-parser-app
chmod -R 755 /opt/log-parser-app
```

### 3. 内存不足
```bash
# 查看内存
free -h

# 创建 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 4. 防火墙阻止
```bash
# Ubuntu
sudo ufw allow 3001/tcp

# CentOS
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

---

## 📞 获取帮助

遇到问题？查看：
- 完整部署文档: `DEPLOY.md`
- 应用日志: `tail -f server.log`
- PM2 日志: `pm2 logs`

---

## ⏱️ 部署时间估算

| 方式 | 时间 | 难度 |
|------|------|------|
| 手动部署 | 5-10分钟 | ⭐⭐ |
| Docker 部署 | 3-5分钟 | ⭐ |
| PM2 + Nginx | 10-15分钟 | ⭐⭐⭐ |

---

**开始部署吧！** 🚀
