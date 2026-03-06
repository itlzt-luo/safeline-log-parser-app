import React, { useState, useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

function Dashboard({ statistics, logs = [], loadMode = 'full', onFilterChange = null }) {
  // 筛选状态
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [ipFilter, setIpFilter] = useState('all');

  // 标准化请求方法
  const normalizeMethod = (method) => {
    const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const upperMethod = method.toUpperCase().trim();
    return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
  };

  // 获取唯一的方法和域名
  const uniqueMethods = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && statistics?.filterOptions?.methods) {
      return statistics.filterOptions.methods;
    }
    // 全量模式：从logs计算
    const methods = [...new Set(logs.map(log => normalizeMethod(log.method)))].sort();
    const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];
    return methods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [logs, statistics, loadMode]);

  const uniqueDomains = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && statistics?.filterOptions?.domains) {
      return statistics.filterOptions.domains;
    }
    // 全量模式：从logs计算
    return [...new Set(logs.map(log => log.domain))].sort();
  }, [logs, statistics, loadMode]);

  // 获取唯一的客户端IP
  const uniqueIPs = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && statistics?.filterOptions?.clientIPs) {
      return statistics.filterOptions.clientIPs;
    }
    // 全量模式：从logs计算
    return [...new Set(logs.map(log => log.clientIp))].sort((a, b) => {
      // IP地址排序
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < 4; i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i] - bParts[i];
        }
      }
      return 0;
    });
  }, [logs, statistics, loadMode]);

  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 状态码过滤
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === '2xx' && log.status >= 200 && log.status < 300) ||
        (statusFilter === '3xx' && log.status >= 300 && log.status < 400) ||
        (statusFilter === '4xx' && log.status >= 400 && log.status < 500) ||
        (statusFilter === '5xx' && log.status >= 500);

      // 请求方法过滤
      const matchesMethod = methodFilter === 'all' || normalizeMethod(log.method) === methodFilter;

      // 域名过滤
      const matchesDomain = domainFilter === 'all' || log.domain === domainFilter;

      // IP过滤
      const matchesIP = ipFilter === 'all' || log.clientIp === ipFilter;

      // 日期范围过滤（精确到秒）
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const logDate = new Date(log.timestampDate || log.timestamp);
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);  // 开始时间设为当天 00:00:00
          matchesDate = matchesDate && logDate >= startDate;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);  // 结束时间设为当天 23:59:59
          matchesDate = matchesDate && logDate <= endDate;
        }
      }

      return matchesStatus && matchesMethod && matchesDomain && matchesIP && matchesDate;
    });
  }, [logs, statusFilter, methodFilter, domainFilter, ipFilter, dateRange]);

  // 计算过滤后的统计数据
  const filteredStatistics = useMemo(() => {
    if (filteredLogs.length === 0) {
      return {
        totalRequests: 0,
        uniqueIPs: 0,
        statusCodes: {},
        methods: {},
        topPaths: [],
        topClientIPs: [],
        topDomains: [],
        errorRate: 0,
        avgResponseSize: 0
      };
    }

    const statusCodes = {};
    const methods = {};
    const paths = {};
    const clientIPs = {};
    const domains = {};
    let totalSize = 0;
    let errorCount = 0;

    filteredLogs.forEach(log => {
      statusCodes[log.status] = (statusCodes[log.status] || 0) + 1;
      const normalizedMethod = normalizeMethod(log.method);
      methods[normalizedMethod] = (methods[normalizedMethod] || 0) + 1;
      paths[log.path] = (paths[log.path] || 0) + 1;
      clientIPs[log.clientIp] = (clientIPs[log.clientIp] || 0) + 1;
      domains[log.domain] = (domains[log.domain] || 0) + 1;
      totalSize += log.size;
      if (log.status >= 400) errorCount++;
    });

    const uniqueIPs = new Set(filteredLogs.map(log => log.clientIp)).size;

    return {
      totalRequests: filteredLogs.length,
      uniqueIPs: uniqueIPs,
      statusCodes: statusCodes,
      methods: methods,
      topPaths: Object.entries(paths)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count })),
      topClientIPs: Object.entries(clientIPs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      topDomains: Object.entries(domains)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      errorRate: ((errorCount / filteredLogs.length) * 100).toFixed(2),
      avgResponseSize: Math.round(totalSize / filteredLogs.length)
    };
  }, [filteredLogs]);

  // 使用过滤后的统计数据
  // 优化模式：使用后端返回的统计数据（后端已应用筛选）
  // 全量模式：logs存在时使用前端计算的filteredStatistics，否则使用原始statistics
  const currentStats = loadMode === 'optimized' ? statistics : (logs.length > 0 ? filteredStatistics : statistics);

  // 处理IP柱状图点击事件
  const handleIPBarClick = (data) => {
    if (data && data.name) {
      setIpFilter(data.name);
      // 滚动到顶部以便看到筛选器的变化
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 准备状态码数据
  const statusData = Object.entries(currentStats.statusCodes).map(([status, count]) => ({
    name: `状态码 ${status}`,
    value: count,
    status: parseInt(status)
  }));

  // 准备请求方法数据
  const methodData = Object.entries(currentStats.methods).map(([method, count]) => ({
    name: method,
    value: count
  }));

  // 准备 Top 路径数据
  const pathData = currentStats.topPaths.map(item => ({
    name: item.path.length > 30 ? item.path.substring(0, 30) + '...' : item.path,
    fullPath: item.path,
    count: item.count
  }));

  // 准备 Top IP 数据
  const ipData = currentStats.topClientIPs.map(item => ({
    name: item.ip,
    count: item.count
  }));

  // 准备域名数据
  const domainData = currentStats.topDomains ? currentStats.topDomains.map(item => ({
    name: item.domain,
    count: item.count
  })) : [];

  // 准备时间序列数据
  const timeSeriesData = useMemo(() => {
    // 优化模式：直接使用后端返回的时间序列数据
    if (loadMode === 'optimized' && currentStats?.timeSeriesData) {
      return currentStats.timeSeriesData;
    }
    
    // 全量模式：从日志中计算时间序列
    if (filteredLogs.length === 0) return [];

    // 按时间排序
    const sortedLogs = [...filteredLogs].sort((a, b) => 
      new Date(a.timestampDate || a.timestamp) - new Date(b.timestampDate || b.timestamp)
    );

    // 根据数据量决定时间粒度
    const timeRangeMs = new Date(sortedLogs[sortedLogs.length - 1].timestampDate || sortedLogs[sortedLogs.length - 1].timestamp) - 
                        new Date(sortedLogs[0].timestampDate || sortedLogs[0].timestamp);
    const days = timeRangeMs / (1000 * 60 * 60 * 24);
    const hours = timeRangeMs / (1000 * 60 * 60);
    const minutes = timeRangeMs / (1000 * 60);
    const seconds = timeRangeMs / 1000;

    let groupBy;
    let formatTime;

    // 优化：根据数据时间跨度智能选择更细的粒度，确保有足够多的点位
    if (seconds < 60) {
      // 1分钟内：按秒分组
      groupBy = (date) => {
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (minutes < 10) {
      // 10分钟内：按5秒分组
      groupBy = (date) => {
        const d = new Date(date);
        const second = Math.floor(d.getSeconds() / 5) * 5;
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (minutes < 30) {
      // 30分钟内：按30秒分组
      groupBy = (date) => {
        const d = new Date(date);
        const second = Math.floor(d.getSeconds() / 30) * 30;
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (minutes < 120) {
      // 2小时内：按分钟分组
      groupBy = (date) => {
        const d = new Date(date);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (hours < 12) {
      // 12小时内：按5分钟分组
      groupBy = (date) => {
        const d = new Date(date);
        const minute = Math.floor(d.getMinutes() / 5) * 5;
        return `${String(d.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (hours < 24) {
      // 24小时内：按15分钟分组
      groupBy = (date) => {
        const d = new Date(date);
        const minute = Math.floor(d.getMinutes() / 15) * 15;
        return `${String(d.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
      formatTime = groupBy;
    } else if (days <= 3) {
      // 3天内：按小时分组
      groupBy = (date) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
      };
      formatTime = groupBy;
    } else if (days <= 7) {
      // 7天内：按3小时分组
      groupBy = (date) => {
        const d = new Date(date);
        const hour = Math.floor(d.getHours() / 3) * 3;
        return `${d.getMonth() + 1}/${d.getDate()} ${String(hour).padStart(2, '0')}:00`;
      };
      formatTime = groupBy;
    } else if (days <= 30) {
      // 30天内：按天分组
      groupBy = (date) => {
        const d = new Date(date);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      };
      formatTime = groupBy;
    } else if (days <= 90) {
      // 90天内：按3天分组
      groupBy = (date) => {
        const d = new Date(date);
        const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const groupDay = Math.floor(dayOfYear / 3) * 3;
        const groupDate = new Date(d.getFullYear(), 0, groupDay);
        return `${groupDate.getMonth() + 1}/${groupDate.getDate()}`;
      };
      formatTime = groupBy;
    } else {
      // 90天以上：按周分组
      groupBy = (date) => {
        const d = new Date(date);
        const weekNum = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return `第${weekNum}周`;
      };
      formatTime = groupBy;
    }

    // 统计每个时间段的请求数
    const timeGroups = {};
    sortedLogs.forEach(log => {
      const timeKey = groupBy(log.timestampDate || log.timestamp);
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          time: timeKey,
          total: 0,
          success: 0,
          error: 0
        };
      }
      timeGroups[timeKey].total++;
      if (log.status >= 200 && log.status < 400) {
        timeGroups[timeKey].success++;
      } else if (log.status >= 400) {
        timeGroups[timeKey].error++;
      }
    });

    // 转换为数组并排序
    return Object.values(timeGroups).sort((a, b) => {
      // 简单的字符串排序（对于时间格式基本够用）
      return a.time.localeCompare(b.time);
    });
  }, [filteredLogs, loadMode, currentStats]);

  // 格式化日期为 YYYY-MM-DD（本地时间）
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 快速日期选择
  const handleQuickDateSelect = (type) => {
    const now = new Date();
    // 获取今天的日期（00:00:00）
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        // 今天：设置为同一天，后端会自动处理为 00:00:00 - 23:59:59
        setDateRange({
          start: formatLocalDate(today),
          end: formatLocalDate(today)
        });
        break;
      case 'yesterday':
        // 昨天：设置为同一天
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setDateRange({
          start: formatLocalDate(yesterday),
          end: formatLocalDate(yesterday)
        });
        break;
      case 'last7days':
        // 最近7天：从7天前到今天
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 6);
        setDateRange({
          start: formatLocalDate(last7days),
          end: formatLocalDate(today)
        });
        break;
      case 'last30days':
        // 最近30天：从30天前到今天
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 29);
        setDateRange({
          start: formatLocalDate(last30days),
          end: formatLocalDate(today)
        });
        break;
      case 'thisMonth':
        // 本月：从本月1号到今天
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateRange({
          start: formatLocalDate(monthStart),
          end: formatLocalDate(today)
        });
        break;
      case 'lastMonth':
        // 上月：从上月1号到上月最后一天
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateRange({
          start: formatLocalDate(lastMonthStart),
          end: formatLocalDate(lastMonthEnd)
        });
        break;
      default:
        break;
    }
  };

  // 重置筛选
  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' });
    setStatusFilter('all');
    setMethodFilter('all');
    setDomainFilter('all');
    setIpFilter('all');
  };

  // 检查是否有活动筛选
  const hasActiveFilters = dateRange.start || dateRange.end || statusFilter !== 'all' || methodFilter !== 'all' || domainFilter !== 'all' || ipFilter !== 'all';

  return (
    <div className="dashboard">
      {/* 筛选器区域 */}
      <div className="dashboard-filters">
        <div className="filter-header">
          <h3>🔍 筛选条件</h3>
          {hasActiveFilters && (
            <button className="reset-btn" onClick={handleResetFilters}>
              🔄 重置筛选
            </button>
          )}
        </div>
        
        <div className="filter-grid">
          {/* 日期范围筛选 */}
          <div className="filter-item date-filter">
            <label>📅 日期范围</label>
            
            {/* 快捷日期选择按钮 */}
            <div className="date-quick-buttons">
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('today')}
                title="选择今天"
              >
                今天
              </button>
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('yesterday')}
                title="选择昨天"
              >
                昨天
              </button>
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('last7days')}
                title="选择最近7天"
              >
                近7天
              </button>
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('last30days')}
                title="选择最近30天"
              >
                近30天
              </button>
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('thisMonth')}
                title="选择本月"
              >
                本月
              </button>
              <button 
                className="quick-date-btn" 
                onClick={() => handleQuickDateSelect('lastMonth')}
                title="选择上月"
              >
                上月
              </button>
            </div>
            
            {/* 自定义日期输入 */}
            <div className="date-inputs">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                placeholder="开始日期"
              />
              <span className="date-separator">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                placeholder="结束日期"
              />
            </div>
          </div>

          {/* 状态码筛选 */}
          <div className="filter-item">
            <label>📊 状态码</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">所有状态</option>
              <option value="2xx">✅ 2xx 成功</option>
              <option value="3xx">🔄 3xx 重定向</option>
              <option value="4xx">⚠️ 4xx 客户端错误</option>
              <option value="5xx">❌ 5xx 服务器错误</option>
            </select>
          </div>

          {/* 请求方法筛选 */}
          <div className="filter-item">
            <label>🔧 请求方法</label>
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">所有方法</option>
              {uniqueMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* 域名筛选 */}
          <div className="filter-item">
            <label>🌍 域名</label>
            <select 
              value={domainFilter} 
              onChange={(e) => setDomainFilter(e.target.value)}
            >
              <option value="all">所有域名</option>
              {uniqueDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </div>

          {/* IP筛选 */}
          <div className="filter-item">
            <label>🖥️ 客户端IP</label>
            <select 
              value={ipFilter} 
              onChange={(e) => setIpFilter(e.target.value)}
            >
              <option value="all">所有IP</option>
              {uniqueIPs.map(ip => (
                <option key={ip} value={ip}>{ip}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 筛选结果提示 */}
        {hasActiveFilters && (
          <div className="filter-info">
            📌 显示 {currentStats.totalRequests} 条记录（共 {logs.length} 条）
          </div>
        )}
      </div>

      {/* 概览卡片 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>总请求数</h3>
            <p className="stat-value">{currentStats.totalRequests.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <h3>唯一 IP</h3>
            <p className="stat-value">{currentStats.uniqueIPs.toLocaleString()}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>错误率</h3>
            <p className="stat-value">{currentStats.errorRate}%</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>平均响应大小</h3>
            <p className="stat-value">{(currentStats.avgResponseSize / 1024).toFixed(2)} KB</p>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="charts-grid">
        {/* 时间趋势图 */}
        <div className="chart-card full-width">
          <h3>📈 请求时间趋势</h3>
          {timeSeriesData.length === 0 ? (
            <div className="no-data-message">暂无时间趋势数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart 
                data={timeSeriesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={timeSeriesData.length <= 10 ? 0 : 'preserveStartEnd'}
                />
                <YAxis 
                  allowDecimals={false}
                  domain={[0, 'auto']}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="custom-tooltip">
                          <p className="tooltip-time">{payload[0].payload.time}</p>
                          <p className="tooltip-total">总请求: {payload[0].payload.total}</p>
                          <p className="tooltip-success">成功: {payload[0].payload.success}</p>
                          <p className="tooltip-error">错误: {payload[0].payload.error}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line 
                  type={timeSeriesData.length <= 3 ? "linear" : "monotone"}
                  dataKey="total" 
                  stroke="#667eea" 
                  strokeWidth={timeSeriesData.length <= 5 ? 3 : 2}
                  name="总请求"
                  dot={{ fill: '#667eea', r: timeSeriesData.length <= 5 ? 6 : 4 }}
                  activeDot={{ r: 8 }}
                  connectNulls={false}
                />
                <Line 
                  type={timeSeriesData.length <= 3 ? "linear" : "monotone"}
                  dataKey="success" 
                  stroke="#43e97b" 
                  strokeWidth={timeSeriesData.length <= 5 ? 3 : 2}
                  name="成功请求"
                  dot={{ fill: '#43e97b', r: timeSeriesData.length <= 5 ? 6 : 4 }}
                  activeDot={{ r: 8 }}
                  connectNulls={false}
                />
                <Line 
                  type={timeSeriesData.length <= 3 ? "linear" : "monotone"}
                  dataKey="error" 
                  stroke="#fa709a" 
                  strokeWidth={timeSeriesData.length <= 5 ? 3 : 2}
                  name="错误请求"
                  dot={{ fill: '#fa709a', r: timeSeriesData.length <= 5 ? 6 : 4 }}
                  activeDot={{ r: 8 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 状态码分布 */}
        <div className="chart-card">
          <h3>� 状态码分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 请求方法分布 */}
        <div className="chart-card">
          <h3>🔧 请求方法分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={methodData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#667eea" name="请求数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 访问路径 */}
        <div className="chart-card full-width">
          <h3>🔥 Top 10 访问路径</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={pathData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={200} />
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="custom-tooltip">
                      <p className="tooltip-path">{payload[0].payload.fullPath}</p>
                      <p className="tooltip-count">请求次数: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Legend />
              <Bar dataKey="count" fill="#764ba2" name="请求次数" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 客户端 IP */}
        <div className="chart-card full-width">
          <h3>👥 Top 10 客户端 IP</h3>
          <p className="chart-hint">💡 点击柱状图可按IP筛选</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ipData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#4facfe" 
                name="请求次数"
                onClick={handleIPBarClick}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 访问域名 */}
        <div className="chart-card full-width">
          <h3>🌍 Top 10 访问域名</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#43e97b" name="请求次数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
