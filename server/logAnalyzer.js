const fs = require('fs');
const readline = require('readline');
const logParser = require('./logParser');

/**
 * 大文件日志分析器 - 流式处理，避免一次性加载所有数据
 */
class LogAnalyzer {
  /**
   * 只统计分析，不返回原始日志（适合大文件）
   * @param {string} filePath - 日志文件路径
   * @param {object} filters - 筛选条件
   * @returns {Promise<object>} 统计结果
   */
  async analyzeOnly(filePath, filters = {}) {
    return new Promise((resolve, reject) => {
      const stats = {
        totalRequests: 0,
        statusCodes: {},
        methods: {},
        clientIPs: {},
        locations: {},
        domains: {},
        paths: {},
        totalSize: 0,
        errorCount: 0,
        timeSeriesData: {},
        startTime: null,
        endTime: null
      };

      // 收集筛选器元数据（不受筛选条件影响）
      const metadata = {
        methods: new Set(),
        domains: new Set(),
        clientIPs: new Set()
      };

      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        try {
          const log = logParser.parseLine(line);
          if (!log) return;

          // 始终收集元数据（用于筛选器选项）
          metadata.methods.add(log.method.toUpperCase());
          metadata.domains.add(log.domain);
          metadata.clientIPs.add(log.clientIp);

          // 应用筛选条件（仅影响统计数据）
          if (!this.matchesFilters(log, filters)) return;

          // 统计数据
          stats.totalRequests++;
          
          // 状态码
          stats.statusCodes[log.status] = (stats.statusCodes[log.status] || 0) + 1;
          
          // 请求方法
          const method = log.method.toUpperCase().trim();
          stats.methods[method] = (stats.methods[method] || 0) + 1;
          
          // 客户端IP及归属地
          stats.clientIPs[log.clientIp] = (stats.clientIPs[log.clientIp] || 0) + 1;
          if (log.location) {
            stats.locations[log.location] = (stats.locations[log.location] || 0) + 1;
          }
          
          // 域名
          stats.domains[log.domain] = (stats.domains[log.domain] || 0) + 1;
          
          // 路径
          stats.paths[log.path] = (stats.paths[log.path] || 0) + 1;
          
          // 响应大小
          stats.totalSize += log.size;
          
          // 错误计数
          if (log.status >= 400) stats.errorCount++;

          // 时间范围
          const logDate = new Date(log.timestampDate || log.timestamp);
          if (!stats.startTime || logDate < stats.startTime) {
            stats.startTime = logDate;
          }
          if (!stats.endTime || logDate > stats.endTime) {
            stats.endTime = logDate;
          }

          // 时间序列数据 - 先收集所有时间点，稍后统一处理粒度
          const timeStamp = logDate.getTime();
          if (!stats.rawTimeData) {
            stats.rawTimeData = [];
          }
          stats.rawTimeData.push({
            timestamp: timeStamp,
            date: logDate,
            status: log.status
          });
        } catch (error) {
          // 忽略解析错误的行
          console.error('解析行失败:', error.message);
        }
      });

      rl.on('close', () => {
        // 处理时间序列数据 - 根据实际数据量动态选择粒度
        const timeSeriesArray = this.processTimeSeriesData(
          stats.rawTimeData || [],
          stats.startTime,
          stats.endTime
        );
        
        // 标准化方法名（用于filterOptions）
        const normalizeMethod = (method) => {
          const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
          const upperMethod = method.toUpperCase().trim();
          return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
        };

        // 从metadata生成filterOptions（包含所有未筛选的选项）
        const uniqueMethods = [...metadata.methods].map(normalizeMethod);
        const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];

        // 处理省份分布 (用于地图)
        const provinceStats = {};
        const provinceMap = {
          '北京': '北京市',
          '天津': '天津市',
          '上海': '上海市',
          '重庆': '重庆市',
          '新疆': '新疆维吾尔自治区',
          '西藏': '西藏自治区',
          '宁夏': '宁夏回族自治区',
          '内蒙古': '内蒙古自治区',
          '广西': '广西壮族自治区',
          '香港': '香港特别行政区',
          '澳门': '澳门特别行政区'
        };

        Object.entries(stats.locations).forEach(([loc, count]) => {
          if (!loc || loc === '未知' || loc === '内网IP') return;
          const parts = loc.split('-');
          let province = parts[0];
          
          if (province === '中国' && parts.length > 1) {
            province = parts[1];
          }
          
          if (provinceMap[province]) {
            province = provinceMap[province];
          }
          
          if (province) {
            provinceStats[province] = (provinceStats[province] || 0) + count;
          }
        });

        // 处理统计结果
        const result = {
          totalRequests: stats.totalRequests,
          uniqueIPs: Object.keys(stats.clientIPs).length,
          statusCodes: stats.statusCodes,
          methods: stats.methods,
          topPaths: Object.entries(stats.paths)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([path, count]) => ({ path, count })),
          topClientIPs: Object.entries(stats.clientIPs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([ip, count]) => ({ ip, count })),
          topLocations: Object.entries(stats.locations)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([location, count]) => ({ location, count })),
          provinceDistribution: Object.entries(provinceStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value),
          topDomains: Object.entries(stats.domains)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([domain, count]) => ({ domain, count })),
          errorRate: stats.totalRequests > 0 
            ? ((stats.errorCount / stats.totalRequests) * 100).toFixed(2)
            : 0,
          avgResponseSize: stats.totalRequests > 0
            ? Math.round(stats.totalSize / stats.totalRequests)
            : 0,
          timeSeriesData: timeSeriesArray,
          timeRange: {
            start: stats.startTime,
            end: stats.endTime
          },
          // 筛选器元数据（从全部数据收集，不受筛选条件影响）
          filterOptions: {
            methods: [...new Set(uniqueMethods)].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
            domains: [...metadata.domains].sort(),
            clientIPs: [...metadata.clientIPs].sort((a, b) => {
              // IP地址排序
              const aParts = a.split('.').map(Number);
              const bParts = b.split('.').map(Number);
              for (let i = 0; i < 4; i++) {
                if (aParts[i] !== bParts[i]) {
                  return aParts[i] - bParts[i];
                }
              }
              return 0;
            })
          }
        };

        resolve(result);
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 分页获取日志详情
   * @param {string} filePath - 日志文件路径
   * @param {object} options - 分页选项 { page, pageSize, filters, sortBy, includeMetadata }
   * @returns {Promise<object>} 分页结果
   */
  async getLogsPaginated(filePath, options = {}) {
    const { page = 1, pageSize = 100, filters = {}, sortBy = 'time-desc', includeMetadata = false } = options;
    
    return new Promise((resolve, reject) => {
      const allMatchedLogs = []; // 收集所有匹配的日志用于排序
      let lineCount = 0;
      
      // 如果需要元数据，收集所有唯一值
      const metadata = includeMetadata ? {
        methods: new Set(),
        domains: new Set(),
        clientIPs: new Set()
      } : null;

      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        try {
          lineCount++;
          const log = logParser.parseLine(line);
          if (!log) return;

          // 收集元数据
          if (metadata) {
            metadata.methods.add(log.method.toUpperCase());
            metadata.domains.add(log.domain);
            metadata.clientIPs.add(log.clientIp);
          }

          // 应用筛选条件
          if (!this.matchesFilters(log, filters)) return;
          
          // 收集所有匹配的日志
          allMatchedLogs.push(log);
        } catch (error) {
          // 忽略解析错误的行
        }
      });

      rl.on('close', () => {
        // 排序
        this.sortLogs(allMatchedLogs, sortBy);

        // 计算分页
        const totalMatched = allMatchedLogs.length;
        const skip = (page - 1) * pageSize;
        const logs = allMatchedLogs.slice(skip, skip + pageSize);

        const result = {
          logs,
          pagination: {
            page,
            pageSize,
            totalLogs: totalMatched,
            totalPages: Math.ceil(totalMatched / pageSize),
            hasMore: skip + pageSize < totalMatched,
            currentPage: page
          }
        };

        // 添加筛选器元数据
        if (metadata) {
          const normalizeMethod = (method) => {
            const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
            const upperMethod = method.toUpperCase().trim();
            return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
          };

          const uniqueMethods = [...metadata.methods].map(normalizeMethod);
          const order = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'OTHER'];
          
          result.filterOptions = {
            methods: [...new Set(uniqueMethods)].sort((a, b) => order.indexOf(a) - order.indexOf(b)),
            domains: [...metadata.domains].sort(),
            clientIPs: [...metadata.clientIPs].sort((a, b) => {
              const aParts = a.split('.').map(Number);
              const bParts = b.split('.').map(Number);
              for (let i = 0; i < 4; i++) {
                if (aParts[i] !== bParts[i]) {
                  return aParts[i] - bParts[i];
                }
              }
              return 0;
            })
          };
        }

        resolve(result);
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 处理时间序列数据 - 根据实际数据动态选择合适的粒度
   * 目标：生成20-50个数据点，既不太密集也不太稀疏
   */
  processTimeSeriesData(rawTimeData, startTime, endTime) {
    if (!rawTimeData || rawTimeData.length === 0) {
      return [];
    }

    // 按时间排序
    rawTimeData.sort((a, b) => a.timestamp - b.timestamp);

    const timeRangeMs = endTime - startTime;
    const seconds = timeRangeMs / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = hours / 24;

    // 目标：生成大约 20-60 个数据点
    let granularityMs;
    let formatFunc;

    // 根据时间跨度和目标点数，动态选择更合理的粒度
    if (days > 180) {
      // 超过半年：按月
      granularityMs = 30 * 24 * 60 * 60 * 1000;
      formatFunc = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (days > 60) {
      // 2-6个月：按周
      granularityMs = 7 * 24 * 60 * 60 * 1000;
      formatFunc = (d) => {
        const weekNum = Math.floor((d - new Date(d.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)) + 1;
        return `${d.getFullYear()} 第${weekNum}周`;
      };
    } else if (days > 14) {
      // 2周-2个月：按天
      granularityMs = 24 * 60 * 60 * 1000;
      formatFunc = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    } else if (days > 3) {
      // 3-14天：按 6 小时 或 12 小时 (确保点数在 12-56 之间)
      granularityMs = (days > 7 ? 12 : 6) * 60 * 60 * 1000;
      formatFunc = (d) => {
        const hour = Math.floor(d.getHours() / (granularityMs / (60 * 60 * 1000))) * (granularityMs / (60 * 60 * 1000));
        return `${d.getMonth() + 1}/${d.getDate()} ${String(hour).padStart(2, '0')}:00`;
      };
    } else if (days > 1) {
      // 1-3天：按 1 小时 或 2 小时
      granularityMs = (days > 2 ? 2 : 1) * 60 * 60 * 1000;
      formatFunc = (d) => {
        const hour = Math.floor(d.getHours() / (granularityMs / (60 * 60 * 1000))) * (granularityMs / (60 * 60 * 1000));
        return `${d.getMonth() + 1}/${d.getDate()} ${String(hour).padStart(2, '0')}:00`;
      };
    } else if (hours > 12) {
      // 12-24小时：按 30 分钟
      granularityMs = 30 * 60 * 1000;
      formatFunc = (d) => {
        const minute = Math.floor(d.getMinutes() / 30) * 30;
        return `${String(d.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
    } else if (hours > 4) {
      // 4-12小时：按 10 分钟或 15 分钟
      granularityMs = (hours > 8 ? 15 : 10) * 60 * 1000;
      formatFunc = (d) => {
        const minute = Math.floor(d.getMinutes() / (granularityMs / (60 * 1000))) * (granularityMs / (60 * 1000));
        return `${String(d.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
    } else if (hours > 1) {
      // 1-4小时：按 2 分钟或 5 分钟
      granularityMs = (hours > 2 ? 5 : 2) * 60 * 1000;
      formatFunc = (d) => {
        const minute = Math.floor(d.getMinutes() / (granularityMs / (60 * 1000))) * (granularityMs / (60 * 1000));
        return `${String(d.getHours()).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
    } else if (minutes > 15) {
      // 15-60分钟：按 1 分钟
      granularityMs = 60 * 1000;
      formatFunc = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } else if (minutes > 5) {
      // 5-15分钟：按 15 秒
      granularityMs = 15 * 1000;
      formatFunc = (d) => {
        const second = Math.floor(d.getSeconds() / 15) * 15;
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      };
    } else {
      // 5分钟内：按 5 秒或 1 秒
      granularityMs = (minutes > 2 ? 5 : 1) * 1000;
      formatFunc = (d) => {
        const second = Math.floor(d.getSeconds() / (granularityMs / 1000)) * (granularityMs / 1000);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      };
    }

    // 将数据按粒度分组
    const timeGroups = {};
    rawTimeData.forEach(item => {
      const bucketTime = Math.floor(item.timestamp / granularityMs) * granularityMs;
      const timeKey = formatFunc(new Date(bucketTime));
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = {
          time: timeKey,
          total: 0,
          success: 0,
          error: 0,
          bucketTime
        };
      }
      
      timeGroups[timeKey].total++;
      if (item.status >= 200 && item.status < 400) {
        timeGroups[timeKey].success++;
      } else if (item.status >= 400) {
        timeGroups[timeKey].error++;
      }
    });

    // 转换为数组并按时间排序
    let result = Object.values(timeGroups)
      .sort((a, b) => a.bucketTime - b.bucketTime);

    // 补齐空缺的时间点，让曲线更加平滑、美观，避免时间轴突然跳跃
    if (result.length > 1) {
      const filledResult = [];
      for (let i = 0; i < result.length - 1; i++) {
        const current = result[i];
        const next = result[i + 1];
        filledResult.push(current);

        // 如果两个点之间的跨度大于两倍粒度，填补中间的空位
        // 但为了防止生成过多点，限制最多填补50个空位
        let gapMs = next.bucketTime - current.bucketTime;
        let inserts = 0;
        
        while (gapMs > granularityMs * 1.5 && inserts < 50) {
          const newBucketTime = current.bucketTime + (inserts + 1) * granularityMs;
          if (newBucketTime >= next.bucketTime) break;
          
          filledResult.push({
            time: formatFunc(new Date(newBucketTime)),
            total: 0,
            success: 0,
            error: 0,
            bucketTime: newBucketTime
          });
          
          gapMs -= granularityMs;
          inserts++;
        }
      }
      filledResult.push(result[result.length - 1]);
      result = filledResult;
    }

    return result.map(({ time, total, success, error }) => ({ time, total, success, error }));
  }

  /**
   * 检查日志是否匹配筛选条件（包括搜索）
   */
  matchesFilters(log, filters) {
    // 搜索过滤
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        log.path.toLowerCase().includes(term) ||
        log.clientIp.includes(term) ||
        (log.location && log.location.toLowerCase().includes(term)) ||
        log.method.toLowerCase().includes(term) ||
        log.domain.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // 状态码筛选
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      const status = log.status;
      const filter = filters.statusFilter;
      if (filter === '2xx' && (status < 200 || status >= 300)) return false;
      if (filter === '3xx' && (status < 300 || status >= 400)) return false;
      if (filter === '4xx' && (status < 400 || status >= 500)) return false;
      if (filter === '5xx' && status < 500) return false;
    }

    // 请求方法筛选
    if (filters.methodFilter && filters.methodFilter !== 'all') {
      if (log.method.toUpperCase().trim() !== filters.methodFilter) return false;
    }

    // 域名筛选
    if (filters.domainFilter && filters.domainFilter !== 'all') {
      if (log.domain !== filters.domainFilter) return false;
    }

    // IP筛选
    if (filters.ipFilter && filters.ipFilter !== 'all') {
      if (log.clientIp !== filters.ipFilter) return false;
    }

    // 时间范围筛选
    if (filters.startTime || filters.endTime) {
      const logDate = new Date(log.timestampDate || log.timestamp);
      
      // 开始时间：设置为当天 00:00:00
      if (filters.startTime) {
        const startDate = new Date(filters.startTime);
        startDate.setHours(0, 0, 0, 0);
        if (logDate < startDate) return false;
      }
      
      // 结束时间：设置为当天 23:59:59.999
      if (filters.endTime) {
        const endDate = new Date(filters.endTime);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) return false;
      }
    }

    return true;
  }

  /**
   * 排序日志数组
   */
  sortLogs(logs, sortBy) {
    if (!sortBy || sortBy === 'time-desc') {
      // 默认：时间降序
      return logs.sort((a, b) => 
        new Date(b.timestampDate || b.timestamp) - new Date(a.timestampDate || a.timestamp)
      );
    }

    switch (sortBy) {
      case 'time-asc':
        return logs.sort((a, b) => 
          new Date(a.timestampDate || a.timestamp) - new Date(b.timestampDate || b.timestamp)
        );
      case 'size-desc':
        return logs.sort((a, b) => b.size - a.size);
      case 'size-asc':
        return logs.sort((a, b) => a.size - b.size);
      case 'status-asc':
        return logs.sort((a, b) => a.status - b.status);
      case 'status-desc':
        return logs.sort((a, b) => b.status - a.status);
      default:
        return logs;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(filePath) {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          // 估算行数（假设平均每行200字节）
          const estimatedLines = Math.floor(stats.size / 200);
          resolve({
            size: stats.size,
            sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
            estimatedLines,
            modified: stats.mtime,
            isLargeFile: stats.size > 10 * 1024 * 1024 // 超过10MB认为是大文件
          });
        }
      });
    });
  }
}

module.exports = new LogAnalyzer();
