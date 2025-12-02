/**
 * 增强的日志系统
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private context: string;
  private enableDebug: boolean;

  constructor(context: string) {
    this.context = context;
    this.enableDebug = process.env.LOG_LEVEL === 'DEBUG' || process.env.NODE_ENV === 'development';
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] [${this.context}] ${message}${dataStr}`;
  }

  private getColorCode(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    };
    return colors[level] || '';
  }

  private log(level: LogLevel, message: string, data?: any): void {
    const formattedMessage = this.formatMessage(level, message, data);
    const colorCode = this.getColorCode(level);
    const resetCode = '\x1b[0m';

    console.log(`${colorCode}${formattedMessage}${resetCode}`);
  }

  debug(message: string, data?: any): void {
    if (this.enableDebug) {
      this.log(LogLevel.DEBUG, message, data);
    }
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: any): void {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;

    this.log(LogLevel.ERROR, message, errorData);
  }

  apiCall(provider: string, method: string, status: 'start' | 'success' | 'error', details?: any): void {
    const message = `API调用 [${provider}] ${method} - ${status}`;
    if (status === 'error') {
      this.error(message, details);
    } else {
      this.debug(message, details);
    }
  }

  websocket(event: string, details?: any): void {
    this.debug(`WebSocket事件: ${event}`, details);
  }

  debate(event: string, details?: any): void {
    this.info(`辩论事件: ${event}`, details);
  }
}

// 创建全局日志实例
export const createLogger = (context: string) => new Logger(context);
