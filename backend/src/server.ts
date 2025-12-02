import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { DebateCoordinator } from './ai/DebateCoordinator';
import { AIConfig } from './types';
import { APIHealthCheck, HealthCheckResult } from './utils/apiHealthCheck';
import { sessionManager } from './services/SessionManager';
import { createLogger } from './utils/logger';

dotenv.config();

const logger = createLogger('Server');

// 存储健康检查结果
let healthCheckResults: HealthCheckResult[] = [];

// WebSocket连接映射
const wsConnections = new Map<string, WebSocket>();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI辩论服务器运行中' });
});

// 获取AI配置和健康状态
app.get('/api/ai-configs', (req, res) => {
  const configs = getAIConfigs();
  res.json({
    configs: configs.map(c => {
      const healthResult = healthCheckResults.find(h => h.name === c.name);
      return {
        name: c.name,
        provider: c.provider,
        model: c.model,
        available: !!c.apiKey,
        status: healthResult?.status || 'unknown',
        message: healthResult?.message || '',
      };
    }),
    healthCheckResults,
  });
});

// API健康检查端点
app.post('/api/health-check', async (req, res) => {
  try {
    logger.info('Health check requested');
    const configs = getAIConfigs();
    const results = await APIHealthCheck.testAllConfigs(configs);
    healthCheckResults = results;

    logger.info('Health check completed', {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
    });

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        error: results.filter(r => r.status === 'error').length,
        skipped: results.filter(r => r.status === 'skipped').length,
      },
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '健康检查失败',
    });
  }
});

// ========== 会话管理API ==========

// 获取所有会话列表
app.get('/api/sessions', (req, res) => {
  try {
    const sessions = sessionManager.getAllSessions();
    logger.debug('Sessions list requested', { count: sessions.length });
    res.json({ success: true, sessions });
  } catch (error) {
    logger.error('Failed to get sessions', error);
    res.status(500).json({ success: false, error: 'Failed to get sessions' });
  }
});

// 创建新会话
app.post('/api/sessions', (req, res) => {
  try {
    const { title, enabledAIs } = req.body;
    const session = sessionManager.createSession(title, enabledAIs);
    logger.info('Session created', { id: session.id, title: session.title });
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Failed to create session', error);
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

// 获取单个会话详情
app.get('/api/sessions/:id', (req, res) => {
  try {
    const session = sessionManager.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    logger.debug('Session retrieved', { id: session.id });
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Failed to get session', error);
    res.status(500).json({ success: false, error: 'Failed to get session' });
  }
});

// 更新会话
app.patch('/api/sessions/:id', (req, res) => {
  try {
    const { title, enabledAIs } = req.body;
    const session = sessionManager.updateSession(req.params.id, { title, enabledAIs });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    logger.info('Session updated', { id: session.id });
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Failed to update session', error);
    res.status(500).json({ success: false, error: 'Failed to update session' });
  }
});

// 删除会话
app.delete('/api/sessions/:id', (req, res) => {
  try {
    const deleted = sessionManager.deleteSession(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    logger.info('Session deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete session', error);
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
});

// 获取会话统计信息
app.get('/api/sessions-stats', (req, res) => {
  try {
    const stats = sessionManager.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Failed to get session stats', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// WebSocket连接处理
wss.on('connection', (ws: WebSocket) => {
  console.log('新的WebSocket连接');

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'start_debate') {
        const { question } = data;

        if (!question) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '请提供问题',
          }));
          return;
        }

        // 获取健康的AI配置（只使用通过健康检查的AI）
        const allConfigs = getAIConfigs();
        const healthyConfigs = allConfigs.filter(config => {
          const healthResult = healthCheckResults.find(h => h.name === config.name);
          return healthResult?.status === 'success';
        });

        if (healthyConfigs.length === 0) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '没有可用的AI服务。请配置有效的API密钥后重启服务器。',
          }));
          return;
        }

        // 创建辩论协调器（只使用健康的AI）
        const coordinator = new DebateCoordinator(healthyConfigs, 3, 75);

        // 开始辩论，并通过WebSocket实时发送更新
        const result = await coordinator.startDebate(question, (update) => {
          ws.send(JSON.stringify({
            type: 'debate_update',
            data: update,
            timestamp: Date.now(),
          }));
        });

        // 发送最终结果
        ws.send(JSON.stringify({
          type: 'debate_complete',
          data: result,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : '处理请求时出错',
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket连接关闭');
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });

  // 发送连接成功消息
  ws.send(JSON.stringify({
    type: 'connected',
    message: '已连接到AI辩论服务器',
    timestamp: Date.now(),
  }));
});

// 从环境变量获取AI配置
function getAIConfigs(): AIConfig[] {
  const configs: AIConfig[] = [];

  // OpenAI GPT-4
  if (process.env.OPENAI_API_KEY) {
    configs.push({
      name: 'GPT-4',
      provider: 'openai',
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    configs.push({
      name: 'Claude',
      provider: 'anthropic',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Google Gemini
  if (process.env.GOOGLE_API_KEY) {
    configs.push({
      name: 'Gemini',
      provider: 'google',
      model: process.env.GOOGLE_MODEL || 'gemini-pro',
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  // DeepSeek
  if (process.env.DEEPSEEK_API_KEY) {
    configs.push({
      name: 'DeepSeek',
      provider: 'deepseek',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    });
  }

  // 如果没有配置任何API密钥，使用模拟AI（仅用于开发测试）
  if (configs.length === 0) {
    console.warn('警告：没有配置任何AI API密钥，将使用模拟AI');
    configs.push(
      {
        name: '模拟AI-1',
        provider: 'custom',
        model: 'mock',
      },
      {
        name: '模拟AI-2',
        provider: 'custom',
        model: 'mock',
      },
      {
        name: '模拟AI-3',
        provider: 'custom',
        model: 'mock',
      }
    );
  }

  return configs;
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, async () => {
  console.log(`🚀 AI辩论服务器运行在端口 ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);

  // 获取AI配置
  const configs = getAIConfigs();
  console.log(`\n已配置的AI数量: ${configs.length}`);
  configs.forEach(config => {
    console.log(`  - ${config.name} (${config.provider}/${config.model})`);
  });

  // 执行启动时健康检查
  console.log('\n🔍 开始API健康检查...\n');
  healthCheckResults = await APIHealthCheck.testAllConfigs(configs);
  APIHealthCheck.printHealthReport(healthCheckResults);

  // 提示用户如何配置
  const successCount = healthCheckResults.filter(r => r.status === 'success').length;
  if (successCount === 0) {
    console.log('💡 提示: 编辑 backend/.env 文件来配置你的API密钥');
    console.log('   示例: OPENAI_API_KEY=sk-your-actual-key-here\n');
  }
});
