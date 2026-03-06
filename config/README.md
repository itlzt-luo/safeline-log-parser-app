# 配置目录

本目录包含项目的各种配置文件。

## 📋 配置文件列表

### 应用配置
- **`ecosystem.config.js`** - PM2 进程管理配置
  - 定义应用的启动方式
  - 配置进程数、日志路径等
  - 用于生产环境的进程管理

### 服务器配置
- **`nginx.conf`** - Nginx 配置文件
  - 反向代理配置
  - 静态资源服务配置
  - 负载均衡和缓存策略

## 🔧 使用方法

### PM2 配置
```bash
# 使用 ecosystem.config.js 启动应用
pm2 start config/ecosystem.config.js

# 重启应用
pm2 restart config/ecosystem.config.js
```

### Nginx 配置
```bash
# 复制配置到 nginx 目录
sudo cp config/nginx.conf /etc/nginx/sites-available/safeline-log-parser

# 创建软链接
sudo ln -s /etc/nginx/sites-available/safeline-log-parser /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo nginx -s reload
```

## ⚠️ 注意事项

- 修改配置文件后需要重启相应服务才能生效
- 生产环境配置修改前请做好备份
- Nginx 配置需要根据实际部署环境调整端口和路径
