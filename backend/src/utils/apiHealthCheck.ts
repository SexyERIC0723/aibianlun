import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIConfig } from '../types';

export interface HealthCheckResult {
  provider: string;
  name: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  isConfigured: boolean;
}

export class APIHealthCheck {
  /**
   * 测试单个AI配置是否可用
   */
  static async testAIConfig(config: AIConfig): Promise<HealthCheckResult> {
    const result: HealthCheckResult = {
      provider: config.provider,
      name: config.name,
      status: 'skipped',
      message: '',
      isConfigured: !!config.apiKey,
    };

    // 检查是否是示例密钥
    if (!config.apiKey || this.isExampleKey(config.apiKey)) {
      result.status = 'skipped';
      result.message = '未配置API密钥（使用示例值）';
      result.isConfigured = false;
      return result;
    }

    try {
      switch (config.provider) {
        case 'openai':
          await this.testOpenAI(config);
          break;
        case 'deepseek':
          await this.testDeepSeek(config);
          break;
        case 'anthropic':
          await this.testAnthropic(config);
          break;
        case 'google':
          await this.testGoogle(config);
          break;
        default:
          result.status = 'skipped';
          result.message = '未知的AI提供商';
          return result;
      }

      result.status = 'success';
      result.message = 'API密钥有效，连接成功';
    } catch (error) {
      result.status = 'error';
      if (error instanceof Error) {
        result.message = this.parseErrorMessage(error);
      } else {
        result.message = '未知错误';
      }
    }

    return result;
  }

  /**
   * 测试所有AI配置
   */
  static async testAllConfigs(configs: AIConfig[]): Promise<HealthCheckResult[]> {
    const results = await Promise.all(
      configs.map(config => this.testAIConfig(config))
    );
    return results;
  }

  /**
   * 检查是否是示例密钥
   */
  private static isExampleKey(key: string): boolean {
    const examplePatterns = [
      'your_',
      '_here',
      'example',
      'test',
      'sk-xxxxxxxx',
    ];
    return examplePatterns.some(pattern => key.toLowerCase().includes(pattern));
  }

  /**
   * 测试OpenAI连接
   */
  private static async testOpenAI(config: AIConfig): Promise<void> {
    const client = new OpenAI({ apiKey: config.apiKey });

    // 尝试获取模型列表（轻量级测试）
    await client.models.list();
  }

  /**
   * 测试DeepSeek连接
   */
  private static async testDeepSeek(config: AIConfig): Promise<void> {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.deepseek.com',
    });

    // 尝试获取模型列表
    await client.models.list();
  }

  /**
   * 测试Anthropic连接
   */
  private static async testAnthropic(config: AIConfig): Promise<void> {
    const client = new Anthropic({ apiKey: config.apiKey });

    // 发送一个最小化的测试请求
    await client.messages.create({
      model: config.model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
  }

  /**
   * 测试Google连接
   */
  private static async testGoogle(config: AIConfig): Promise<void> {
    const client = new GoogleGenerativeAI(config.apiKey!);
    const model = client.getGenerativeModel({ model: config.model });

    // 发送一个测试请求
    await model.generateContent('Hi');
  }

  /**
   * 解析错误信息
   */
  private static parseErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('authentication')) {
      return 'API密钥无效或已过期';
    }
    if (message.includes('quota') || message.includes('insufficient')) {
      return 'API额度不足';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return '网络连接失败';
    }
    if (message.includes('model')) {
      return '模型不可用或不存在';
    }

    return `连接失败: ${error.message.substring(0, 100)}`;
  }

  /**
   * 打印健康检查报告
   */
  static printHealthReport(results: HealthCheckResult[]): void {
    console.log('\n========================================');
    console.log('🏥 AI API 健康检查报告');
    console.log('========================================\n');

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    results.forEach(result => {
      const icon = result.status === 'success' ? '✅'
                 : result.status === 'error' ? '❌'
                 : '⏭️';

      console.log(`${icon} ${result.name} (${result.provider})`);
      console.log(`   状态: ${this.getStatusText(result.status)}`);
      console.log(`   信息: ${result.message}`);
      console.log('');
    });

    console.log('----------------------------------------');
    console.log(`总计: ${results.length} 个AI配置`);
    console.log(`✅ 成功: ${successCount}`);
    console.log(`❌ 失败: ${errorCount}`);
    console.log(`⏭️ 跳过: ${skippedCount}`);
    console.log('========================================\n');

    if (successCount === 0) {
      console.log('⚠️  警告: 没有可用的AI服务！');
      console.log('');
      console.log('请按以下步骤配置API密钥：');
      console.log('1. 编辑 backend/.env 文件');
      console.log('2. 将示例密钥替换为真实的API密钥');
      console.log('3. 至少配置一个AI服务的密钥');
      console.log('4. 保存文件后重启服务器\n');
    } else if (errorCount > 0) {
      console.log('⚠️  部分AI服务不可用，但系统可以继续运行\n');
    } else {
      console.log('✅ 所有配置的AI服务都正常运行！\n');
    }
  }

  private static getStatusText(status: string): string {
    switch (status) {
      case 'success':
        return '正常';
      case 'error':
        return '错误';
      case 'skipped':
        return '未配置';
      default:
        return '未知';
    }
  }
}
