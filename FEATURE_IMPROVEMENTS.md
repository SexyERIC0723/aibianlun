# 🚀 功能改进计划

## 📋 改进需求总结

根据用户反馈，需要以下改进：

1. ✅ **聊天历史持久化** - 保存之前的讨论记录
2. ✅ **多会话管理** - 创建新聊天、查看历史聊天
3. ✅ **增强日志系统** - 详细的调试日志
4. 🔄 **消息格式优化** - 改善特殊字符显示
5. 🔄 **模型配置界面** - 让用户管理模型设置
6. 🔄 **模型选择功能** - 选择参与辩论的AI

## ✅ 已完成功能

### 1. 后端日志系统 (`backend/src/utils/logger.ts`)

**功能特性：**
- 支持多级别日志：DEBUG, INFO, WARN, ERROR
- 彩色控制台输出
- 结构化日志数据
- 上下文标记

**使用方式：**
```typescript
import { createLogger } from './utils/logger';

const logger = createLogger('MyComponent');

logger.info('操作成功', { userId: 123 });
logger.error('操作失败', error);
logger.debug('调试信息', { data });
```

**配置：**
在 `.env` 中设置 `LOG_LEVEL=DEBUG` 开启调试日志

### 2. 会话管理系统 (`backend/src/services/SessionManager.ts`)

**功能特性：**
- 创建新会话
- 获取会话列表
- 获取会话详情
- 更新会话信息
- 删除会话
- 会话消息存储
- 自动管理会话数量上限

**API端点：**
```
GET    /api/sessions           # 获取所有会话
POST   /api/sessions           # 创建新会话
GET    /api/sessions/:id       # 获取会话详情
PATCH  /api/sessions/:id       # 更新会话
DELETE /api/sessions/:id       # 删除会话
GET    /api/sessions-stats     # 获取统计信息
```

### 3. 消息格式化组件 (`frontend/src/components/MarkdownRenderer.tsx`)

**功能特性：**
- 清理特殊字符和转义符
- 支持基本Markdown格式
- 代码块高亮
- 列表渲染
- 链接处理

## 🔄 待完成功能

### 1. 前端会话管理界面

**需要创建的组件：**

#### a) SessionList 组件
- 显示所有会话列表
- 创建新会话按钮
- 切换会话功能
- 删除会话功能

```tsx
<SessionList
  sessions={sessions}
  currentSessionId={currentSessionId}
  onSessionSelect={handleSelectSession}
  onSessionCreate={handleCreateSession}
  onSessionDelete={handleDeleteSession}
/>
```

#### b) SessionManager 组件
- 会话标题编辑
- 启用/禁用AI选择
- 会话详情显示

### 2. 本地存储集成

**实现方案：**

```typescript
// 使用localStorage保存会话
const saveSession = (session: ChatSession) => {
  localStorage.setItem(`session_${session.id}`, JSON.stringify(session));
};

// 加载所有会话
const loadSessions = (): ChatSession[] => {
  const sessions: ChatSession[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('session_')) {
      const session = JSON.parse(localStorage.getItem(key) || '{}');
      sessions.push(session);
    }
  }
  return sessions;
};
```

### 3. 模型配置界面

**需要创建：**

#### a) ModelConfig 组件
```tsx
interface ModelConfigProps {
  models: AIConfig[];
  onModelUpdate: (model: AIConfig) => void;
  onModelToggle: (modelName: string, enabled: boolean) => void;
}
```

**界面功能：**
- 显示所有可用模型
- 切换模型启用/禁用状态
- 编辑模型参数（temperature, max_tokens等）
- 实时保存配置

#### b) ModelSelector 组件
```tsx
interface ModelSelectorProps {
  availableModels: AIConfig[];
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
}
```

**界面功能：**
- 多选框选择AI
- 显示模型状态（✅/❌/⏭️）
- 快速全选/全不选

### 4. 集成前端与后端

**WebSocket消息扩展：**

```typescript
// 客户端发送
{
  type: 'start_debate',
  question: string,
  sessionId: string,        // 新增
  enabledAIs: string[]       // 新增
}

// 服务器响应
{
  type: 'debate_update',
  sessionId: string,         // 新增
  data: {...}
}
```

### 5. UI/UX改进

**侧边栏布局：**
```
+------------------+------------------------+
|                  |                        |
|  [新建对话]      |    对话标题             |
|                  |   [模型选择] [设置]     |
|  会话1 (active)  |                        |
|  会话2           |    消息区域             |
|  会话3           |                        |
|  ...             |                        |
|                  |                        |
|  [设置]          |   [输入框]              |
+------------------+------------------------+
```

**关键UI组件：**
1. 可折叠侧边栏
2. 会话搜索功能
3. 会话日期分组
4. 模型标签显示
5. 响应式设计

## 📝 实施步骤

### 阶段 1: 前端会话管理（优先级：高）

1. 创建 `SessionList` 组件
2. 创建 `SessionItem` 组件
3. 实现 localStorage 同步
4. 集成到主 App 组件

### 阶段 2: 模型管理界面（优先级：高）

1. 创建 `ModelSelector` 组件
2. 创建 `ModelConfig` 组件
3. 添加模型过滤到 WebSocket
4. 实时同步模型状态

### 阶段 3: 消息格式优化（优先级：中）

1. 集成 MarkdownRenderer 到消息显示
2. 添加代码高亮库（如 highlight.js）
3. 优化长文本显示
4. 添加复制按钮

### 阶段 4: 日志和调试（优先级：中）

1. 前端添加日志组件
2. 集成到后端logger
3. 添加日志查看器
4. 错误追踪和上报

### 阶段 5: 性能优化（优先级：低）

1. 虚拟滚动（大量消息）
2. 消息分页加载
3. WebSocket断线重连
4. 离线支持

## 🔧 配置文件更新

### backend/.env 新增配置
```env
# 日志级别
LOG_LEVEL=DEBUG

# 会话管理
MAX_SESSIONS=100
SESSION_TTL=2592000  # 30天（秒）

# 模型默认配置
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=2000
```

## 📚 使用示例

### 创建新会话

```typescript
// 前端
const createNewSession = async () => {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '新对话',
      enabledAIs: ['GPT-4', 'DeepSeek']
    })
  });
  const { session } = await response.json();
  setCurrentSession(session);
};
```

### 选择AI参与辩论

```typescript
// 在发送问题时指定AI
const startDebate = (question: string) => {
  ws.send(JSON.stringify({
    type: 'start_debate',
    question,
    sessionId: currentSession.id,
    enabledAIs: selectedAIs  // ['GPT-4', 'DeepSeek']
  }));
};
```

### 查看日志

```bash
# 后端日志（控制台）
npm run dev

# 输出示例：
[2025-12-01T15:30:45.123Z] [INFO] [Server] Session created { id: 'session_123', title: '新对话' }
[2025-12-01T15:30:46.456Z] [DEBUG] [DebateCoordinator] Starting debate { sessionId: 'session_123', enabledAIs: 2 }
[2025-12-01T15:30:47.789Z] [INFO] [AIClient] API call [DeepSeek] generateResponse - success
```

## 🎯 下一步行动

1. **立即实施**：前端会话列表和选择
2. **短期目标**：模型配置界面
3. **中期目标**：完整的会话管理UI
4. **长期目标**：数据库持久化

---

**注意**: 当前实现使用内存存储，服务器重启会丢失数据。
建议后续升级到数据库存储（如 SQLite, PostgreSQL）。
