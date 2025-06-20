import type { UserMessage, AssistantMessage, SystemMessage, ClientNoticeMessage } from '../types/chat';
import type { MessageStatus } from '../types/chat';

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
  
  /**
   * 创建客户端提示消息
   * @param content - 提示内容
   * @param noticeType - 提示类型 (error/warning/info)
   * @param errorCode - 可选的错误代码
   * @returns 客户端提示消息
   */
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
