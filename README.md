# 🤖 AI辩论聊天系统

一个创新的多AI辩论式聊天系统，当你提出问题时，多个AI会同时思考并给出答案，然后它们会互相参考对方的思考过程和回答，进行多轮辩论，最终给出经过深度思考和讨论后的最佳答案。

## ✨ 核心特性

- 🧠 **多AI并发思考**：同时调用多个AI（GPT-4、Claude、Gemini、DeepSeek等）对同一问题进行思考
- 💭 **透明的思考过程**：实时展示每个AI的思考过程和推理逻辑
- 🗣️ **AI间辩论**：AI们会参考彼此的观点，进行多轮讨论和优化
- 🔄 **智能迭代**：如果AI们认为可以有更好的答案，会自动进行新一轮思考
- 🎯 **共识机制**：最终给出所有AI共同认可的最佳解决方案
- ⚡ **实时更新**：使用WebSocket实时显示每一步的思考和讨论过程

## 🏗️ 项目结构

```
aibianlun/
├── backend/               # 后端服务
│   ├── src/
│   │   ├── ai/
│   │   │   ├── AIClient.ts           # AI客户端（支持多个AI提供商）
│   │   │   └── DebateCoordinator.ts  # 辩论协调器
│   │   ├── types.ts                   # TypeScript类型定义
│   │   └── server.ts                  # Express + WebSocket服务器
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── App.tsx                    # 主应用组件
│   │   ├── App.css                    # 样式文件
│   │   ├── main.tsx                   # 入口文件
│   │   └── index.css                  # 全局样式
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json           # 根目录配置
└── README.md             # 项目文档
```

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- 至少一个AI服务的API密钥（OpenAI、Anthropic或Google）

### 1. 安装依赖

```bash
# 安装所有依赖（根目录、前端、后端）
npm run install:all
```

### 2. 配置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```bash
cd backend
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：

```env
# 服务器配置
PORT=3001

# OpenAI配置（GPT-4）
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic配置（Claude）
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-opus-20240229

# Google配置（Gemini）
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_MODEL=gemini-pro

# DeepSeek配置
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

**注意**：至少需要配置一个AI服务的API密钥。如果不配置任何密钥，系统将使用模拟AI（仅用于测试）。

### 3. 启动开发服务器

```bash
# 在项目根目录同时启动前端和后端
npm run dev

# 或者分别启动
npm run dev:backend   # 启动后端（端口3001）
npm run dev:frontend  # 启动前端（端口3000）
```

### 4. 访问应用

打开浏览器访问：`http://localhost:3000`

## 📖 使用指南

### 基本使用

1. **提出问题**：在输入框中输入你的问题
2. **观看思考**：系统会实时显示每个AI的思考过程和答案
3. **查看讨论**：AI们会互相参考，生成讨论总结
4. **获得共识**：经过多轮辩论后，系统会给出最终的共识答案

### 辩论流程

```
用户提问
    ↓
第一轮：多个AI并发思考
    ↓
显示每个AI的思考和答案
    ↓
生成讨论总结
    ↓
判断是否需要继续辩论？
    ├─ 是 → 第二轮：AI们参考彼此的观点重新思考
    │           ↓
    │      （重复上述过程）
    │           ↓
    └─ 否 → 生成最终共识和最佳解决方案
```

### 辩论结束条件

系统会在以下情况下结束辩论：

1. 达到最大轮数（默认3轮）
2. AI们的平均信心度超过阈值（默认75%）
3. AI们的答案趋于一致

## 🛠️ 技术栈

### 后端
- **Node.js** + **TypeScript**：类型安全的后端开发
- **Express**：Web服务器框架
- **WebSocket (ws)**：实时双向通信
- **AI SDKs**：
  - OpenAI SDK（GPT-4）
  - Anthropic SDK（Claude）
  - Google Generative AI SDK（Gemini）
  - DeepSeek API（DeepSeek）

### 前端
- **React 18** + **TypeScript**：现代化的UI框架
- **Vite**：快速的构建工具
- **WebSocket API**：实时通信
- **CSS3**：现代化的样式和动画

## 🎨 界面展示

- **实时状态显示**：连接状态、当前辩论轮次
- **用户问题卡片**：清晰展示你提出的问题
- **AI思考卡片**：每个AI的名称、思考过程、答案和信心度
- **讨论总结**：AI们的观点对比和分析
- **最终共识**：经过辩论后的最佳答案
- **响应式设计**：支持桌面和移动设备

## 🔧 高级配置

### 自定义AI配置

在 `backend/src/server.ts` 中的 `getAIConfigs()` 函数可以自定义AI配置：

```typescript
// 修改最大辩论轮数和共识阈值
const coordinator = new DebateCoordinator(
  configs,
  3,    // 最大轮数
  75    // 共识阈值（0-100）
);
```

### 添加更多AI提供商

1. 在 `AIClient.ts` 中添加新的AI提供商支持
2. 在 `types.ts` 中更新 `AIConfig` 类型
3. 在 `server.ts` 中添加相应的配置

## 📝 API接口

### WebSocket消息格式

#### 客户端 → 服务器

```json
{
  "type": "start_debate",
  "question": "你的问题"
}
```

#### 服务器 → 客户端

```json
// 状态更新
{
  "type": "debate_update",
  "data": {
    "type": "status|ai_response|discussion|consensus",
    "...": "..."
  },
  "timestamp": 1234567890
}

// 辩论完成
{
  "type": "debate_complete",
  "data": {
    "question": "...",
    "rounds": [...],
    "finalConsensus": "...",
    "bestSolution": "..."
  },
  "timestamp": 1234567890
}
```

## 🐛 故障排除

### 后端无法启动

1. 检查端口3001是否被占用
2. 确保已安装所有依赖：`npm run install:all`
3. 检查 `.env` 文件配置

### 前端无法连接后端

1. 确保后端服务正在运行
2. 检查WebSocket连接地址是否正确（默认 `ws://localhost:3001`）
3. 查看浏览器控制台是否有错误信息

### AI无法响应

1. 检查API密钥是否正确配置
2. 确认API密钥有足够的额度
3. 检查网络连接是否正常
4. 查看后端日志获取详细错误信息

## 📦 构建和部署

### 构建生产版本

```bash
# 构建前端和后端
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 部署建议

- **后端**：可以部署到 Heroku、Railway、Render等平台
- **前端**：可以部署到 Vercel、Netlify、Cloudflare Pages等平台
- **环境变量**：确保在部署平台上正确配置所有环境变量

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下AI服务提供商：
- OpenAI（GPT-4）
- Anthropic（Claude）
- Google（Gemini）
- DeepSeek（DeepSeek）

---

**享受AI辩论带来的深度思考体验！** 🚀
