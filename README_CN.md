# 快速使用指南

## 一分钟快速上手

### 1️⃣ 安装

```bash
# 安装所有依赖
npm run install:all
```

### 2️⃣ 配置

```bash
# 创建环境变量文件
cd backend
cp .env.example .env

# 编辑 .env 文件，至少添加一个AI服务的API密钥
# 例如：OPENAI_API_KEY=sk-your-key-here
```

### 3️⃣ 启动

```bash
# 返回项目根目录
cd ..

# 同时启动前端和后端
npm run dev
```

### 4️⃣ 使用

打开浏览器访问 `http://localhost:3000`，输入问题，开始AI辩论！

## 获取API密钥

### OpenAI (GPT-4)
访问：https://platform.openai.com/api-keys

### Anthropic (Claude)
访问：https://console.anthropic.com/

### Google (Gemini)
访问：https://makersuite.google.com/app/apikey

### DeepSeek
访问：https://platform.deepseek.com/

## 常见问题

**Q: 我没有任何API密钥，可以使用吗？**
A: 可以！不配置API密钥时，系统会使用模拟AI进行演示，但回答质量会受限。

**Q: 需要配置所有AI吗？**
A: 不需要，至少配置一个即可。配置越多，辩论效果越好。

**Q: 如何停止服务？**
A: 在终端按 `Ctrl + C`

**Q: 端口被占用怎么办？**
A: 在 `backend/.env` 中修改 `PORT=3001` 为其他端口，同时在 `frontend/src/App.tsx` 中修改WebSocket连接地址。

## 目录说明

```
aibianlun/
├── backend/    # 后端服务（Node.js + Express + WebSocket）
├── frontend/   # 前端界面（React + TypeScript）
└── README.md   # 完整文档
```

更多详细信息请查看 [README.md](README.md)
