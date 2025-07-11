// web/src/services/mcpNotificationService.ts
// MCP 相关的消息提示服务
import { message } from 'antd';

export interface MCPNotificationConfig {
  showSuccess?: boolean;
  showError?: boolean;
  showWarning?: boolean;
  showInfo?: boolean;
  duration?: number;
}

export interface ServerConnectionResult {
  serverId: string;
  serverName: string;
  success: boolean;
  error?: string;
  toolCount?: number;
}

export interface ReconnectResult {
  successCount: number;
  failureCount: number;
  totalCount: number;
  details?: ServerConnectionResult[];
}

/**
 * MCP 消息提示服务
 * 统一管理 MCP 相关的用户消息提示
 */
export class MCPNotificationService {
  private static instance: MCPNotificationService;
  private config: MCPNotificationConfig;

  constructor(config: MCPNotificationConfig = {}) {
    this.config = {
      showSuccess: true,
      showError: true,
      showWarning: true,
      showInfo: true,
      duration: 3,
      ...config
    };
  }

  public static getInstance(config?: MCPNotificationConfig): MCPNotificationService {
    if (!MCPNotificationService.instance) {
      MCPNotificationService.instance = new MCPNotificationService(config);
    }
    return MCPNotificationService.instance;
  }

  /**
   * 显示服务器连接成功消息
   */
  public showServerConnected(serverName: string, toolCount: number): void {
    if (!this.config.showSuccess) return;
    
    message.success({
      content: `服务器 "${serverName}" 连接成功！获取到 ${toolCount} 个工具`,
      duration: this.config.duration
    });
  }

  /**
   * 显示服务器连接失败消息
   */
  public showServerConnectionFailed(serverName: string, error: string): void {
    if (!this.config.showError) return;
    
    message.error({
      content: `服务器 "${serverName}" 连接失败：${error}`,
      duration: this.config.duration
    });
  }

  /**
   * 显示服务器断开连接消息
   */
  public showServerDisconnected(serverName: string): void {
    if (!this.config.showInfo) return;
    
    message.info({
      content: `服务器 "${serverName}" 已断开连接`,
      duration: this.config.duration
    });
  }

  /**
   * 显示服务器断开连接失败消息
   */
  public showServerDisconnectionFailed(serverName: string, error: string): void {
    if (!this.config.showError) return;
    
    message.error({
      content: `服务器 "${serverName}" 断开连接失败：${error}`,
      duration: this.config.duration
    });
  }

  /**
   * 显示自动重连开始消息
   */
  public showReconnectStarted(serverCount: number): () => void {
    if (!this.config.showInfo) return () => {};
    
    return message.loading({
      content: `正在重连 ${serverCount} 个 MCP 服务器...`,
      duration: 0 // 不自动关闭
    });
  }

  /**
   * 显示自动重连完成消息
   */
  public showReconnectCompleted(result: ReconnectResult): void {
    const { successCount, failureCount, totalCount } = result;
    
    console.log(`[MCPNotificationService] showReconnectCompleted 被调用:`, result);
    
    if (totalCount === 0) {
      if (this.config.showInfo) {
        console.log(`[MCPNotificationService] 显示无需重连消息`);
        message.info({
          content: '没有需要重连的 MCP 服务器',
          duration: this.config.duration
        });
      }
      return;
    }
    
    if (successCount === totalCount) {
      // 全部成功
      if (this.config.showSuccess) {
        console.log(`[MCPNotificationService] 显示全部成功消息: ${successCount}/${totalCount}`);
        message.success({
          content: `成功重连 ${successCount} 个 MCP 服务器`,
          duration: this.config.duration
        });
      }
    } else if (successCount > 0) {
      // 部分成功
      if (this.config.showWarning) {
        console.log(`[MCPNotificationService] 显示部分成功消息: ${successCount}/${totalCount}`);
        message.warning({
          content: `部分 MCP 服务器重连成功：${successCount}/${totalCount}`,
          duration: this.config.duration
        });
      }
    } else {
      // 全部失败
      if (this.config.showError) {
        console.log(`[MCPNotificationService] 显示全部失败消息: ${failureCount}/${totalCount}`);
        message.error({
          content: `所有 MCP 服务器重连失败：${failureCount}/${totalCount}`,
          duration: this.config.duration
        });
      }
    }
  }

  /**
   * 显示工具调用成功消息
   */
  public showToolCallSuccess(toolName: string, serverName: string): void {
    if (!this.config.showSuccess) return;
    
    message.success({
      content: `工具 "${toolName}" 调用成功（服务器：${serverName}）`,
      duration: this.config.duration
    });
  }

  /**
   * 显示工具调用失败消息
   */
  public showToolCallFailed(toolName: string, serverName: string, error: string): void {
    if (!this.config.showError) return;
    
    message.error({
      content: `工具 "${toolName}" 调用失败（服务器：${serverName}）：${error}`,
      duration: this.config.duration
    });
  }

  /**
   * 显示通用错误消息
   */
  public showError(content: string): void {
    if (!this.config.showError) return;
    
    message.error({
      content,
      duration: this.config.duration
    });
  }

  /**
   * 显示通用成功消息
   */
  public showSuccess(content: string): void {
    if (!this.config.showSuccess) return;
    
    message.success({
      content,
      duration: this.config.duration
    });
  }

  /**
   * 显示通用警告消息
   */
  public showWarning(content: string): void {
    if (!this.config.showWarning) return;
    
    message.warning({
      content,
      duration: this.config.duration
    });
  }

  /**
   * 显示通用信息消息
   */
  public showInfo(content: string): void {
    if (!this.config.showInfo) return;
    
    message.info({
      content,
      duration: this.config.duration
    });
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<MCPNotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 导出默认实例
export const mcpNotificationService = MCPNotificationService.getInstance();
