# 🔧 指定日志路径功能使用说明

## ✅ 问题已解决

日志解析功能现在完全正常工作！问题已修复，包括：

1. ✅ 日志解析正则表达式已优化
2. ✅ API 端点正常工作
3. ✅ 服务器已重启并运行

## 📝 使用方法

### 方式一：通过前端界面

1. 打开浏览器访问 **http://localhost:3000**
2. 点击 **"📂 指定路径"** 按钮
3. 输入完整的日志文件路径，例如：
   - `/Volumes/Data/Work/Code/work/log.txt`
   - `/var/log/nginx/access.log`
   - 任何其他有效的日志文件路径
4. 点击 **"加载"** 按钮
5. 查看解析结果和统计信息

### 方式二：通过 API 调用

```bash
curl -X POST http://localhost:3001/api/parse-log-path \
  -H "Content-Type: application/json" \
  -d '{"logPath": "/Volumes/Data/Work/Code/work/log.txt"}'
```

## 📊 测试结果

使用路径 `/Volumes/Data/Work/Code/work/log.txt` 的测试结果：

- **总请求数**: 10
- **唯一 IP**: 1
- **错误率**: 40.00%
- **状态码分布**:
  - 101: 4 次（WebSocket）
  - 200: 2 次（成功）
  - 404: 4 次（未找到）

## 🎯 支持的日志格式

```
IP | user | timestamp | "domain" | "request" | status | size | "referer" | "user-agent" "client-ip"
```

示例：
```
127.0.0.1 | - | 04/Mar/2026:09:53:59 +0800 | "fn.lztyun.cn" | "GET /app-center/v1/service/list HTTP/1.1" | 200 | 997 | "-" | "Flutter/3.5.4" "125.121.52.66"
```

## 🚀 三种加载方式对比

| 方式 | 描述 | 使用场景 |
|------|------|----------|
| 📁 上传文件 | 从本地选择并上传日志文件 | 临时分析一次性文件 |
| 📄 加载默认日志 | 加载项目中的 log.txt | 快速测试和开发 |
| 📂 指定路径 | 输入服务器上的文件路径 | 分析服务器日志文件 |

## ⚠️ 注意事项

1. **文件路径必须是绝对路径**
2. **确保文件存在且可读**
3. **服务器进程必须有权限访问该文件**
4. **日志格式必须匹配支持的格式**

## 🐛 故障排除

如果遇到"加载日志失败"错误：

1. **检查文件路径是否正确**
   ```bash
   ls -la /Volumes/Data/Work/Code/work/log.txt
   ```

2. **检查文件权限**
   ```bash
   chmod 644 /Volumes/Data/Work/Code/work/log.txt
   ```

3. **验证日志格式**
   ```bash
   head -1 /Volumes/Data/Work/Code/work/log.txt
   ```

4. **检查服务器日志**
   - 查看终端输出的错误信息
   - 服务器会打印详细的错误信息

5. **重启服务器**
   ```bash
   pkill -f "node server/index.js"
   cd /Volumes/Data/Work/Code/work
   node server/index.js
   ```

## ✨ 功能特点

- 🔍 实时解析和验证
- 📊 自动生成统计信息
- 🎨 可视化图表展示
- 🔎 搜索和过滤功能
- 📄 分页显示大量日志
- ⚡ 快速响应

---

**服务状态**: 🟢 运行中
**前端**: http://localhost:3000
**后端**: http://localhost:3001
