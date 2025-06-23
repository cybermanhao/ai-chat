// 消息工厂：创建不同类型的消息对象，适用于多端同构
import type { MessageStatus, UserMessage, AssistantMessage, SystemMessage, ClientNoticeMessage } from '../types/chat';

// 纯函数工厂，兼容多端 store
export function createUserMessage(content: string, status?: MessageStatus, extra: Partial<UserMessage> = {}): UserMessage {
  return {
    id: extra.id || '',
    timestamp: Date.now(),
    content,
    role: 'user',
    status,
    ...extra,
  };
}
export function createAssistantMessage(content: string, status?: MessageStatus, extra: Partial<AssistantMessage> = {}): AssistantMessage {
  return {
    id: extra.id || '',
    timestamp: Date.now(),
    content,
    role: 'assistant',
    status,
    ...extra,
  };
}
export function createSystemMessage(content: string, extra: Partial<SystemMessage> = {}): SystemMessage {
  return {
    id: extra.id || '',
    timestamp: Date.now(),
    content,
    role: 'system',
    ...extra,
  };
}

// createMessage 对象工厂，兼容 web 端
export const createMessage = {
  user: (content: string, status: MessageStatus = 'stable'): UserMessage => ({
    id: `msg-${Date.now()}`,
    role: 'user',
    content: content.trim(),
    timestamp: Date.now(),
    status
  }),
  assistant: (content: string = '', status: MessageStatus = 'connecting'): AssistantMessage => ({
    id: `msg-${Date.now()}-response`,
    role: 'assistant',
    content,
    timestamp: Date.now(),
    status
  }),
  system: (content: string): SystemMessage => ({
    id: `sys-${Date.now()}`,
    role: 'system',
    content,
    timestamp: Date.now(),
    status: 'stable'
  }),
  clientNotice: (
    content: string,
    noticeType: 'error' | 'warning' | 'info' = 'error',
    errorCode?: string
  ): ClientNoticeMessage => ({
    id: `notice-${Date.now()}`,
    role: 'client-notice',
    content,
    timestamp: Date.now(),
    status: 'stable',
    noticeType,
    errorCode
  })
};

/**
 * 【集成建议】
 * - 消息创建后，持久化/请求/导出等场景请配合 MessageManager 使用：
 *   - MessageManager.filterForLLM(messages) 组织 LLM 请求上下文
 *   - MessageManager.filterForPersist(messages) 组织本地持久化内容
 *   - MessageManager.save(storage, chatId, messages) 统一持久化
 *   - MessageManager.load(storage, chatId) 统一加载
 */

export {}; // 确保本文件为模块
