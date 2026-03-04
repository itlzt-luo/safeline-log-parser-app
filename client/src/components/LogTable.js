import React, { useState, useMemo } from 'react';
import './LogTable.css';

function LogTable({ logs }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [ipFilter, setIpFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('time-desc');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // 标准化请求方法
  const normalizeMethod = (method) => {
    const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const upperMethod = method.toUpperCase().trim();
    return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
  };

  // 获取所有唯一的请求方法（标准化后）
  const uniqueMethods = useMemo(() => {
    const methods = [...new Set(logs.map(log => normalizeMethod(log.method)))].sort();
    // 确保常用方法在前
    const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];
    return methods.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [logs]);

  // 获取所有唯一的域名
  const uniqueDomains = useMemo(() => {
    return [...new Set(logs.map(log => log.domain))].sort();
  }, [logs]);

  // 获取所有唯一的客户端IP
  const uniqueIPs = useMemo(() => {
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
  }, [logs]);

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

  // 过滤和排序日志
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      // 搜索过滤
      const matchesSearch = 
        log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.clientIp.includes(searchTerm) ||
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
  }, [logs, searchTerm, statusFilter, methodFilter, domainFilter, ipFilter, dateRange, sortBy]);

  // 分页
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

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
  };  return (
    <div className="log-table-container">
      {/* 过滤器 */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 搜索路径、IP、方法或域名..."
            value={searchTerm}
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
            <option value="all">📊 所有状态</option>
            <option value="2xx">✅ 2xx 成功</option>
            <option value="3xx">🔄 3xx 重定向</option>
            <option value="4xx">⚠️ 4xx 客户端错误</option>
            <option value="5xx">❌ 5xx 服务器错误</option>
          </select>

          <select 
            className="filter-select"
            value={methodFilter} 
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">🔧 所有方法</option>
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
            <option value="all">🌍 所有域名</option>
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
            <option value="all">🖥️ 所有IP</option>
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
            <option value="time-desc">⏬ 时间降序</option>
            <option value="time-asc">⏫ 时间升序</option>
            <option value="size-desc">📦 大小降序</option>
            <option value="size-asc">📦 大小升序</option>
            <option value="status-asc">📈 状态升序</option>
            <option value="status-desc">📉 状态降序</option>
          </select>

          <select 
            className="filter-select"
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>📄 10条/页</option>
            <option value={20}>📄 20条/页</option>
            <option value={50}>📄 50条/页</option>
            <option value={100}>📄 100条/页</option>
            <option value={200}>📄 200条/页</option>
          </select>
        </div>
      </div>

      {/* 日期范围过滤 */}
      <div className="date-filter">
        <label>
          📅 开始日期:
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => {
              setDateRange({ ...dateRange, start: e.target.value });
              setCurrentPage(1);
            }}
          />
        </label>
        <label>
          📅 结束日期:
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => {
              setDateRange({ ...dateRange, end: e.target.value });
              setCurrentPage(1);
            }}
          />
        </label>
        {(dateRange.start || dateRange.end) && (
          <button 
            className="clear-date-btn"
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setCurrentPage(1);
            }}
          >
            清除日期
          </button>
        )}
      </div>

      {/* 结果统计 */}
      <div className="results-info">
        显示 {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} / 共 {filteredLogs.length} 条记录
      </div>

      {/* 表格 */}
      <div className="table-wrapper">
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.map((log, index) => (
              <tr key={index}>
                <td className="timestamp" title={log.timestamp}>
                  {formatTime(log.timestampDate || log.timestamp)}
                </td>
                <td className="domain" title={log.domain}>{log.domain}</td>
                <td className={`method method-${normalizeMethod(log.method).toLowerCase()}`}>
                  {normalizeMethod(log.method)}
                </td>
                <td className="path" title={log.path}>{log.path}</td>
                <td className={`status ${getStatusClass(log.status)}`}>{log.status}</td>
                <td className="size">{formatSize(log.size)}</td>
                <td className="ip">{log.clientIp}</td>
                <td className="actions">
                  <button 
                    className="detail-btn"
                    onClick={() => handleViewDetails(log)}
                    title="查看详情"
                  >
                    🔍
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            首页
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <span className="page-info">
            第 {currentPage} / {totalPages} 页 （共 {filteredLogs.length} 条，每页 {itemsPerPage} 条）
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
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
              <h2>📋 请求详情</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>⏰ 时间信息</h3>
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
                <h3>🌐 请求信息</h3>
                <div className="detail-item">
                  <span className="label">域名:</span>
                  <span className="value highlight">{selectedLog.domain}</span>
                </div>
                <div className="detail-item">
                  <span className="label">请求方法:</span>
                  <span className={`value method-badge method-${normalizeMethod(selectedLog.method).toLowerCase()}`}>
                    {normalizeMethod(selectedLog.method)}
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
                <h3>📊 响应信息</h3>
                <div className="detail-item">
                  <span className="label">状态码:</span>
                  <span className={`value status-badge ${getStatusClass(selectedLog.status)}`}>
                    {selectedLog.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">响应大小:</span>
                  <span className="value">{formatSize(selectedLog.size)} ({selectedLog.size} bytes)</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>👤 客户端信息</h3>
                <div className="detail-item">
                  <span className="label">服务器 IP:</span>
                  <span className="value">{selectedLog.ip}</span>
                </div>
                <div className="detail-item">
                  <span className="label">客户端 IP:</span>
                  <span className="value highlight">{selectedLog.clientIp}</span>
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
