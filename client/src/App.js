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

  // 通过路径解析日志文件
  const handlePathSubmit = async (logPath) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/parse-log-path', { logPath });
      setLogs(response.data.logs);
      setStatistics(response.data.statistics);
    } catch (err) {
      setError(err.response?.data?.error || '加载日志失败');
      console.error('加载日志失败:', err);
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
                📋 日志详情
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'dashboard' && (
                <Dashboard statistics={statistics} logs={logs} />
              )}
              {activeTab === 'logs' && (
                <LogTable logs={logs} />
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
