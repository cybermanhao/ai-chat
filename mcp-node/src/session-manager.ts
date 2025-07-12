import { MCPServerConfig } from "./config.js";

/**
 * 会话数据接口
 */
export interface SessionData {
  sessionId: string;
  transport: any; // 保持为 any，兼容 mcp-service.ts 的动态加载
  lastActivity: number;
  createdAt: number;
}

/**
 * 会话管理器
 * 负责管理 MCP transport 会话的生命周期、活动跟踪和自动清理
 */
export class SessionManager {
  private sessions = new Map<string, SessionData>();
  private config: MCPServerConfig;
  private sessionCounter = 0;
  private cleanupTimer?: NodeJS.Timeout;
  private statusTimer?: NodeJS.Timeout;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.startPeriodicTasks();
  }

  /**
   * 生成新的会话ID
   */
  private generateSessionId(): string {
    return `session-${++this.sessionCounter}-${Date.now()}`;
  }

  /**
   * 创建新会话
   */
  public createSession(transport: any): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const sessionData: SessionData = {
      sessionId,
      transport,
      lastActivity: now,
      createdAt: now
    };

    this.sessions.set(sessionId, sessionData);
    
    // 设置transport关闭处理
    transport.onclose = () => {
      console.log(`[SessionManager] Transport断开连接, session: ${sessionId}`);
      this.removeSession(sessionId);
    };

    console.log(`[SessionManager] 创建新会话: ${sessionId}`);
    return sessionId;
  }

  /**
   * 获取会话
   */
  public getSession(sessionId: string): SessionData | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 检查会话是否存在
   */
  public hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * 更新会话活动时间
   */
  public updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  /**
   * 移除会话
   */
  public removeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        // 防止递归：先移除 onclose
        if (session.transport && typeof session.transport.onclose === 'function') {
          session.transport.onclose = null;
        }
        // 尝试关闭transport
        if (typeof session.transport.close === 'function') {
          session.transport.close();
        }
      } catch (error) {
        console.warn(`[SessionManager] 关闭transport时出错 (session: ${sessionId}):`, error);
      }
      
      this.sessions.delete(sessionId);
      console.log(`[SessionManager] 会话已移除: ${sessionId}`);
      return true;
    }
    return false;
  }

  /**
   * 获取活跃会话数量
   */
  public getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * 获取所有会话信息（用于调试）
   */
  public getAllSessions(): SessionData[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 清理不活跃的会话
   */
  private cleanupStalesSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeoutMs) {
        console.log(`[SessionManager] 清理不活跃的会话: ${sessionId}, 最后活跃时间: ${new Date(session.lastActivity).toISOString()}`);
        
        try {
          // 尝试关闭transport
          if (typeof session.transport.close === 'function') {
            session.transport.close();
          }
        } catch (error) {
          console.warn(`[SessionManager] 关闭transport时出错 (session: ${sessionId}):`, error);
        }
        
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SessionManager] 清理完成: 移除了 ${cleanedCount} 个不活跃的会话`);
    }
  }

  /**
   * 打印会话状态信息
   */
  private printSessionStatus(): void {
    const sessionCount = this.sessions.size;
    console.log(`[SessionManager] 活跃会话数量: ${sessionCount}`);

    if (sessionCount > 0) {
      console.log(`[SessionManager] 当前活跃会话:`);
      for (const session of this.sessions.values()) {
        const minutesAgo = Math.floor((Date.now() - session.lastActivity) / 1000 / 60);
        const ageMinutes = Math.floor((Date.now() - session.createdAt) / 1000 / 60);
        console.log(`  - ${session.sessionId}: ${minutesAgo}分钟前活跃, 存在${ageMinutes}分钟`);
      }
    }
  }

  /**
   * 启动定期任务
   */
  private startPeriodicTasks(): void {
    // 定期清理任务
    this.cleanupTimer = setInterval(() => {
      this.cleanupStalesSessions();
    }, this.config.cleanupIntervalMs);

    // 定期状态报告任务
    this.statusTimer = setInterval(() => {
      this.printSessionStatus();
    }, this.config.statusReportIntervalMs);

    console.log(`[SessionManager] 定期任务已启动:`);
    console.log(`  - 清理间隔: ${this.config.cleanupIntervalMs / 1000 / 60} 分钟`);
    console.log(`  - 状态报告间隔: ${this.config.statusReportIntervalMs / 1000 / 60} 分钟`);
    console.log(`  - 会话超时: ${this.config.sessionTimeoutMs / 1000 / 60} 分钟`);
  }

  /**
   * 停止定期任务
   */
  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = undefined;
    }

    // 清理所有会话
    for (const sessionId of this.sessions.keys()) {
      this.removeSession(sessionId);
    }

    console.log(`[SessionManager] 已停止并清理所有会话`);
  }
}
