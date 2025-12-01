import { AIClient } from './AIClient';
import { AIConfig, AIResponse, DebateRound, DebateResult } from '../types';

export class DebateCoordinator {
  private aiClients: AIClient[];
  private maxRounds: number;
  private consensusThreshold: number;

  constructor(configs: AIConfig[], maxRounds: number = 3, consensusThreshold: number = 80) {
    this.aiClients = configs.map(config => new AIClient(config));
    this.maxRounds = maxRounds;
    this.consensusThreshold = consensusThreshold;
  }

  async startDebate(question: string, onUpdate?: (data: any) => void): Promise<DebateResult> {
    const rounds: DebateRound[] = [];
    let currentRound = 1;
    let previousContext = '';

    onUpdate?.({ type: 'status', message: '开始AI辩论...', roundNumber: 0 });

    while (currentRound <= this.maxRounds) {
      onUpdate?.({ type: 'status', message: `第 ${currentRound} 轮思考中...`, roundNumber: currentRound });

      // 并发调用所有AI
      const responses = await this.getAllAIResponses(question, previousContext, onUpdate);

      onUpdate?.({ type: 'round_complete', responses, roundNumber: currentRound });

      // 分析响应并生成讨论
      const discussion = await this.generateDiscussion(responses, question);
      onUpdate?.({ type: 'discussion', discussion, roundNumber: currentRound });

      // 判断是否需要继续辩论
      const needsAnotherRound = this.shouldContinueDebate(responses, currentRound);

      const round: DebateRound = {
        roundNumber: currentRound,
        responses,
        discussion,
        needsAnotherRound,
      };

      rounds.push(round);

      if (!needsAnotherRound || currentRound >= this.maxRounds) {
        break;
      }

      // 准备下一轮的上下文
      previousContext = this.buildContextForNextRound(responses, discussion);
      currentRound++;
    }

    // 生成最终共识
    onUpdate?.({ type: 'status', message: '正在生成最终共识...', roundNumber: currentRound });
    const finalConsensus = await this.generateFinalConsensus(rounds, question);
    const bestSolution = this.extractBestSolution(rounds);

    onUpdate?.({ type: 'consensus', finalConsensus, bestSolution });

    return {
      question,
      rounds,
      finalConsensus,
      bestSolution,
    };
  }

  private async getAllAIResponses(
    question: string,
    context: string,
    onUpdate?: (data: any) => void
  ): Promise<AIResponse[]> {
    const promises = this.aiClients.map(async (client, index) => {
      const response = await client.generateResponse(question, context);
      onUpdate?.({ type: 'ai_response', response, aiIndex: index });
      return response;
    });

    return Promise.all(promises);
  }

  private async generateDiscussion(responses: AIResponse[], question: string): Promise<string> {
    // 使用第一个AI来生成讨论总结
    if (this.aiClients.length === 0) return '';

    const summaryPrompt = `作为讨论主持人，请分析以下多个AI对同一问题的回答，并生成一个讨论总结。

问题：${question}

各AI的回答：
${responses.map((r, i) => `
${i + 1}. ${r.aiName}
思考：${r.thinking}
答案：${r.answer}
信心：${r.confidence}%
`).join('\n')}

请分析：
1. 这些回答之间的共同点
2. 存在的分歧或不同观点
3. 哪些观点最有价值
4. 是否需要进一步讨论

请简洁地总结（200字以内）：`;

    const discussionResponse = await this.aiClients[0].generateResponse(summaryPrompt);
    return discussionResponse.answer;
  }

  private shouldContinueDebate(responses: AIResponse[], currentRound: number): boolean {
    if (currentRound >= this.maxRounds) {
      return false;
    }

    // 计算平均信心度
    const avgConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length;

    // 如果平均信心度很高，可以结束
    if (avgConfidence >= this.consensusThreshold) {
      return false;
    }

    // 检查答案的多样性
    const uniqueAnswers = new Set(responses.map(r => r.answer.substring(0, 100)));

    // 如果答案差异很大，需要继续讨论
    if (uniqueAnswers.size > responses.length * 0.7) {
      return true;
    }

    // 如果信心度差异很大，需要继续讨论
    const confidences = responses.map(r => r.confidence);
    const maxConfidence = Math.max(...confidences);
    const minConfidence = Math.min(...confidences);

    if (maxConfidence - minConfidence > 30) {
      return true;
    }

    return false;
  }

  private buildContextForNextRound(responses: AIResponse[], discussion: string): string {
    return `
上一轮讨论总结：
${discussion}

各AI的回答：
${responses.map((r, i) => `
${i + 1}. ${r.aiName}（信心度：${r.confidence}%）
思考：${r.thinking}
答案：${r.answer}
`).join('\n')}

请根据以上信息，重新思考并给出你的答案。`;
  }

  private async generateFinalConsensus(rounds: DebateRound[], question: string): Promise<string> {
    if (this.aiClients.length === 0) return '';

    const lastRound = rounds[rounds.length - 1];
    const allResponses = rounds.flatMap(r => r.responses);

    const consensusPrompt = `作为总结者，请根据${rounds.length}轮AI辩论的结果，生成一个最终的共识答案。

原始问题：${question}

经过${rounds.length}轮讨论后，各AI的最终观点：
${lastRound.responses.map((r, i) => `
${i + 1}. ${r.aiName}（信心度：${r.confidence}%）
答案：${r.answer}
`).join('\n')}

请综合所有AI的观点，生成一个全面、准确、实用的最终答案。这个答案应该：
1. 综合各AI的优点
2. 解决之前讨论中发现的问题
3. 给出清晰的结论和建议

最终共识：`;

    const consensusResponse = await this.aiClients[0].generateResponse(consensusPrompt);
    return consensusResponse.answer;
  }

  private extractBestSolution(rounds: DebateRound[]): string {
    const lastRound = rounds[rounds.length - 1];

    // 找出信心度最高的回答
    const bestResponse = lastRound.responses.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return `根据${rounds.length}轮深度讨论，所有AI共同认为最佳解决方案是：

${bestResponse.answer}

这个方案由 ${bestResponse.aiName} 提出，获得了 ${bestResponse.confidence}% 的信心评分。`;
  }
}
