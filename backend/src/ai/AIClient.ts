import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIConfig, AIResponse } from '../types';

export class AIClient {
  private config: AIConfig;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private google?: GoogleGenerativeAI;

  constructor(config: AIConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient() {
    switch (this.config.provider) {
      case 'openai':
        if (this.config.apiKey) {
          this.openai = new OpenAI({ apiKey: this.config.apiKey });
        }
        break;
      case 'anthropic':
        if (this.config.apiKey) {
          this.anthropic = new Anthropic({ apiKey: this.config.apiKey });
        }
        break;
      case 'google':
        if (this.config.apiKey) {
          this.google = new GoogleGenerativeAI(this.config.apiKey);
        }
        break;
    }
  }

  async generateResponse(prompt: string, context?: string): Promise<AIResponse> {
    try {
      const fullPrompt = this.buildPrompt(prompt, context);
      let thinking = '';
      let answer = '';
      let confidence = 0;

      switch (this.config.provider) {
        case 'openai':
          const result = await this.callOpenAI(fullPrompt);
          thinking = result.thinking;
          answer = result.answer;
          confidence = result.confidence;
          break;
        case 'anthropic':
          const anthropicResult = await this.callAnthropic(fullPrompt);
          thinking = anthropicResult.thinking;
          answer = anthropicResult.answer;
          confidence = anthropicResult.confidence;
          break;
        case 'google':
          const googleResult = await this.callGoogle(fullPrompt);
          thinking = googleResult.thinking;
          answer = googleResult.answer;
          confidence = googleResult.confidence;
          break;
        default:
          throw new Error(`不支持的AI提供商: ${this.config.provider}`);
      }

      return {
        aiName: this.config.name,
        thinking,
        answer,
        confidence,
      };
    } catch (error) {
      console.error(`${this.config.name} 生成响应时出错:`, error);
      return {
        aiName: this.config.name,
        thinking: '处理请求时遇到错误',
        answer: '抱歉，我无法回答这个问题。',
        confidence: 0,
      };
    }
  }

  private buildPrompt(question: string, context?: string): string {
    let prompt = `请回答以下问题。你的回答应该包含：
1. 你的思考过程（详细说明你是如何分析这个问题的）
2. 你的答案
3. 你对这个答案的信心程度（0-100）

问题：${question}`;

    if (context) {
      prompt += `\n\n其他AI的回答和思考供你参考：\n${context}\n\n请根据其他AI的观点，重新思考并给出你的答案。如果你认为其他AI的某些观点有价值，请说明原因。`;
    }

    prompt += `\n\n请按以下格式回答：
【思考过程】
[你的详细思考过程]

【答案】
[你的答案]

【信心程度】
[0-100的数字]`;

    return prompt;
  }

  private async callOpenAI(prompt: string): Promise<{ thinking: string; answer: string; confidence: number }> {
    if (!this.openai) {
      throw new Error('OpenAI客户端未初始化');
    }

    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '';
    return this.parseResponse(content);
  }

  private async callAnthropic(prompt: string): Promise<{ thinking: string; answer: string; confidence: number }> {
    if (!this.anthropic) {
      throw new Error('Anthropic客户端未初始化');
    }

    const message = await this.anthropic.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return this.parseResponse(content);
  }

  private async callGoogle(prompt: string): Promise<{ thinking: string; answer: string; confidence: number }> {
    if (!this.google) {
      throw new Error('Google客户端未初始化');
    }

    const model = this.google.getGenerativeModel({ model: this.config.model });
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    return this.parseResponse(content);
  }

  private parseResponse(content: string): { thinking: string; answer: string; confidence: number } {
    const thinkingMatch = content.match(/【思考过程】\s*([\s\S]*?)(?=【答案】|$)/);
    const answerMatch = content.match(/【答案】\s*([\s\S]*?)(?=【信心程度】|$)/);
    const confidenceMatch = content.match(/【信心程度】\s*(\d+)/);

    const thinking = thinkingMatch ? thinkingMatch[1].trim() : content.substring(0, 200);
    const answer = answerMatch ? answerMatch[1].trim() : content;
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

    return { thinking, answer, confidence };
  }
}
