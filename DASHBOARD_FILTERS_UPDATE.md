# 统计页筛选功能更新

## 更新时间
2026年3月4日

## 更新内容

### 🎯 为统计页（Dashboard）添加完整的筛选功能

用户现在可以在统计页面按多个维度筛选数据，实时查看不同条件下的统计结果。

---

## 新增功能

### 1. 📅 日期范围筛选

**功能描述**：选择开始日期和结束日期，筛选指定时间段内的日志记录。

**实现方式**：
```javascript
const [dateRange, setDateRange] = useState({ start: '', end: '' });

// 过滤逻辑
if (dateRange.start) {
  const startDate = new Date(dateRange.start);
  matchesDate = matchesDate && logDate >= startDate;
}
if (dateRange.end) {
  const endDate = new Date(dateRange.end);
  endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
  matchesDate = matchesDate && logDate <= endDate;
}
```

**UI 组件**：
- 两个日期选择器：开始日期、结束日期
- 支持单独设置开始或结束日期
- 自动包含结束日期的完整一天

---

### 2. 📊 状态码筛选

**功能描述**：按 HTTP 状态码类别筛选日志。

**筛选选项**：
- 所有状态
- ✅ 2xx 成功（200-299）
- 🔄 3xx 重定向（300-399）
- ⚠️ 4xx 客户端错误（400-499）
- ❌ 5xx 服务器错误（500-599）

**实现逻辑**：
```javascript
const matchesStatus = 
  statusFilter === 'all' ||
  (statusFilter === '2xx' && log.status >= 200 && log.status < 300) ||
  (statusFilter === '3xx' && log.status >= 300 && log.status < 400) ||
  (statusFilter === '4xx' && log.status >= 400 && log.status < 500) ||
  (statusFilter === '5xx' && log.status >= 500);
```

---

### 3. 🔧 请求方法筛选

**功能描述**：按 HTTP 请求方法筛选日志。

**筛选选项**：
- 所有方法
- GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS、OTHER

**特点**：
- 自动提取日志中的所有唯一方法
- 方法标准化（与日志详情页保持一致）
- 按常用方法排序

**实现**：
```javascript
const uniqueMethods = useMemo(() => {
  const methods = [...new Set(logs.map(log => normalizeMethod(log.method)))].sort();
  const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];
  return methods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}, [logs]);
```

---

### 4. 🌍 域名筛选

**功能描述**：按访问域名筛选日志。

**筛选选项**：
- 所有域名
- 日志中的所有唯一域名（自动提取并排序）

**实现**：
```javascript
const uniqueDomains = useMemo(() => {
  return [...new Set(logs.map(log => log.domain))].sort();
}, [logs]);
```

---

## 实时统计计算

### 动态统计重新计算

当筛选条件改变时，所有统计数据会实时重新计算：

**计算的统计指标**：
- 📊 总请求数
- 🌐 唯一 IP 数
- ⚠️ 错误率
- 📦 平均响应大小
- 📈 状态码分布
- 🔧 请求方法分布
- 🔥 Top 10 访问路径
- 👥 Top 10 客户端 IP
- 🌍 Top 10 访问域名

**实现方式**：
```javascript
const filteredStatistics = useMemo(() => {
  // 对 filteredLogs 重新计算所有统计指标
  const statusCodes = {};
  const methods = {};
  const paths = {};
  const clientIPs = {};
  const domains = {};
  let totalSize = 0;
  let errorCount = 0;

  filteredLogs.forEach(log => {
    // 统计各项指标...
  });

  return {
    totalRequests: filteredLogs.length,
    uniqueIPs: uniqueIPs,
    // ... 其他统计数据
  };
}, [filteredLogs]);
```

---

## UI/UX 设计

### 筛选器区域

```
┌─────────────────────────────────────────────┐
│ 🔍 筛选条件              [🔄 重置筛选]      │
├─────────────────────────────────────────────┤
│ [开始日期] [结束日期] [状态码] [方法] [域名] │
├─────────────────────────────────────────────┤
│ 📌 显示 X 条记录（共 Y 条）                 │
└─────────────────────────────────────────────┘
```

**设计特点**：
- 玻璃态效果背景
- 紫色渐变主题
- 清晰的视觉层次
- 响应式网格布局

### 重置按钮

**功能**：一键清除所有筛选条件

**显示逻辑**：
- 仅在有活动筛选时显示
- 点击后恢复到默认状态（显示所有数据）

```javascript
const hasActiveFilters = 
  dateRange.start || 
  dateRange.end || 
  statusFilter !== 'all' || 
  methodFilter !== 'all' || 
  domainFilter !== 'all';
```

### 筛选结果提示

**功能**：显示当前筛选结果的数量

**格式**：`📌 显示 X 条记录（共 Y 条）`

**显示逻辑**：仅在有活动筛选时显示

---

## 性能优化

### useMemo 优化

所有计算密集型操作都使用 `useMemo` 缓存：

1. **唯一方法提取**：`uniqueMethods`
2. **唯一域名提取**：`uniqueDomains`
3. **日志过滤**：`filteredLogs`
4. **统计计算**：`filteredStatistics`

**好处**：
- 避免不必要的重复计算
- 提升大数据集的性能
- 保持 UI 流畅响应

---

## 样式更新

### 新增 CSS 类

**`.dashboard-filters`**：
- 玻璃态效果容器
- 圆角和阴影
- 渐变背景

**`.filter-grid`**：
- 响应式网格布局
- 自动适应屏幕宽度
- 最小列宽 200px

**`.filter-item`**：
- 垂直布局
- 标签和输入框样式统一
- 焦点状态高亮

**`.reset-btn`**：
- 紫色渐变按钮
- 悬停动效
- 阴影效果

**`.filter-info`**：
- 半透明紫色背景
- 圆角边框
- 居中对齐

---

## 响应式设计

### 平板（≤1024px）
```css
.filter-grid {
  grid-template-columns: 1fr 1fr;
}
```

### 手机（≤768px）
```css
.filter-grid {
  grid-template-columns: 1fr;
}

.filter-header {
  flex-direction: column;
}

.reset-btn {
  width: 100%;
}
```

---

## 使用场景

### 场景 1：分析特定时间段
**操作**：选择开始日期和结束日期
**效果**：查看该时间段的所有统计数据

### 场景 2：检查错误请求
**操作**：选择「4xx 客户端错误」或「5xx 服务器错误」
**效果**：仅显示错误请求的统计信息

### 场景 3：分析特定域名
**操作**：选择某个域名
**效果**：查看该域名的访问情况、请求方法分布等

### 场景 4：组合筛选
**操作**：同时设置多个筛选条件
**效果**：精确定位特定条件下的日志数据

**示例**：
- 时间段：2026-03-01 ~ 2026-03-04
- 状态码：4xx 客户端错误
- 方法：GET
- 域名：fn.lztyun.cn

结果：显示指定时间段内，特定域名上 GET 请求产生的 4xx 错误

---

## 代码架构

### 数据流

```
原始日志 (logs)
    ↓
应用筛选条件 (filteredLogs)
    ↓
重新计算统计 (filteredStatistics)
    ↓
更新图表展示 (charts)
```

### 状态管理

```javascript
// 筛选状态
const [dateRange, setDateRange] = useState({ start: '', end: '' });
const [statusFilter, setStatusFilter] = useState('all');
const [methodFilter, setMethodFilter] = useState('all');
const [domainFilter, setDomainFilter] = useState('all');

// 计算状态（useMemo）
const filteredLogs = useMemo(() => { ... }, [logs, ...filters]);
const filteredStatistics = useMemo(() => { ... }, [filteredLogs]);
```

---

## 文件修改清单

| 文件 | 修改类型 | 描述 |
|------|---------|------|
| `client/src/App.js` | 修改 | 传递 logs 给 Dashboard |
| `client/src/components/Dashboard.js` | 重构 | 添加筛选功能和动态统计计算 |
| `client/src/components/Dashboard.css` | 新增 | 添加筛选器样式和响应式设计 |

---

## 技术细节

### 日期处理
```javascript
// 确保结束日期包含完整的一天
const endDate = new Date(dateRange.end);
endDate.setHours(23, 59, 59, 999);
```

### 方法标准化
```javascript
const normalizeMethod = (method) => {
  const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
  const upperMethod = method.toUpperCase().trim();
  return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
};
```

### 统计计算
```javascript
// 错误率计算
errorRate: ((errorCount / filteredLogs.length) * 100).toFixed(2)

// 平均响应大小
avgResponseSize: Math.round(totalSize / filteredLogs.length)

// Top N 排序
.sort((a, b) => b[1] - a[1])
.slice(0, 10)
```

---

## 兼容性

- ✅ 向后兼容原有功能
- ✅ 支持空数据集（显示 0 值）
- ✅ 处理缺失的 topDomains 字段
- ✅ 响应式设计，支持移动设备

---

## 用户体验提升

### 之前
- ❌ 只能查看全量数据统计
- ❌ 无法分析特定时间段
- ❌ 无法按条件过滤统计

### 现在
- ✅ 支持多维度筛选
- ✅ 实时动态更新统计
- ✅ 清晰的筛选结果提示
- ✅ 一键重置筛选
- ✅ 组合筛选支持复杂分析

---

## 下一步建议

可考虑的增强功能：
1. 📊 保存常用筛选条件
2. 📥 导出筛选结果
3. 📈 筛选条件历史记录
4. 🔗 从 URL 参数恢复筛选状态
5. 📅 快捷日期选择（今天、昨天、最近7天等）
6. 🎯 高级筛选（IP 段、路径模式匹配等）

---

## 测试建议

### 功能测试
1. ✅ 单独使用每个筛选器
2. ✅ 组合使用多个筛选器
3. ✅ 重置筛选功能
4. ✅ 空数据集处理
5. ✅ 边界条件（日期边界等）

### 性能测试
1. ✅ 大数据集（1000+ 条日志）
2. ✅ 频繁切换筛选条件
3. ✅ 图表重渲染性能

### UI 测试
1. ✅ 桌面端显示
2. ✅ 平板端显示
3. ✅ 手机端显示
4. ✅ 不同浏览器兼容性

---

**更新完成！** 🎉

统计页现在拥有完整的筛选功能，用户可以从多个维度深入分析日志数据！
