/**
 * 日志解析器
 * 解析格式: IP | user | timestamp | "domai  parseLine(line) {
    try {
      // 使用正则表达式解析日志行
      // 格式: user-agent 后面是空格,client-ip 在引号外
      const pattern = /^(\S+)\s+\|\s+(\S+)\s+\|\s+([^\|]+)\|\s+"([^"]+)"\s+\|\s+"([^"]+)"\s+\|\s+(\d+)\s+\|\s+(\d+)\s+\|\s+"([^"]*)"\s+\|\s+"([^"]+)"\s+"([^"]+)"$/;
      
      const match = line.match(pattern);equest" | status | size | "referer" | "user-agent" "client-ip"
 */

class LogParser {
  /**
   * 解析时间戳
   * @param {string} timestamp - 时间戳字符串 (04/Mar/2026:09:53:59 +0800)
   * @returns {Date} - Date 对象
   */
  parseTimestamp(timestamp) {
    try {
      // 格式: 04/Mar/2026:09:53:59 +0800
      const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      const match = timestamp.match(/(\d{2})\/(\w{3})\/(\d{4}):(\d{2}):(\d{2}):(\d{2})\s+([+-]\d{4})/);
      if (match) {
        const [, day, monthStr, year, hour, minute, second, timezone] = match;
        const month = months[monthStr];
        
        // 创建 UTC 时间
        const date = new Date(Date.UTC(
          parseInt(year),
          month,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second)
        ));
        
        // 调整时区偏移
        const tzOffset = parseInt(timezone.substring(0, 3)) * 60 + parseInt(timezone.substring(3));
        date.setMinutes(date.getMinutes() - tzOffset);
        
        return date;
      }
      return new Date();
    } catch (error) {
      console.error('解析时间戳失败:', timestamp, error);
      return new Date();
    }
  }

  /**
   * 解析单行日志
   * @param {string} line - 日志行
   * @returns {object|null} - 解析后的日志对象
   */
  parseLine(line) {
    try {
      // 使用正则表达式解析日志行
      // 修正格式: user-agent 和 client-ip 之间是空格，且 client-ip 在引号内
      const pattern = /^(\S+)\s+\|\s+(\S+)\s+\|\s+([^\|]+)\|\s+"([^"]+)"\s+\|\s+"([^"]+)"\s+\|\s+(\d+)\s+\|\s+(\d+)\s+\|\s+"([^"]*)"\s+\|\s+"([^"]+)"\s+"([^"]+)"$/;
      
      const match = line.match(pattern);
      
      if (!match) {
        console.log('无法匹配日志行:', line);
        return null;
      }

      const [, ip, user, timestamp, domain, request, status, size, referer, userAgent, clientIp] = match;
      
      // 解析请求部分 (方法 路径 协议)
      const requestParts = request.match(/^(\S+)\s+(\S+)\s+(\S+)$/);
      let method = '', path = '', protocol = '';
      
      if (requestParts) {
        [, method, path, protocol] = requestParts;
      }

      // 解析时间戳为 JavaScript Date 对象
      // 格式: 04/Mar/2026:09:53:59 +0800
      const parsedDate = this.parseTimestamp(timestamp.trim());

      return {
        ip: ip.trim(),
        user: user.trim(),
        timestamp: timestamp.trim(),
        timestampDate: parsedDate,
        domain: domain.trim(),
        method: method.trim(),
        path: path.trim(),
        protocol: protocol.trim(),
        status: parseInt(status),
        size: parseInt(size),
        referer: referer.trim(),
        userAgent: userAgent.trim(),
        clientIp: clientIp.trim(),
        fullRequest: request.trim()
      };
    } catch (error) {
      console.error('解析行失败:', line, error);
      return null;
    }
  }

  /**
   * 解析整个日志文件
   * @param {string} content - 日志文件内容
   * @returns {array} - 解析后的日志数组
   */
  parse(content) {
    const lines = content.split('\n');
    const parsedLogs = [];

    for (const line of lines) {
      if (line.trim()) {
        const parsed = this.parseLine(line);
        if (parsed) {
          parsedLogs.push(parsed);
        }
      }
    }

    return parsedLogs;
  }

  /**
   * 标准化请求方法
   * @param {string} method - 原始请求方法
   * @returns {string} - 标准化后的方法
   */
  normalizeMethod(method) {
    const standardMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    const upperMethod = method.toUpperCase().trim();
    return standardMethods.includes(upperMethod) ? upperMethod : 'OTHER';
  }

  /**
   * 获取日志统计信息
   * @param {array} logs - 解析后的日志数组
   * @returns {object} - 统计信息
   */
  getStatistics(logs) {
    if (!logs || logs.length === 0) {
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

    logs.forEach(log => {
      // 统计状态码
      statusCodes[log.status] = (statusCodes[log.status] || 0) + 1;
      
      // 统计请求方法（标准化）
      const normalizedMethod = this.normalizeMethod(log.method);
      methods[normalizedMethod] = (methods[normalizedMethod] || 0) + 1;
      
      // 统计路径
      paths[log.path] = (paths[log.path] || 0) + 1;
      
      // 统计客户端 IP
      clientIPs[log.clientIp] = (clientIPs[log.clientIp] || 0) + 1;
      
      // 统计域名
      domains[log.domain] = (domains[log.domain] || 0) + 1;
      
      // 累加响应大小
      totalSize += log.size;
      
      // 统计错误（4xx 和 5xx）
      if (log.status >= 400) {
        errorCount++;
      }
    });

    // 获取唯一 IP 数量
    const uniqueIPs = new Set(logs.map(log => log.clientIp)).size;

    // 获取 Top 10 路径
    const topPaths = Object.entries(paths)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // 获取 Top 10 客户端 IP
    const topClientIPs = Object.entries(clientIPs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // 获取 Top 10 域名
    const topDomains = Object.entries(domains)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return {
      totalRequests: logs.length,
      uniqueIPs: uniqueIPs,
      statusCodes: statusCodes,
      methods: methods,
      topPaths: topPaths,
      topClientIPs: topClientIPs,
      topDomains: topDomains,
      errorRate: ((errorCount / logs.length) * 100).toFixed(2),
      avgResponseSize: Math.round(totalSize / logs.length)
    };
  }
}

module.exports = new LogParser();
