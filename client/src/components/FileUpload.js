import React, { useRef, useState, useEffect } from 'react';
import { Upload, FileText, FolderOpen, Clock, History, Trash2, Lightbulb } from 'lucide-react';
import './FileUpload.css';

const HISTORY_KEY = 'log_path_history';
const MAX_HISTORY = 10;

function FileUpload({ onFileUpload, onLoadDefault, onPathSubmit, loading }) {
  const fileInputRef = useRef(null);
  const [logPath, setLogPath] = useState('');
  const [showPathInput, setShowPathInput] = useState(false);
  const [pathHistory, setPathHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // 加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = localStorage.getItem(HISTORY_KEY);
        if (history) {
          setPathHistory(JSON.parse(history));
        }
      } catch (err) {
        console.error('加载历史记录失败:', err);
      }
    };
    loadHistory();
  }, []);

  // 保存到历史记录
  const saveToHistory = (path) => {
    try {
      const newHistory = [path, ...pathHistory.filter(p => p !== path)].slice(0, MAX_HISTORY);
      setPathHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (err) {
      console.error('保存历史记录失败:', err);
    }
  };

  // 删除历史记录项
  const removeHistoryItem = (pathToRemove) => {
    try {
      const newHistory = pathHistory.filter(p => p !== pathToRemove);
      setPathHistory(newHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (err) {
      console.error('删除历史记录失败:', err);
    }
  };

  // 清空历史记录
  const clearHistory = () => {
    try {
      setPathHistory([]);
      localStorage.removeItem(HISTORY_KEY);
      setShowHistory(false);
    } catch (err) {
      console.error('清空历史记录失败:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handlePathSubmit = (e) => {
    e.preventDefault();
    if (logPath.trim()) {
      const trimmedPath = logPath.trim();
      saveToHistory(trimmedPath);
      onPathSubmit(trimmedPath);
      setLogPath('');
    }
  };

  // 从历史记录中选择
  const handleHistorySelect = (path) => {
    saveToHistory(path);
    onPathSubmit(path);
    setShowHistory(false);
  };

  return (
    <div className="file-upload">
      <div className="upload-buttons">
        <button 
          className="upload-btn primary"
          onClick={handleButtonClick}
          disabled={loading}
        >
          <Upload size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> 上传日志文件
        </button>
        <button 
          className="upload-btn secondary"
          onClick={onLoadDefault}
          disabled={loading}
        >
          <FileText size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> 加载默认日志
        </button>
        <button 
          className="upload-btn tertiary"
          onClick={() => setShowPathInput(!showPathInput)}
          disabled={loading}
        >
          <FolderOpen size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> {showPathInput ? '隐藏' : '指定'}路径
        </button>
        {pathHistory.length > 0 && (
          <button 
            className="upload-btn history"
            onClick={() => setShowHistory(!showHistory)}
            disabled={loading}
          >
            <Clock size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> 历史记录 ({pathHistory.length})
          </button>
        )}
      </div>
      
      {showHistory && pathHistory.length > 0 && (
        <div className="history-panel">
          <div className="history-header">
            <h4><History size={18} style={{marginRight: '6px', verticalAlign: 'middle'}}/> 历史日志路径</h4>
            <button 
              className="clear-history-btn"
              onClick={clearHistory}
              title="清空所有历史记录"
            >
              <Trash2 size={16} style={{marginRight: '4px', verticalAlign: 'middle'}}/> 清空
            </button>
          </div>
          <ul className="history-list">
            {pathHistory.map((path, index) => (
              <li key={index} className="history-item">
                <button
                  className="history-path-btn"
                  onClick={() => handleHistorySelect(path)}
                  title={`加载: ${path}`}
                  disabled={loading}
                >
                  <span className="history-index">{index + 1}</span>
                  <span className="history-path">{path}</span>
                </button>
                <button
                  className="remove-history-btn"
                  onClick={() => removeHistoryItem(path)}
                  title="删除此记录"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <p className="history-hint">
            <Lightbulb size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px', marginTop: '-2px'}}/> 点击路径快速加载，最多保存 {MAX_HISTORY} 条记录
          </p>
        </div>
      )}
      
      {showPathInput && (
        <form className="path-input-form" onSubmit={handlePathSubmit}>
          <input
            type="text"
            className="path-input"
            placeholder="输入日志文件完整路径，例如：/path/to/your/log.txt"
            value={logPath}
            onChange={(e) => setLogPath(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="path-submit-btn"
            disabled={loading || !logPath.trim()}
          >
            加载
          </button>
        </form>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".txt,.log"
        style={{ display: 'none' }}
      />
      <p className="upload-hint">
        支持 .txt 和 .log 格式的日志文件，或直接指定文件路径
      </p>
    </div>
  );
}

export default FileUpload;
