import { createMessage } from './messageFactory';
import type { ClientNoticeMessage } from '@/types/chat';

// 错误代码常量
export const ErrorCode = {
  NETWORK_ERROR: 'ERR_NETWORK',
  TIMEOUT_ERROR: 'ERR_TIMEOUT',
  API_ERROR: 'ERR_API',
  AUTH_ERROR: 'ERR_AUTH',
  MODEL_ERROR: 'ERR_MODEL',
  UNKNOWN_ERROR: 'ERR_UNKNOWN',
  GENERATION_ABORTED: 'ERR_GENERATION_ABORTED'
} as const;

/**
 * 处理LLM API错误并生成客户端提示消息
 * @param error - 捕获的错误对象
 * @returns 格式化的客户端提示消息
 */
export function handleLLMError(error: unknown): ClientNoticeMessage {
  // 默认错误信息和代码
  let message = '生成回复时发生未知错误';
  let code: string = ErrorCode.UNKNOWN_ERROR;
  let type: 'error' | 'warning' | 'info' = 'error';
  
  // 处理不同类型的错误
  if (error instanceof Error) {
    message = error.message;
    
    // 判断错误类型
    if (error.name === 'AbortError') {
      message = '生成已被中止';
      code = ErrorCode.GENERATION_ABORTED;
      type = 'info';
    } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      message = '请求超时，请检查网络连接或API设置';
      code = ErrorCode.TIMEOUT_ERROR;
    } else if (message.includes('network') || message.includes('ENOTFOUND')) {
      message = '网络连接错误，请检查您的网络状态';
      code = ErrorCode.NETWORK_ERROR;
    } else if (message.includes('401') || message.includes('unauthorized') || message.includes('invalid_api_key')) {
      message = 'API密钥无效或已过期，请检查您的API密钥设置';
      code = ErrorCode.AUTH_ERROR;
    } else if (message.includes('403') || message.includes('permission')) {
      message = '没有访问权限，请检查您的API密钥权限';
      code = ErrorCode.AUTH_ERROR;
    } else if (message.includes('429') || message.includes('rate limit')) {
      message = '请求频率过高，请稍后再试';
      code = ErrorCode.API_ERROR;
      type = 'warning';
    }  } else if (typeof error === 'object' && error !== null) {
    // 处理其他类型的错误对象
    const errObj = error as Record<string, unknown>;
    if (errObj.code && typeof errObj.code === 'string') {
      code = errObj.code;
    }
    if (errObj.message && typeof errObj.message === 'string') {
      message = errObj.message;
    }
  }
  
  return createMessage.clientNotice(message, type, code);
}

// 移除本地 errorHandler.ts，已迁移到 engine/utils/errorHandler.ts
