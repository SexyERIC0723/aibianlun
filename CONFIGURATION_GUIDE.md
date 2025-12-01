# 📝 配置指南

## 🔧 配置API密钥

### 步骤1：复制环境变量模板

```bash
cd backend
cp .env.example .env
```

### 步骤2：编辑.env文件

使用任意文本编辑器打开 `backend/.env` 文件：

```bash
# macOS/Linux
nano .env
# 或
vim .env
# 或
code .env

# Windows
notepad .env
```

### 步骤3：替换示例密钥为真实密钥

**重要**: 你必须将 `your_xxx_api_key_here` 替换为真实的API密钥！

#### ✅ 正确的配置示例：

```env
# OpenAI配置
OPENAI_API_KEY=sk-proj-abcdef1234567890...
OPENAI_MODEL=gpt-4-turbo-preview

# DeepSeek配置
DEEPSEEK_API_KEY=sk-abcdef1234567890...
DEEPSEEK_MODEL=deepseek-chat
```

#### ❌ 错误的配置（使用示例值）：

```env
# 这样会导致API调用失败！
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## 🔑 获取API密钥

### OpenAI (GPT-4)

1. 访问：https://platform.openai.com/api-keys
2. 登录你的账号
3. 点击 "Create new secret key"
4. 复制生成的密钥（格式：`sk-proj-...`）
5. 粘贴到 `.env` 文件的 `OPENAI_API_KEY=` 后面

### DeepSeek

1. 访问：https://platform.deepseek.com/
2. 注册/登录账号
3. 进入API Keys页面
4. 创建新的API密钥
5. 复制密钥并粘贴到 `.env` 文件

### Anthropic (Claude)

1. 访问：https://console.anthropic.com/
2. 登录账号
3. 创建API密钥
4. 复制并配置到 `.env` 文件

### Google (Gemini)

1. 访问：https://makersuite.google.com/app/apikey
2. 创建API密钥
3. 复制并配置到 `.env` 文件

## ✅ 验证配置

启动服务器后，系统会自动进行健康检查：

```bash
npm run dev
```

你会看到类似这样的报告：

```
========================================
🏥 AI API 健康检查报告
========================================

✅ DeepSeek (deepseek)
   状态: 正常
   信息: API密钥有效，连接成功

✅ GPT-4 (openai)
   状态: 正常
   信息: API密钥有效，连接成功

⏭️ Claude (anthropic)
   状态: 未配置
   信息: 未配置API密钥（使用示例值）

----------------------------------------
总计: 3 个AI配置
✅ 成功: 2
❌ 失败: 0
⏭️ 跳过: 1
========================================
```

## 🎯 推荐配置

### 最小配置（至少1个）

选择以下任意一个配置即可使用系统：

```env
# 选项1: 只使用DeepSeek（性价比高）
DEEPSEEK_API_KEY=sk-your-real-key-here
DEEPSEEK_MODEL=deepseek-chat

# 选项2: 只使用GPT-4（功能强大）
OPENAI_API_KEY=sk-proj-your-real-key-here
OPENAI_MODEL=gpt-4-turbo-preview
```

### 推荐配置（2-3个AI）

配置2-3个不同的AI以获得更好的辩论效果：

```env
# DeepSeek（性价比高）
DEEPSEEK_API_KEY=sk-your-real-key-here
DEEPSEEK_MODEL=deepseek-chat

# GPT-4（功能强大）
OPENAI_API_KEY=sk-proj-your-real-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Claude（推理能力强）
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### 完整配置（所有AI）

```env
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
DEEPSEEK_API_KEY=sk-...
```

## 🔍 在前端查看API状态

启动应用后：

1. 打开浏览器访问 `http://localhost:3000`
2. 点击右上角的 **"🔍 AI状态"** 按钮
3. 查看每个AI的连接状态
4. ✅ = 正常，❌ = 错误，⏭️ = 未配置

## ⚠️ 常见问题

### 问题1: 所有AI都显示"未配置"

**原因**: 你还在使用 `.env.example` 中的示例值

**解决方案**:
1. 检查 `backend/.env` 文件
2. 确保已将 `your_xxx_api_key_here` 替换为真实密钥
3. 保存文件后重启服务器

### 问题2: API密钥无效

**原因**:
- 密钥复制错误（多余空格、不完整）
- 密钥已过期或被撤销
- 账户余额不足

**解决方案**:
1. 重新复制API密钥，确保完整
2. 检查API提供商的控制台，确认密钥有效
3. 检查账户余额

### 问题3: 辩论时提示"没有可用的AI服务"

**原因**: 所有配置的AI都未通过健康检查

**解决方案**:
1. 查看服务器控制台的健康检查报告
2. 至少配置一个有效的API密钥
3. 重启服务器

## 💰 成本提示

- **DeepSeek**: 性价比最高，推荐日常使用
- **GPT-4**: 功能强大但价格较高
- **Claude**: 推理能力强，价格适中
- **Gemini**: 价格低廉

建议先配置1-2个AI测试使用，根据需求再增加更多AI。

## 🔒 安全提示

1. **永远不要**将 `.env` 文件提交到Git
2. **不要**在公共场合分享API密钥
3. 定期轮换API密钥
4. 为API密钥设置使用限额

---

配置完成后，享受多AI辩论带来的智慧碰撞吧！🚀
