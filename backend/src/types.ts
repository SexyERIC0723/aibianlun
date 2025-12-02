export interface AIResponse {
  aiName: string;
  thinking: string;
  answer: string;
  confidence: number;
}

export interface DebateRound {
  roundNumber: number;
  responses: AIResponse[];
  discussion: string;
  needsAnotherRound: boolean;
}

export interface DebateResult {
  question: string;
  rounds: DebateRound[];
  finalConsensus: string;
  bestSolution: string;
}

export interface AIConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'custom';
  model: string;
  apiKey?: string;
  baseURL?: string;
  enabled?: boolean; // 新增：是否启用此AI
}

export interface ChatMessage {
  type: 'question' | 'ai_response' | 'discussion' | 'consensus' | 'status';
  data: any;
  timestamp: number;
}

// 新增：会话相关类型
export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  enabledAIs: string[]; // 此会话中启用的AI名称列表
}

export interface SessionCreateRequest {
  title?: string;
  enabledAIs?: string[];
}

export interface SessionUpdateRequest {
  title?: string;
  enabledAIs?: string[];
}
