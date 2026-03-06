import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import LogTable from './components/LogTable';
import FileUpload from './components/FileUpload';

function App() {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loadMode, setLoadMode] = useState('full'); // 'full' 或 'optimized'
  const [currentLogPath, setCurrentLogPath] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);

  // 加载默认的 log.txt
  const loadDefaultLog = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/parse-default-log');
      setLogs(response.data.logs);
      setStatistics(response.data.statistics);
    } catch (err) {
      setError(err.response?.data?.error || '加载日志失败');
      console.error('加载日志失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 上传并解析日志文件
  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('logFile', file);

      const response = await axios.post('/api/parse-log', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLogs(response.data.logs);
      setStatistics(response.data.statistics);
    } catch (err) {
      setError(err.response?.data?.error || '上传文件失败');
      console.error('上传文件失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 通过路径解析日志文件（智能模式）
  const handlePathSubmit = async (logPath) => {
    setLoading(true);
    setError(null);
    setCurrentLogPath(logPath);
    
    try {
      // 1. 先获取文件信息
      const fileInfoResponse = await axios.post('/api/logs/file-info', { logPath });
      const info = fileInfoResponse.data.fileInfo;
      setFileInfo(info);

      if (info.isLargeFile) {
        // 2. 大文件：使用优化模式
        console.log(`检测到大文件 (${info.sizeInMB}MB)，使用优化模式`);
        setLoadMode('optimized');
        
        const statsResponse = await axios.post('/api/logs/analyze', {
          logPath,
          filters: {} // 初始无筛选
        });
        
        setStatistics(statsResponse.data.statistics);
        setLogs([]); // 不加载原始日志
      } else {
        // 3. 小文件：使用传统模式
        console.log(`小文件 (${info.sizeInMB}MB)，使用传统模式`);
        setLoadMode('full');
        
        const response = await axios.post('/api/parse-log-path', { logPath });
        setLogs(response.data.logs);
        setStatistics(response.data.statistics);
      }
    } catch (err) {
      setError(err.response?.data?.error || '加载日志失败');
      console.error('加载日志失败:', err);
      setLoadMode('full');
      setFileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📊 日志解析器</h1>
        <p>分析和可视化您的服务器日志</p>
      </header>

      <div className="container">
        <FileUpload 
          onFileUpload={handleFileUpload}
          onLoadDefault={loadDefaultLog}
          onPathSubmit={handlePathSubmit}
          loading={loading}
        />

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>正在解析日志...</p>
          </div>
        )}

        {statistics && !loading && (
          <>
            {/* 大文件模式提示 */}
            {loadMode === 'optimized' && fileInfo && (
              <div className="large-file-notice">
                <div className="notice-header">
                  <span className="notice-icon">📊</span>
                  <strong>大文件优化模式</strong>
                </div>
                <div className="notice-content">
                  <p>文件大小: <strong>{fileInfo.sizeInMB}MB</strong> ({fileInfo.estimatedLines?.toLocaleString()} 行预计)</p>
                  <p>已启用优化加载，只显示统计数据。筛选条件改变时将重新分析日志。</p>
                </div>
              </div>
            )}

            <div className="tabs">
              <button
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📈 数据统计
              </button>
              <button
                className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                📋 日志详情 {loadMode === 'optimized' && '(分页模式)'}
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'dashboard' && (
                <Dashboard 
                  statistics={statistics} 
                  logs={logs}
                  loadMode={loadMode}
                  onFilterChange={null}
                />
              )}
              {activeTab === 'logs' && (
                <LogTable 
                  logs={logs} 
                  loadMode={loadMode}
                  logPath={currentLogPath}
                />
              )}
            </div>
          </>
        )}

        {!statistics && !loading && !error && (
          <div className="welcome">
            <h2>👋 欢迎使用日志解析器</h2>
            <p>请上传日志文件或加载默认日志开始分析</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
