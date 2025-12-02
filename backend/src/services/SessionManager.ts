import { ChatSession, ChatMessage } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('SessionManager');

/**
 * 会话管理器 - 管理聊天会话的创建、存储和检索
 * 使用内存存储，可以后续扩展为数据库存储
 */
export class SessionManager {
  private sessions: Map<string, ChatSession>;
  private maxSessions: number;

  constructor(maxSessions: number = 100) {
    this.sessions = new Map();
    this.maxSessions = maxSessions;
    logger.info('SessionManager initialized', { maxSessions });
  }

  /**
   * 创建新会话
   */
  createSession(title?: string, enabledAIs?: string[]): ChatSession {
    const id = this.generateSessionId();
    const session: ChatSession = {
      id,
      title: title || `对话 ${new Date().toLocaleString('zh-CN')}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      enabledAIs: enabledAIs || [],
    };

    // 如果超过最大会话数，删除最旧的会话
    if (this.sessions.size >= this.maxSessions) {
      const oldestSessionId = Array.from(this.sessions.keys())[0];
      this.sessions.delete(oldestSessionId);
      logger.warn('Deleted oldest session due to limit', { deletedId: oldestSessionId });
    }

    this.sessions.set(id, session);
    logger.info('Session created', { id, title });
    return session;
  }

  /**
   * 获取会话
   */
  getSession(id: string): ChatSession | null {
    const session = this.sessions.get(id);
    if (!session) {
      logger.warn('Session not found', { id });
      return null;
    }
    return session;
  }

  /**
   * 获取所有会话（仅元数据，不包含消息）
   */
  getAllSessions(): Array<Omit<ChatSession, 'messages'>> {
    return Array.from(this.sessions.values())
      .map(({ id, title, createdAt, updatedAt, enabledAIs }) => ({
        id,
        title,
        createdAt,
        updatedAt,
        enabledAIs,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt); // 最新的在前
  }

  /**
   * 更新会话
   */
  updateSession(id: string, updates: Partial<ChatSession>): ChatSession | null {
    const session = this.sessions.get(id);
    if (!session) {
      logger.warn('Cannot update session - not found', { id });
      return null;
    }

    const updatedSession = {
      ...session,
      ...updates,
      id: session.id, // ID不可更改
      createdAt: session.createdAt, // 创建时间不可更改
      updatedAt: Date.now(),
    };

    this.sessions.set(id, updatedSession);
    logger.info('Session updated', { id, updates: Object.keys(updates) });
    return updatedSession;
  }

  /**
   * 添加消息到会话
   */
  addMessage(sessionId: string, message: ChatMessage): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn('Cannot add message - session not found', { sessionId });
      return false;
    }

    session.messages.push(message);
    session.updatedAt = Date.now();

    logger.debug('Message added to session', {
      sessionId,
      messageType: message.type,
      messageCount: session.messages.length,
    });

    return true;
  }

  /**
   * 删除会话
   */
  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      logger.info('Session deleted', { id });
    } else {
      logger.warn('Cannot delete session - not found', { id });
    }
    return deleted;
  }

  /**
   * 清空所有会话
   */
  clearAllSessions(): void {
    const count = this.sessions.size;
    this.sessions.clear();
    logger.info('All sessions cleared', { count });
  }

  /**
   * 生成唯一会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 获取会话统计信息
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      maxSessions: this.maxSessions,
      sessions: Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        title: s.title,
        messageCount: s.messages.length,
        createdAt: new Date(s.createdAt).toLocaleString('zh-CN'),
      })),
    };
  }
}

// 单例实例
export const sessionManager = new SessionManager();
