const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const logParser = require('./logParser');
const logAnalyzer = require('./logAnalyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// 配置文件上传
const upload = multer({ dest: 'uploads/' });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API 路由

// 解析日志文件
app.post('/api/parse-log', upload.single('logFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传文件' });
    }

    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // 解析日志
    const parsedLogs = logParser.parse(fileContent);
    const statistics = logParser.getStatistics(parsedLogs);

    // 清理上传的文件
    fs.unlinkSync(filePath);

    res.json({
      logs: parsedLogs,
      statistics: statistics
    });
  } catch (error) {
    console.error('解析日志时出错:', error);
    res.status(500).json({ error: '解析日志失败: ' + error.message });
  }
});

// 解析项目目录中的 log.txt
app.get('/api/parse-default-log', (req, res) => {
  try {
    const logPath = path.join(__dirname, '../log.txt');
    
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: '找不到 log.txt 文件' });
    }

    const fileContent = fs.readFileSync(logPath, 'utf-8');
    const parsedLogs = logParser.parse(fileContent);
    const statistics = logParser.getStatistics(parsedLogs);

    res.json({
      logs: parsedLogs,
      statistics: statistics
    });
  } catch (error) {
    console.error('解析日志时出错:', error);
    res.status(500).json({ error: '解析日志失败: ' + error.message });
  }
});

// 解析指定路径的日志文件
app.post('/api/parse-log-path', (req, res) => {
  try {
    const { logPath } = req.body;
    
    if (!logPath) {
      return res.status(400).json({ error: '请提供日志文件路径' });
    }

    // 检查文件是否存在
    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: `找不到文件: ${logPath}` });
    }

    // 检查是否为文件
    const stats = fs.statSync(logPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: '提供的路径不是文件' });
    }

    // 读取并解析文件
    const fileContent = fs.readFileSync(logPath, 'utf-8');
    const parsedLogs = logParser.parse(fileContent);
    const statistics = logParser.getStatistics(parsedLogs);

    res.json({
      logs: parsedLogs,
      statistics: statistics,
      filePath: logPath
    });
  } catch (error) {
    console.error('解析日志时出错:', error);
    res.status(500).json({ error: '解析日志失败: ' + error.message });
  }
});

// ==================== 优化的大文件处理API ====================

// 获取文件信息
app.post('/api/logs/file-info', async (req, res) => {
  try {
    const { logPath } = req.body;
    
    if (!logPath) {
      return res.status(400).json({ error: '请提供日志文件路径' });
    }

    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: `找不到文件: ${logPath}` });
    }

    const fileInfo = await logAnalyzer.getFileInfo(logPath);
    
    res.json({
      success: true,
      fileInfo
    });
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ error: '获取文件信息失败: ' + error.message });
  }
});

// 只分析统计数据，不返回原始日志（适合大文件）
app.post('/api/logs/analyze', async (req, res) => {
  try {
    const { logPath, filters = {} } = req.body;
    
    if (!logPath) {
      return res.status(400).json({ error: '请提供日志文件路径' });
    }

    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: `找不到文件: ${logPath}` });
    }

    console.log('开始分析日志...', logPath);
    const startTime = Date.now();
    
    const statistics = await logAnalyzer.analyzeOnly(logPath, filters);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`分析完成，耗时: ${duration}秒`);

    res.json({
      success: true,
      statistics,
      meta: {
        analyzedAt: new Date().toISOString(),
        duration: `${duration}秒`
      }
    });
  } catch (error) {
    console.error('分析日志失败:', error);
    res.status(500).json({ error: '分析日志失败: ' + error.message });
  }
});

// 分页获取日志详情
app.post('/api/logs/paginated', async (req, res) => {
  try {
    const { logPath, page = 1, pageSize = 100, filters = {}, sortBy = 'time-desc', includeMetadata = false } = req.body;
    
    if (!logPath) {
      return res.status(400).json({ error: '请提供日志文件路径' });
    }

    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: `找不到文件: ${logPath}` });
    }

    const result = await logAnalyzer.getLogsPaginated(logPath, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      filters,
      sortBy,
      includeMetadata
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取分页日志失败:', error);
    res.status(500).json({ error: '获取分页日志失败: ' + error.message });
  }
});

// 为生产环境提供 React 应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`API 地址: http://localhost:${PORT}/api`);
});
