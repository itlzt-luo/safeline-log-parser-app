# 项目总览

欢迎来到 SafeLine 日志解析器项目！

## 📋 快速导航

### 新手入门
1. 📖 [README.md](../README.md) - 项目主页，快速开始
2. � [启动指南](./STARTUP_GUIDE.md) - 详细的启动方式说明
3. �📚 [使用指南](./USAGE.md) - 详细的使用说明
4. ⚡ [快速部署](./QUICK_DEPLOY.md) - 5分钟快速部署

### 功能文档
- 🔍 [过滤器快速指南](./FILTERS_QUICK_GUIDE.md) - 学习如何使用过滤功能
- 📦 [大文件使用指南](./LARGE_FILE_USAGE_GUIDE.md) - 处理大型日志文件
- 🕐 [历史功能说明](./HISTORY_FEATURE.md) - 了解历史记录功能

### 部署与维护
- 📦 [完整部署指南](./DEPLOY.md) - 生产环境部署
- ⚡ [大文件优化说明](./LARGE_FILE_OPTIMIZATION.md) - 性能优化技巧
- 🔧 [配置文档](../config/README.md) - PM2 和 Nginx 配置
- 📜 [脚本工具](../scripts/README.md) - 部署和维护脚本

## 🗂️ 项目结构

```
safeline-log-parser-app/
├── 📚 docs/          文档目录（你在这里）
├── 🔧 config/        配置文件（PM2、Nginx）
├── 📜 scripts/       脚本工具（部署、测试、维护）
├── 📝 logs/          日志文件
├── 💻 server/        后端代码
├── 🎨 client/        前端代码
├── 📤 uploads/       上传文件目录
└── 🐳 Docker 文件    容器化部署
```

## 🎯 常见任务

### 开发
```bash
# 安装依赖
npm run install-all

# 开发模式（推荐）
npm run dev

# 查看启动详情
# 参考 docs/STARTUP_GUIDE.md
```

### 部署
```bash
# 快速部署
bash scripts/deploy.sh

# 更新应用
bash scripts/update.sh
```

### 维护
```bash
# 清理临时文件
bash scripts/cleanup.sh

# 测试解析器
node scripts/test-parser.js
```

## 💡 提示

- 🔰 首次使用？从 [启动指南](./STARTUP_GUIDE.md) 开始
- 📖 学习功能？查看 [使用指南](./USAGE.md)
- 🚀 需要部署？查看 [快速部署](./QUICK_DEPLOY.md)
- 🐛 遇到问题？查看主 [README](../README.md) 的故障排除章节
- 📊 大文件处理？参考 [大文件使用指南](./LARGE_FILE_USAGE_GUIDE.md)

## 📞 获取帮助

如果您遇到问题或有建议，请：
1. 查看相关文档
2. 查看 [README.md](../README.md) 的故障排除部分
3. 提交 Issue

---

更新时间：2026年3月5日
