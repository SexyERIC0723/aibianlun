import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { DebateCoordinator } from './ai/DebateCoordinator';
import { AIConfig } from './types';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI辩论服务器运行中' });
});

// 获取AI配置
app.get('/api/ai-configs', (req, res) => {
  const configs = getAIConfigs();
  res.json({
    configs: configs.map(c => ({
      name: c.name,
      provider: c.provider,
      model: c.model,
      available: !!c.apiKey,
    })),
  });
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

        // 获取AI配置
        const configs = getAIConfigs();

        if (configs.length === 0) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '没有可用的AI配置，请检查环境变量',
          }));
          return;
        }

        // 创建辩论协调器
        const coordinator = new DebateCoordinator(configs, 3, 75);

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

server.listen(PORT, () => {
  console.log(`🚀 AI辩论服务器运行在端口 ${PORT}`);
  console.log(`HTTP: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);

  const configs = getAIConfigs();
  console.log(`\n已配置的AI数量: ${configs.length}`);
  configs.forEach(config => {
    console.log(`  - ${config.name} (${config.provider}/${config.model})`);
  });
});
