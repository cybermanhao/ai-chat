// engine/services/ErrorHandler.ts
// 统一错误处理服务
import type { RuntimeMessage } from '../types/chat';
import { ChatMessageManager } from '../managers/MessageManager';

export interface ErrorHandlerOptions {
  addMessage: (msg: RuntimeMessage) => void;
  updateLastMessage?: (patch: Partial<RuntimeMessage>) => void;
}

export class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions) {
    this.options = options;
  }

  handleError(error: unknown, context?: string): RuntimeMessage {
    const errorMessage = this.formatError(error, context);
    const noticeMessage = ChatMessageManager.createClientNoticeMessage(
      errorMessage,
      'error',
      this.getErrorCode(error)
    );
    
    this.options.addMessage(noticeMessage);
    
    // 如果有 updateLastMessage 回调，更新最后一条消息状态
    if (this.options.updateLastMessage) {
      this.options.updateLastMessage({ status: 'error' });
    }
    
    return noticeMessage;
  }

  private formatError(error: unknown, context?: string): string {
    let errorText = '';
    
    if (error instanceof Error) {
      errorText = error.message;
    } else if (typeof error === 'string') {
      errorText = error;
    } else {
      errorText = '未知错误';
    }
    
    if (context) {
      return `${context}: ${errorText}`;
    }
    
    return errorText;
  }

  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      // 根据错误类型返回不同的错误代码
      if (error.name === 'AbortError') return 'ABORTED';
      if (error.message.includes('network')) return 'NETWORK_ERROR';
      if (error.message.includes('timeout')) return 'TIMEOUT';
      if (error.message.includes('unauthorized')) return 'UNAUTHORIZED';
      if (error.message.includes('rate limit')) return 'RATE_LIMIT';
    }
    
    return 'UNKNOWN_ERROR';
  }

  // 静态方法，用于快速处理错误
  static handleError(error: unknown, options: ErrorHandlerOptions, context?: string): RuntimeMessage {
    const handler = new ErrorHandler(options);
    return handler.handleError(error, context);
  }
} 