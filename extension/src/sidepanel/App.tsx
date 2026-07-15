/// <reference types="chrome" />

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  provider?: string;
  model?: string;
  isError?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

interface Provider {
  id: string;
  name: string;
  models: string[];
}

interface MCPServer {
  id: string;
  name: string;
  transport: 'sse' | 'stdio';
  config: Record<string, any>;
  status?: 'connected' | 'disconnected' | 'connecting' | 'error';
  toolsCount?: number;
  lastError?: string;
}

interface State {
  activeProvider: string;
  activeModel: string;
  apiKeys: Record<string, string>;
  mcpServers: MCPServer[];
  isConnected: boolean;
  conversations: Conversation[];
  currentConversation: string | null;
  messages: Message[];
  isLoading: boolean;
  sidebarOpen: boolean;
}

const providers: Provider[] = [
  { id: 'chatgpt', name: 'ChatGPT', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  { id: 'claude', name: 'Claude', models: ['sonnet-3.5', 'haiku-3.5', 'opus-3'] },
  { id: 'gemini', name: 'Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
  { id: 'ollama', name: 'Ollama (本地)', models: ['llama3.1', 'llama3.2', 'qwen2.5', 'mistral', 'codellama'] },
];

function App() {
  const [state, setState] = useState<State>({
    activeProvider: 'chatgpt',
    activeModel: 'gpt-4o',
    apiKeys: {},
    mcpServers: [],
    isConnected: false,
    conversations: [],
    currentConversation: null,
    messages: [],
    isLoading: false,
    sidebarOpen: true,
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showSettings, setShowSettings] = useState(false);
  const [showMCP, setShowMCP] = useState(false);
  
  // MCP Modal state
  const [mcpModal, setMcpModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    server?: MCPServer;
  }>({ isOpen: false, mode: 'add' });
  const [mcpForm, setMcpForm] = useState({
    name: '',
    transport: 'sse' as 'sse' | 'stdio',
    url: '',
    command: '',
    args: '',
    env: '',
  });
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const loadState = useCallback(async () => {
    try {
      const result = await chrome.storage.local.get('aihub-state');
      if (result['aihub-state']) {
        setState(prev => ({ ...prev, ...result['aihub-state'] }));
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }, []);

  const saveState = useCallback(async () => {
    try {
      await chrome.storage.local.set({ 'aihub-state': state });
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  useEffect(() => {
    loadState();
    scrollToBottom();
  }, [loadState, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [state.messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isLoading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    const newMessages = [...state.messages, userMessage];
    setState(prev => ({ ...prev, messages: newMessages, isLoading: true }));
    setInput('');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEND_MESSAGE',
        provider: state.activeProvider,
        model: state.activeModel,
        messages: newMessages,
        apiKey: state.apiKeys[state.activeProvider],
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.content, 
        timestamp: Date.now(),
        provider: state.activeProvider,
        model: state.activeModel,
      };
      
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, assistantMessage], 
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage: Message = { 
        role: 'assistant', 
        content: `錯誤: ${error instanceof Error ? error.message : String(error)}`, 
        timestamp: Date.now(),
        isError: true,
      };
      setState(prev => ({ 
        ...prev, 
        messages: [...prev.messages, errorMessage], 
        isLoading: false 
      }));
    }
  };

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    setState(prev => ({
      ...prev,
      activeProvider: providerId,
      activeModel: provider?.models[0] || '',
    }));
    saveState();
  };

  const handleModelChange = (model: string) => {
    setState(prev => ({ ...prev, activeModel: model }));
    saveState();
  };

  const handleApiKeyChange = (provider: string, key: string) => {
    setState(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key },
    }));
    saveState();
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  };

  const clearConversation = () => {
    setState(prev => ({ ...prev, messages: [] }));
  };

  // MCP Modal handlers
  const openAddMCPModal = () => {
    setMcpForm({ name: '', transport: 'sse', url: '', command: '', args: '', env: '' });
    setMcpModal({ isOpen: true, mode: 'add' });
  };

  const openEditMCPModal = (server: MCPServer) => {
    setMcpForm({
      name: server.name,
      transport: server.transport,
      url: server.config.url || '',
      command: server.config.command || '',
      args: server.config.args?.join(' ') || '',
      env: JSON.stringify(server.config.env || {}, null, 2),
    });
    setMcpModal({ isOpen: true, mode: 'edit', server });
  };

  const closeMCPModal = () => {
    setMcpModal({ isOpen: false, mode: 'add' });
    setMcpForm({ name: '', transport: 'sse', url: '', command: '', args: '', env: '' });
  };

  const handleMcpFormChange = (field: string, value: string) => {
    setMcpForm(prev => ({ ...prev, [field]: value }));
  };

  const validateMcpForm = () => {
    if (!mcpForm.name.trim()) return '請輸入服務名稱';
    if (mcpForm.transport === 'sse' && !mcpForm.url.trim()) return '請輸入 SSE URL';
    if (mcpForm.transport === 'stdio' && !mcpForm.command.trim()) return '請輸入命令';
    if (mcpForm.transport === 'stdio') {
      try {
        JSON.parse(mcpForm.env || '{}');
      } catch {
        return '環境變數必須是合法的 JSON';
      }
    }
    return null;
  };

  const saveMCPServer = async () => {
    const error = validateMcpForm();
    if (error) {
      alert(error);
      return;
    }

    const config: Record<string, any> = mcpForm.transport === 'sse'
      ? { url: mcpForm.url }
      : { 
          command: mcpForm.command,
          args: mcpForm.args.split(' ').filter(Boolean),
          env: mcpForm.env ? JSON.parse(mcpForm.env) : {},
        };

    if (mcpModal.mode === 'add') {
      chrome.runtime.sendMessage({
        type: 'MCP_ADD_SERVER',
        server: { id: Date.now().toString(), name: mcpForm.name, transport: mcpForm.transport, config }
      });
    } else if (mcpModal.server) {
      chrome.runtime.sendMessage({
        type: 'MCP_UPDATE_SERVER',
        id: mcpModal.server.id,
        server: { ...mcpModal.server, name: mcpForm.name, transport: mcpForm.transport, config }
      });
    }
    closeMCPModal();
  };

  const removeMCPServer = (id: string) => {
    if (confirm('確定要刪除這個 MCP 服務嗎？')) {
      chrome.runtime.sendMessage({ type: 'MCP_REMOVE_SERVER', id });
    }
  };

  const testMCPConnection = async (server: MCPServer) => {
    setTestingConnection(server.id);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'MCP_TEST_CONNECTION',
        server
      });
      if (response.error) {
        alert(`連線失敗: ${response.error}`);
      } else {
        alert(`連線成功！發現 ${response.toolsCount || 0} 個工具`);
      }
    } catch (error) {
      alert(`連線失敗: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected': return '已連線';
      case 'connecting': return '連線中...';
      case 'error': return '連線失敗';
      default: return '未連線';
    }
  };

  return (
    <div className="aihub-app">
      <header className="header">
        <div className="header-left">
          <button onClick={toggleSidebar} className="icon-btn" title={state.sidebarOpen ? '收起側邊欄' : '展開側邊欄'}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="title">AIHub</h1>
        </div>
        <div className="header-center">
          <select 
            value={state.activeProvider} 
            onChange={e => handleProviderChange(e.target.value)}
            className="provider-select"
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select 
            value={state.activeModel} 
            onChange={e => handleModelChange(e.target.value)}
            className="model-select"
          >
            {providers.find(p => p.id === state.activeProvider)?.models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="header-right">
          <button onClick={() => setShowMCP(!showMCP)} className={`icon-btn ${showMCP ? 'active' : ''}`} title="MCP 服務">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2"></rect>
              <path d="M7 12h10"></path>
              <path d="M12 7v10"></path>
            </svg>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={`icon-btn ${showSettings ? 'active' : ''}`} title="設定">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </header>

      <div className="main-container">
        <aside className={`sidebar ${state.sidebarOpen ? 'open' : 'collapsed'}`} style={{ width: sidebarWidth }}>
          <div className="sidebar-header">
            <h3>對話列表</h3>
            <button onClick={clearConversation} className="icon-btn" title="新增對話">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          <div className="conversation-list">
            {state.conversations.map((conv, i) => (
              <div 
                key={conv.id} 
                className={`conversation-item ${state.currentConversation === conv.id ? 'active' : ''}`}
                onClick={() => setState(prev => ({ ...prev, currentConversation: conv.id, messages: conv.messages }))}
              >
                <span className="conv-title">{conv.title || `對話 ${i + 1}`}</span>
                <span className="conv-time">{new Date(conv.updatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {state.conversations.length === 0 && (
              <div className="empty-state">暫無對話，點擊上方 + 開始新對話</div>
            )}
          </div>
          <div className="sidebar-resizer" onMouseDown={e => startResize(e)}></div>
        </aside>

        <main className="chat-area">
          <div className="messages" ref={messagesEndRef}>
            {state.messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                <div className="message-header">
                  <span className="role">{msg.role === 'user' ? '你' : msg.provider ? `${msg.provider} (${msg.model})` : '助手'}</span>
                  <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="message-content" dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              </div>
            ))}
            {state.isLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <span className="typing-indicator">
                    <span></span><span></span><span></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="input-form">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="輸入訊息... (Shift+Enter 換行, Enter 發送)"
                rows={1}
                className="message-input"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
            </div>
            <button 
              type="submit" 
              disabled={!input.trim() || state.isLoading}
              className="send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </main>

        {showSettings && (
          <aside className="settings-panel">
            <div className="panel-header">
              <h3>設定</h3>
              <button onClick={() => setShowSettings(false)} className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="panel-content">
              <h4>API Keys</h4>
              {providers.filter(p => p.id !== 'ollama').map(p => (
                <div key={p.id} className="setting-item">
                  <label>{p.name} API Key</label>
                  <input
                    type="password"
                    value={state.apiKeys[p.id] || ''}
                    onChange={e => handleApiKeyChange(p.id, e.target.value)}
                    placeholder={`輸入 ${p.name} API Key`}
                  />
                </div>
              ))}
              <div className="setting-item">
                <label>Ollama 端點</label>
                <input
                  type="text"
                  value={localStorage.getItem('ollama-base-url') || 'http://localhost:11434'}
                  onChange={e => localStorage.setItem('ollama-base-url', e.target.value)}
                  placeholder="http://localhost:11434"
                />
              </div>
            </div>
          </aside>
        )}

        {showMCP && (
          <aside className="mcp-panel">
            <div className="panel-header">
              <h3>MCP 服務</h3>
              <button onClick={() => setShowMCP(false)} className="icon-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="panel-content">
              <button onClick={openAddMCPModal} className="add-btn">+ 新增 MCP 服務</button>
              
              {state.mcpServers.length === 0 ? (
                <div className="empty-state" style={{marginTop: '12px', fontSize: '12px', color: '#888'}}>
                  尚無 MCP 服務，點擊上方按鈕新增
                </div>
              ) : (
                <ul className="mcp-list">
                  {state.mcpServers.map(s => (
                    <li key={s.id} className="mcp-item">
                      <div className="mcp-server-info">
                        <div className="mcp-server-header">
                          <span className="mcp-status-dot" style={{ 
                            backgroundColor: s.status === 'connected' ? '#22c55e' : 
                                           s.status === 'connecting' ? '#eab308' : 
                                           s.status === 'error' ? '#ef4444' : '#6b7280' 
                          }}></span>
                          <span className="mcp-server-name">{s.name}</span>
                          <span className={`mcp-transport-badge ${s.transport}`}>{s.transport.toUpperCase()}</span>
                        </div>
                        <div className="mcp-server-details">
                          <span className="mcp-server-status">{getStatusText(s.status)}</span>
                          {s.toolsCount !== undefined && <span className="mcp-tools-count">🔧 {s.toolsCount} 工具</span>}
                          {s.lastError && <span className="mcp-error" title={s.lastError}>⚠️ {s.lastError.substring(0, 50)}...</span>}
                          {s.transport === 'sse' && <span className="mcp-config-url">{s.config.url}</span>}
                          {s.transport === 'stdio' && <span className="mcp-config-cmd">{s.config.command} {s.config.args?.join(' ') || ''}</span>}
                        </div>
                      </div>
                      <div className="mcp-server-actions">
                        <button 
                          onClick={() => testMCPConnection(s)} 
                          disabled={testingConnection === s.id}
                          className={`icon-btn ${testingConnection === s.id ? 'loading' : ''}`}
                          title={testingConnection === s.id ? '測試中...' : '測試連線'}
                        >
                          {testingConnection === s.id ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                              <path d="M12 2a10 10 0 0 1 10 10"></path>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                            </svg>
                          )}
                        </button>
                        <button 
                          onClick={() => openEditMCPModal(s)} 
                          className="icon-btn"
                          title="編輯"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button 
                          onClick={() => removeMCPServer(s.id)} 
                          className="icon-btn small danger"
                          title="刪除"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        )}

        {/* MCP Modal */}
        {mcpModal.isOpen && (
          <div className="modal-overlay" onClick={closeMCPModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{mcpModal.mode === 'add' ? '新增 MCP 服務' : '編輯 MCP 服務'}</h3>
                <button onClick={closeMCPModal} className="icon-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="modal-content">
                <div className="setting-item">
                  <label>服務名稱 <span className="required">*</span></label>
                  <input
                    type="text"
                    value={mcpForm.name}
                    onChange={e => handleMcpFormChange('name', e.target.value)}
                    placeholder="例如: My MCP Server"
                  />
                </div>
                
                <div className="setting-item">
                  <label>傳輸協定 <span className="required">*</span></label>
                  <select
                    value={mcpForm.transport}
                    onChange={e => handleMcpFormChange('transport', e.target.value as 'sse' | 'stdio')}
                    className="transport-select"
                  >
                    <option value="sse">SSE (Server-Sent Events)</option>
                    <option value="stdio">STDIO (本地進程)</option>
                  </select>
                </div>

                {mcpForm.transport === 'sse' && (
                  <div className="setting-item">
                    <label>SSE Endpoint URL <span className="required">*</span></label>
                    <input
                      type="url"
                      value={mcpForm.url}
                      onChange={e => handleMcpFormChange('url', e.target.value)}
                      placeholder="https://example.com/mcp/sse"
                    />
                    <small className="help-text">MCP 伺服器的 SSE 端點，通常類似 https://server.com/mcp/sse</small>
                  </div>
                )}

                {mcpForm.transport === 'stdio' && (
                  <>
                    <div className="setting-item">
                      <label>命令 <span className="required">*</span></label>
                      <input
                        type="text"
                        value={mcpForm.command}
                        onChange={e => handleMcpFormChange('command', e.target.value)}
                        placeholder="npx, node, python, 或完整路徑"
                      />
                      <small className="help-text">啟動 MCP 伺服器的命令 (需在 PATH 中或使用完整路徑)</small>
                    </div>
                    <div className="setting-item">
                      <label>參數</label>
                      <input
                        type="text"
                        value={mcpForm.args}
                        onChange={e => handleMcpFormChange('args', e.target.value)}
                        placeholder="-y @modelcontextprotocol/server-filesystem /path/to/dir"
                      />
                      <small className="help-text">命令參數，以空格分隔</small>
                    </div>
                    <div className="setting-item">
                      <label>環境變數 (JSON)</label>
                      <textarea
                        value={mcpForm.env}
                        onChange={e => handleMcpFormChange('env', e.target.value)}
                        placeholder='{"API_KEY": "xxx", "DEBUG": "true"}'
                        rows={3}
                        style={{fontFamily: 'monospace', fontSize: '11px'}}
                      />
                      <small className="help-text">傳遞給子進程的環境變數，JSON 格式</small>
                    </div>
                  </>
                )}

                <div className="modal-footer">
                  <button onClick={closeMCPModal} className="btn btn-secondary">取消</button>
                  <button onClick={saveMCPServer} className="btn btn-primary">
                    {mcpModal.mode === 'add' ? '新增' : '儲存變更'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessage(content: string): string {
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

function startResize(e: React.MouseEvent) {
  const startX = e.clientX;
  const startWidth = 280;
  
  const onMouseMove = (e: MouseEvent) => {
    const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  };
  
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

export default App;