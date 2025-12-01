import { useState, useEffect, useRef } from 'react';
import './App.css';

interface AIResponse {
  aiName: string;
  thinking: string;
  answer: string;
  confidence: number;
}

interface DebateRound {
  roundNumber: number;
  responses: AIResponse[];
  discussion: string;
  needsAnotherRound: boolean;
}

interface Message {
  type: string;
  data?: any;
  message?: string;
  timestamp: number;
}

interface AIStatus {
  name: string;
  provider: string;
  model: string;
  status: 'success' | 'error' | 'skipped' | 'unknown';
  message: string;
}

function App() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isDebating, setIsDebating] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [aiStatuses, setAiStatuses] = useState<AIStatus[]>([]);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connectWebSocket();
    fetchAIStatus();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/ai-configs');
      const data = await response.json();
      if (data.configs) {
        setAiStatuses(data.configs);
      }
    } catch (error) {
      console.error('获取AI状态失败:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket连接成功');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };

    ws.onclose = () => {
      console.log('WebSocket连接断开');
      setIsConnected(false);
      // 5秒后重连
      setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    wsRef.current = ws;
  };

  const handleWebSocketMessage = (message: any) => {
    setMessages(prev => [...prev, message]);

    if (message.type === 'debate_update') {
      const { data } = message;
      if (data.type === 'status') {
        setCurrentRound(data.roundNumber || 0);
      } else if (data.type === 'round_complete') {
        setCurrentRound(data.roundNumber);
      }
    } else if (message.type === 'debate_complete') {
      setIsDebating(false);
      setCurrentRound(0);
    } else if (message.type === 'error') {
      setIsDebating(false);
      setCurrentRound(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !isConnected || isDebating) {
      return;
    }

    setIsDebating(true);
    setMessages([]);
    setCurrentRound(0);

    // 添加用户问题到消息列表
    setMessages([{
      type: 'user_question',
      data: { question },
      timestamp: Date.now(),
    }]);

    // 发送问题到后端
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'start_debate',
        question,
      }));
    }
  };

  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'user_question':
        return (
          <div key={index} className="message user-question">
            <h2>你的问题：</h2>
            <p>{message.data.question}</p>
          </div>
        );

      case 'connected':
        return (
          <div key={index} className="message system-message">
            ✅ {message.message}
          </div>
        );

      case 'debate_update':
        return renderDebateUpdate(message.data, index);

      case 'debate_complete':
        return renderDebateComplete(message.data, index);

      case 'error':
        return (
          <div key={index} className="message error-message">
            ❌ 错误：{message.message}
          </div>
        );

      default:
        return null;
    }
  };

  const renderDebateUpdate = (data: any, index: number) => {
    switch (data.type) {
      case 'status':
        return (
          <div key={index} className="message status-message">
            <div className="status-content">
              <div className="spinner"></div>
              <span>{data.message}</span>
            </div>
          </div>
        );

      case 'ai_response':
        const response = data.response as AIResponse;
        return (
          <div key={index} className="message ai-response">
            <div className="ai-header">
              <h3>{response.aiName}</h3>
              <span className="confidence">信心度：{response.confidence}%</span>
            </div>
            <div className="thinking-section">
              <h4>💭 思考过程：</h4>
              <p>{response.thinking}</p>
            </div>
            <div className="answer-section">
              <h4>💡 回答：</h4>
              <p>{response.answer}</p>
            </div>
          </div>
        );

      case 'round_complete':
        return (
          <div key={index} className="message round-complete">
            <h3>🔄 第 {data.roundNumber} 轮思考完成</h3>
            <p>已收到 {data.responses.length} 个AI的回答</p>
          </div>
        );

      case 'discussion':
        return (
          <div key={index} className="message discussion">
            <h3>🗣️ 讨论总结（第 {data.roundNumber} 轮）：</h3>
            <p>{data.discussion}</p>
          </div>
        );

      case 'consensus':
        return (
          <div key={index} className="message consensus">
            <h3>🎯 最终共识：</h3>
            <p>{data.finalConsensus}</p>
            <div className="best-solution">
              <h4>✨ 最佳解决方案：</h4>
              <p>{data.bestSolution}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderDebateComplete = (data: any, index: number) => {
    return (
      <div key={index} className="message debate-complete">
        <h2>✅ 辩论完成！</h2>
        <p>经过 {data.rounds.length} 轮深度讨论，AI们已经达成共识。</p>
      </div>
    );
  };

  const getAvailableAICount = () => {
    return aiStatuses.filter(s => s.status === 'success').length;
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 AI辩论聊天系统</h1>
        <div className="connection-status">
          <button
            className="status-button"
            onClick={() => setShowStatusPanel(!showStatusPanel)}
            title="查看AI状态"
          >
            🔍 AI状态 ({getAvailableAICount()}/{aiStatuses.length})
          </button>
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
          {currentRound > 0 && (
            <span className="round-indicator">第 {currentRound} 轮辩论中...</span>
          )}
        </div>
      </header>

      {showStatusPanel && (
        <div className="status-panel">
          <div className="status-panel-header">
            <h3>🏥 AI服务状态</h3>
            <button onClick={() => setShowStatusPanel(false)}>✕</button>
          </div>
          <div className="status-list">
            {aiStatuses.map((ai, index) => (
              <div key={index} className={`status-item status-${ai.status}`}>
                <div className="status-item-header">
                  <span className="status-icon">
                    {ai.status === 'success' && '✅'}
                    {ai.status === 'error' && '❌'}
                    {ai.status === 'skipped' && '⏭️'}
                    {ai.status === 'unknown' && '❓'}
                  </span>
                  <strong>{ai.name}</strong>
                  <span className="status-badge">{ai.provider}</span>
                </div>
                <div className="status-item-details">
                  <div>模型: {ai.model}</div>
                  <div className="status-message">{ai.message || '等待检查...'}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="status-panel-footer">
            <button onClick={fetchAIStatus} className="refresh-button">
              🔄 刷新状态
            </button>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 && !isDebating && (
            <div className="welcome-message">
              <h2>欢迎使用AI辩论聊天系统！</h2>
              <p>在下方输入你的问题，多个AI将为你深度思考并讨论最佳答案。</p>
              <ul>
                <li>💭 查看每个AI的思考过程</li>
                <li>🗣️ 观察AI之间的讨论</li>
                <li>🎯 获得经过多轮辩论的最佳答案</li>
              </ul>
            </div>
          )}
          {messages.map((message, index) => renderMessage(message, index))}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-area" onSubmit={handleSubmit}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入你的问题..."
            disabled={!isConnected || isDebating}
            className="question-input"
          />
          <button
            type="submit"
            disabled={!isConnected || isDebating || !question.trim()}
            className="submit-button"
          >
            {isDebating ? '思考中...' : '发送'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
