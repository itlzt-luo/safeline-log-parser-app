#!/bin/bash

# 测试大文件优化功能

echo "🧪 测试大文件优化功能"
echo "================================"
echo ""

# 测试1: 检查文件信息
echo "📋 测试1: 检查文件信息"
curl -s -X POST http://localhost:3001/api/logs/file-info \
  -H "Content-Type: application/json" \
  -d '{"logPath":"./log.txt"}' | jq '.'

echo ""
echo "================================"
echo ""

# 测试2: 分析日志（不返回原始日志）
echo "📊 测试2: 分析日志统计"
curl -s -X POST http://localhost:3001/api/logs/analyze \
  -H "Content-Type: application/json" \
  -d '{"logPath":"./log.txt","filters":{}}' | jq '.statistics | {totalRequests, uniqueIPs, errorRate, avgResponseSize}'

echo ""
echo "================================"
echo ""

# 测试3: 带筛选条件的分析
echo "🔍 测试3: 筛选4xx错误"
curl -s -X POST http://localhost:3001/api/logs/analyze \
  -H "Content-Type: application/json" \
  -d '{"logPath":"./log.txt","filters":{"statusFilter":"4xx"}}' | jq '.statistics | {totalRequests, uniqueIPs, errorRate}'

echo ""
echo "================================"
echo ""

# 测试4: 分页获取日志详情
echo "📄 测试4: 分页获取日志（第1页，每页10条）"
curl -s -X POST http://localhost:3001/api/logs/paginated \
  -H "Content-Type: application/json" \
  -d '{"logPath":"./log.txt","page":1,"pageSize":10,"filters":{}}' | jq '{logs: .logs | length, pagination}'

echo ""
echo "================================"
echo ""
echo "✅ 测试完成！"
echo ""
echo "💡 提示："
echo "  - 小文件(<10MB): 使用 /api/parse-log-path"
echo "  - 大文件(≥10MB): 使用 /api/logs/analyze"
echo "  - 需要日志详情: 使用 /api/logs/paginated"
