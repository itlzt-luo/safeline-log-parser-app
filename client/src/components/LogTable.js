import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Calendar, X, Loader, AlertCircle, FileText, Clock, Globe, BarChart2, User, Filter } from 'lucide-react';
import './LogTable.css';

function LogTable({ logs, loadMode = 'full', logPath = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [ipFilter, setIpFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [tempDateRange, setTempDateRange] = useState({ start: '', end: '' }); // 用于日期输入框的临时状态
  const [sortBy, setSortBy] = useState('time-desc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // 分页模式专用状态
  const [paginatedLogs, setPaginatedLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null); // 筛选器选项

  // 加载分页数据（仅在优化模式下）
  const loadPaginatedData = useCallback(async (page = 1, requestMetadata = false) => {
    if (loadMode !== 'optimized' || !logPath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/logs/paginated', {
        logPath,
        page,
        pageSize: itemsPerPage,
        filters: {
          statusFilter: statusFilter !== 'all' ? statusFilter : undefined,
          methodFilter: methodFilter !== 'all' ? methodFilter : undefined,
          domainFilter: domainFilter !== 'all' ? domainFilter : undefined,
          ipFilter: ipFilter !== 'all' ? ipFilter : undefined,
          startTime: dateRange.start || undefined,
          endTime: dateRange.end || undefined,
          searchTerm: searchTerm || undefined
        },
        sortBy, // 添加排序参数
        includeMetadata: requestMetadata // 第一次请求时获取元数据
      });
      
      setPaginatedLogs(response.data.logs);
      setPagination(response.data.pagination);
      setCurrentPage(page);
      
      // 保存筛选器元数据
      if (response.data.filterOptions) {
        setFilterOptions(response.data.filterOptions);
      }
    } catch (err) {
      setError('加载日志失败: ' + (err.response?.data?.error || err.message));
      console.error('加载日志失败:', err);
    } finally {
      setLoading(false);
    }
  }, [loadMode, logPath, itemsPerPage, statusFilter, methodFilter, domainFilter, ipFilter, dateRange, searchTerm, sortBy]);

  // 优化模式下，第一次加载时获取元数据
  useEffect(() => {
    if (loadMode === 'optimized') {
      loadPaginatedData(1, true); // 第一次请求包含元数据
    }
  }, [loadMode, loadPaginatedData]); // 只在loadMode或loadPaginatedData改变时执行

  // 优化模式下，筛选条件改变时重新加载第一页（不请求元数据）
  useEffect(() => {
    if (loadMode === 'optimized' && filterOptions) { // 确保已有元数据后才响应筛选变化
      loadPaginatedData(1, false);
    }
  }, [statusFilter, methodFilter, domainFilter, ipFilter, dateRange, itemsPerPage, searchTerm, sortBy, loadMode, filterOptions, loadPaginatedData]); // 添加sortBy依赖

  // 标准化请求方法
  const normalizeMethod = (method) => {
    const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const upperMethod = method.toUpperCase().trim();
    return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
  };

  // 获取所有唯一的请求方法（标准化后）
  const uniqueMethods = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && filterOptions?.methods) {
      return filterOptions.methods;
    }
    // 全量模式：从logs计算
    const dataSource = loadMode === 'optimized' ? paginatedLogs : logs;
    const methods = [...new Set(dataSource.map(log => normalizeMethod(log.method)))].sort();
    // 确保常用方法在前
    const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];
    return methods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [logs, paginatedLogs, loadMode, filterOptions]);

  // 获取所有唯一的域名
  const uniqueDomains = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && filterOptions?.domains) {
      return filterOptions.domains;
    }
    // 全量模式：从logs计算
    const dataSource = loadMode === 'optimized' ? paginatedLogs : logs;
    return [...new Set(dataSource.map(log => log.domain))].sort();
  }, [logs, paginatedLogs, loadMode, filterOptions]);

  // 获取所有唯一的客户端IP
  const uniqueIPs = useMemo(() => {
    // 优化模式：使用后端返回的元数据
    if (loadMode === 'optimized' && filterOptions?.clientIPs) {
      return filterOptions.clientIPs;
    }
    // 全量模式：从logs计算
    const dataSource = loadMode === 'optimized' ? paginatedLogs : logs;
    return [...new Set(dataSource.map(log => log.clientIp))].sort((a, b) => {
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
  }, [logs, paginatedLogs, loadMode, filterOptions]);

  // 格式化时间为友好格式
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // 如果是今天
    if (days === 0) {
      if (hours === 0) {
        if (minutes === 0) {
          return seconds < 10 ? '刚刚' : `${seconds}秒前`;
        }
        return `${minutes}分钟前`;
      }
      return `${hours}小时前`;
    }
    
    // 如果是昨天
    if (days === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // 如果是本周
    if (days < 7) {
      return `${days}天前`;
    }
    
    // 其他情况显示完整日期
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 过滤和排序日志（仅在全量模式下）
  const filteredLogs = useMemo(() => {
    if (loadMode === 'optimized') {
      // 优化模式：直接使用后端返回的数据
      return paginatedLogs;
    }
    
    // 全量模式：前端过滤和排序
    let filtered = logs.filter(log => {
      // 搜索过滤
      const matchesSearch = 
        log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.clientIp.includes(searchTerm) ||
        (log.location && log.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.domain.toLowerCase().includes(searchTerm.toLowerCase());

      // 状态码过滤
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === '2xx' && log.status >= 200 && log.status < 300) ||
        (statusFilter === '3xx' && log.status >= 300 && log.status < 400) ||
        (statusFilter === '4xx' && log.status >= 400 && log.status < 500) ||
        (statusFilter === '5xx' && log.status >= 500);

      // 请求方法过滤（标准化后比较）
      const matchesMethod = methodFilter === 'all' || normalizeMethod(log.method) === methodFilter;

      // 域名过滤
      const matchesDomain = domainFilter === 'all' || log.domain === domainFilter;

      // IP过滤
      const matchesIP = ipFilter === 'all' || log.clientIp === ipFilter;

      // 日期范围过滤
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const logDate = new Date(log.timestampDate || log.timestamp);
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          matchesDate = matchesDate && logDate >= startDate;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); // 包含结束日期的整天
          matchesDate = matchesDate && logDate <= endDate;
        }
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDomain && matchesIP && matchesDate;
    });

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time-desc':
          return new Date(b.timestampDate || b.timestamp) - new Date(a.timestampDate || a.timestamp);
        case 'time-asc':
          return new Date(a.timestampDate || a.timestamp) - new Date(b.timestampDate || b.timestamp);
        case 'size-desc':
          return b.size - a.size;
        case 'size-asc':
          return a.size - b.size;
        case 'status-asc':
          return a.status - b.status;
        case 'status-desc':
          return b.status - a.status;
        default:
          return 0;
      }
    });

    return filtered;
  }, [logs, paginatedLogs, loadMode, searchTerm, statusFilter, methodFilter, domainFilter, ipFilter, dateRange, sortBy]);

  // 分页（仅在全量模式下进行前端分页）
  const totalPages = loadMode === 'optimized' 
    ? (pagination?.totalPages || 1)
    : Math.ceil(filteredLogs.length / itemsPerPage);
  
  const currentPageLogs = loadMode === 'optimized'
    ? filteredLogs  // 优化模式：直接使用后端分页数据
    : filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);  // 全量模式：前端分页

  // 状态码颜色
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'status-success';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-error';
    if (status >= 500) return 'status-server-error';
    return '';
  };

  // 格式化大小
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 查看详情
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLog(null);
    // 恢复背景滚动
    document.body.style.overflow = 'unset';
  };

  // 点击域名设置筛选
  const handleDomainClick = (domain) => {
    setDomainFilter(domain);
    setCurrentPage(1);
    // 如果详情页打开，则关闭它
    if (showModal) {
      handleCloseModal();
    }
  };

  // 点击IP设置筛选
  const handleIpClick = (ip) => {
    setIpFilter(ip);
    setCurrentPage(1);
    // 如果详情页打开，则关闭它
    if (showModal) {
      handleCloseModal();
    }
  };

  // 点击方法设置筛选
  const handleMethodClick = (method) => {
    setMethodFilter(normalizeMethod(method));
    setCurrentPage(1);
    // 如果详情页打开，则关闭它
    if (showModal) {
      handleCloseModal();
    }
  };

  // 点击状态码设置筛选
  const handleStatusClick = (status) => {
    if (status >= 200 && status < 300) {
      setStatusFilter('2xx');
    } else if (status >= 300 && status < 400) {
      setStatusFilter('3xx');
    } else if (status >= 400 && status < 500) {
      setStatusFilter('4xx');
    } else if (status >= 500) {
      setStatusFilter('5xx');
    }
    setCurrentPage(1);
    // 如果详情页打开，则关闭它
    if (showModal) {
      handleCloseModal();
    }
  };

  // 快捷日期选择
  // 格式化日期为 YYYY-MM-DD（本地时间）
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const applyDateRange = (range) => {
    setDateRange(range);
    setTempDateRange(range);
    setCurrentPage(1);
  };

  const handleQuickDateSelect = (type) => {
    const now = new Date();
    // 获取今天的日期（00:00:00）
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (type) {
      case 'today':
        // 今天：设置为同一天，筛选逻辑会自动处理为 00:00:00 - 23:59:59
        applyDateRange({
          start: formatLocalDate(today),
          end: formatLocalDate(today)
        });
        break;
      case 'yesterday':
        // 昨天：设置为同一天
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        applyDateRange({
          start: formatLocalDate(yesterday),
          end: formatLocalDate(yesterday)
        });
        break;
      case 'last7days':
        // 最近7天：从7天前到今天
        const last7days = new Date(today);
        last7days.setDate(last7days.getDate() - 6);
        applyDateRange({
          start: formatLocalDate(last7days),
          end: formatLocalDate(today)
        });
        break;
      case 'last30days':
        // 最近30天：从30天前到今天
        const last30days = new Date(today);
        last30days.setDate(last30days.getDate() - 29);
        applyDateRange({
          start: formatLocalDate(last30days),
          end: formatLocalDate(today)
        });
        break;
      case 'thisMonth':
        // 本月：从本月1号到今天
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        applyDateRange({
          start: formatLocalDate(monthStart),
          end: formatLocalDate(today)
        });
        break;
      case 'lastMonth':
        // 上月：从上月1号到上月最后一天
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        applyDateRange({
          start: formatLocalDate(lastMonthStart),
          end: formatLocalDate(lastMonthEnd)
        });
        break;
      default:
        break;
    }
  };

  return (
    <div className="log-table-container">
      {/* 过滤器 */}
      <div className="filters">
        <div className="search-box" style={{ position: 'relative' }}>
          <Search size={16} className="search-icon" style={{ position: 'absolute', left: '10px', top: '10px', color: '#888' }} />
          <input
            type="text"
            placeholder="搜索路径、IP、归属地、方法或域名..."
            value={searchTerm}
            style={{ paddingLeft: '32px' }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="filter-group">
          <select 
            className="filter-select"
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">所有状态</option>
            <option value="2xx">2xx 成功</option>
            <option value="3xx">3xx 重定向</option>
            <option value="4xx">4xx 客户端错误</option>
            <option value="5xx">5xx 服务器错误</option>
          </select>

          <select 
            className="filter-select"
            value={methodFilter} 
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">所有方法</option>
            {uniqueMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={domainFilter} 
            onChange={(e) => {
              setDomainFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">所有域名</option>
            {uniqueDomains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={ipFilter} 
            onChange={(e) => {
              setIpFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">所有IP</option>
            {uniqueIPs.map(ip => (
              <option key={ip} value={ip}>{ip}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={sortBy} 
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="time-desc">时间降序</option>
            <option value="time-asc">时间升序</option>
            <option value="size-desc">大小降序</option>
            <option value="size-asc">大小升序</option>
            <option value="status-asc">状态升序</option>
            <option value="status-desc">状态降序</option>
          </select>

          <select 
            className="filter-select"
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
            <option value={200}>200条/页</option>
          </select>
        </div>
      </div>

      {/* 日期范围过滤 */}
      <div className="date-filter">
        <div className="date-quick-buttons">
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('today')}
            title="查看今天的日志"
          >
            今天
          </button>
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('yesterday')}
            title="查看昨天的日志"
          >
            昨天
          </button>
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('last7days')}
            title="查看最近7天的日志"
          >
            最近7天
          </button>
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('last30days')}
            title="查看最近30天的日志"
          >
            最近30天
          </button>
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('thisMonth')}
            title="查看本月的日志"
          >
            本月
          </button>
          <button 
            className="quick-date-btn"
            onClick={() => handleQuickDateSelect('lastMonth')}
            title="查看上月的日志"
          >
            上月
          </button>
        </div>
        <div className="date-inputs">
          <label>
            <Calendar size={16} /> 开始日期:
            <input
              type="date"
              value={tempDateRange.start}
              onChange={(e) => {
                setTempDateRange({ ...tempDateRange, start: e.target.value });
              }}
            />
          </label>
          <label>
            <Calendar size={16} /> 结束日期:
            <input
              type="date"
              value={tempDateRange.end}
              onChange={(e) => {
                setTempDateRange({ ...tempDateRange, end: e.target.value });
              }}
            />
          </label>
          <button 
            className="apply-date-btn"
            onClick={() => {
              applyDateRange(tempDateRange);
            }}
          >
            确定
          </button>
          {(tempDateRange.start || tempDateRange.end) && (
            <button 
              className="clear-date-btn"
              onClick={() => {
                applyDateRange({ start: '', end: '' });
              }}
            >
              <X size={14} /> 清除
            </button>
          )}
        </div>
      </div>

      {/* 结果统计 */}
      <div className="results-info">
        {loadMode === 'optimized' ? (
          loading ? (
            <span><Loader size={16} className="spin" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}} /> 加载中...</span>
          ) : error ? (
            <span style={{ color: 'red' }}><AlertCircle size={16} style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}} /> {error}</span>
          ) : pagination ? (
            <span>
              显示第 {pagination.currentPage} 页 / 共 {pagination.totalPages} 页
              （总计 {pagination.totalLogs} 条记录，每页 {pagination.pageSize} 条）
            </span>
          ) : (
            <span>无数据</span>
          )
        ) : (
          <span>
            显示 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLogs.length)} / 共 {filteredLogs.length} 条记录
          </span>
        )}
      </div>

      {/* 表格 */}
      <div className="table-wrapper">
        {loadMode === 'optimized' && loading ? (
          <div className="loading-container" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner"><Loader size={48} className="spin" style={{margin: '0 auto'}} /></div>
            <p>正在加载日志数据...</p>
          </div>
        ) : loadMode === 'optimized' && error ? (
          <div className="error-container" style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
            <p><AlertCircle size={24} style={{verticalAlign: 'middle', marginRight: '8px'}} />{error}</p>
            <button onClick={() => loadPaginatedData(currentPage)}>重试</button>
          </div>
        ) : (
          <table className="log-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>域名</th>
                <th>方法</th>
                <th>路径</th>
                <th>状态码</th>
                <th>大小</th>
                <th>客户端 IP</th>
                <th>归属地</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {currentPageLogs.map((log, index) => (
                <tr key={index}>
                  <td className="timestamp" title={log.timestamp}>
                    {formatTime(log.timestampDate || log.timestamp)}
                  </td>
                  <td 
                    className="domain clickable-cell" 
                    title="点击筛选此域名"
                    onClick={() => handleDomainClick(log.domain)}
                  >
                    {log.domain}
                  </td>
                  <td 
                    className={`method method-${normalizeMethod(log.method).toLowerCase()} clickable-cell`}
                    title="点击筛选此方法"
                    onClick={() => handleMethodClick(log.method)}
                  >
                    {normalizeMethod(log.method)}
                  </td>
                  <td className="path" title={log.path}>{log.path}</td>
                  <td 
                    className={`status ${getStatusClass(log.status)} clickable-cell`}
                    title="点击筛选此状态码范围"
                    onClick={() => handleStatusClick(log.status)}
                  >
                    {log.status}
                  </td>
                  <td className="size">{formatSize(log.size)}</td>
                  <td 
                    className="ip clickable-cell"
                    title="点击筛选此IP"
                    onClick={() => handleIpClick(log.clientIp)}
                  >
                    {log.clientIp}
                  </td>
                  <td className="location">
                    {log.location || '-'}
                  </td>
                  <td className="actions">
                    <button 
                      className="detail-btn"
                      onClick={() => handleViewDetails(log)}
                      title="查看详情"
                    >
                      <Search size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => {
              if (loadMode === 'optimized') {
                loadPaginatedData(1);
              } else {
                setCurrentPage(1);
              }
            }}
            disabled={currentPage === 1 || (loadMode === 'optimized' && loading)}
          >
            首页
          </button>
          <button
            onClick={() => {
              if (loadMode === 'optimized') {
                loadPaginatedData(Math.max(1, currentPage - 1));
              } else {
                setCurrentPage(prev => Math.max(1, prev - 1));
              }
            }}
            disabled={currentPage === 1 || (loadMode === 'optimized' && loading)}
          >
            上一页
          </button>
          <span className="page-info">
            第 {currentPage} / {totalPages} 页 
            {loadMode === 'optimized' && pagination ? (
              ` （共 ${pagination.totalLogs} 条，每页 ${pagination.pageSize} 条）`
            ) : (
              ` （共 ${filteredLogs.length} 条，每页 ${itemsPerPage} 条）`
            )}
          </span>
          <button
            onClick={() => {
              if (loadMode === 'optimized') {
                loadPaginatedData(Math.min(totalPages, currentPage + 1));
              } else {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
              }
            }}
            disabled={currentPage === totalPages || (loadMode === 'optimized' && loading)}
          >
            下一页
          </button>
          <button
            onClick={() => {
              if (loadMode === 'optimized') {
                loadPaginatedData(totalPages);
              } else {
                setCurrentPage(totalPages);
              }
            }}
            disabled={currentPage === totalPages || (loadMode === 'optimized' && loading)}
          >
            末页
          </button>
        </div>
      )}

      {/* 详情模态框 */}
      {showModal && selectedLog && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FileText size={20} /> 请求详情</h2>
              <button className="close-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3><Clock size={18} /> 时间信息</h3>
                <div className="detail-item">
                  <span className="label">时间:</span>
                  <span className="value">{selectedLog.timestamp}</span>
                </div>
                <div className="detail-item">
                  <span className="label">友好时间:</span>
                  <span className="value">{formatTime(selectedLog.timestampDate || selectedLog.timestamp)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3><Globe size={18} /> 请求信息</h3>
                <div className="detail-item">
                  <span className="label">域名:</span>
                  <span 
                    className="value highlight clickable-filter" 
                    onClick={() => handleDomainClick(selectedLog.domain)}
                    title="点击筛选此域名"
                  >
                    {selectedLog.domain} <Filter size={14} style={{verticalAlign: 'middle', marginLeft: '4px'}} />
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">请求方法:</span>
                  <span 
                    className={`value method-badge method-${normalizeMethod(selectedLog.method).toLowerCase()} clickable-filter`}
                    onClick={() => handleMethodClick(selectedLog.method)}
                    title="点击筛选此方法"
                  >
                    {normalizeMethod(selectedLog.method)} <Filter size={14} style={{verticalAlign: 'middle', marginLeft: '4px'}} />
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">请求路径:</span>
                  <span className="value path-value">{selectedLog.path}</span>
                </div>
                <div className="detail-item">
                  <span className="label">协议:</span>
                  <span className="value">{selectedLog.protocol}</span>
                </div>
                <div className="detail-item">
                  <span className="label">完整请求:</span>
                  <span className="value">{selectedLog.fullRequest}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3><BarChart2 size={18} /> 响应信息</h3>
                <div className="detail-item">
                  <span className="label">状态码:</span>
                  <span 
                    className={`value status-badge ${getStatusClass(selectedLog.status)} clickable-filter`}
                    onClick={() => handleStatusClick(selectedLog.status)}
                    title="点击筛选此状态码范围"
                  >
                    {selectedLog.status} <Filter size={14} style={{verticalAlign: 'middle', marginLeft: '4px'}} />
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">响应大小:</span>
                  <span className="value">{formatSize(selectedLog.size)} ({selectedLog.size} bytes)</span>
                </div>
              </div>

              <div className="detail-section">
                <h3><User size={18} /> 客户端信息</h3>
                <div className="detail-item">
                  <span className="label">服务器 IP:</span>
                  <span className="value">{selectedLog.ip}</span>
                </div>
                <div className="detail-item">
                  <span className="label">客户端 IP:</span>
                  <span 
                    className="value highlight clickable-filter" 
                    onClick={() => handleIpClick(selectedLog.clientIp)}
                    title="点击筛选此IP"
                  >
                    {selectedLog.clientIp} <Filter size={14} style={{verticalAlign: 'middle', marginLeft: '4px'}} />
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">IP 归属地:</span>
                  <span className="value">{selectedLog.location || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">User-Agent:</span>
                  <span className="value user-agent-value">{selectedLog.userAgent}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Referer:</span>
                  <span className="value">{selectedLog.referer}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModal}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogTable;
