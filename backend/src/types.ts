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
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  apiKey?: string;
}

export interface ChatMessage {
  type: 'question' | 'ai_response' | 'discussion' | 'consensus' | 'status';
  data: any;
  timestamp: number;
}
