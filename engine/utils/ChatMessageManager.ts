// engine/utils/ChatMessageManager.ts
// 统一的消息管理器，整合消息创建和管理功能
import type { MessageStatus } from '../types/chat';
import { ChatMessage, RuntimeMessage, BaseMessageProps } from '../types/message';

export class ChatMessageManager {
  private messages: RuntimeMessage[] = [];
  private saveChat: () => void;

  constructor(initialMessages: RuntimeMessage[] = [], saveChat?: () => void) {
    this.messages = initialMessages;
    this.saveChat = saveChat || (() => {});
  }

  // 消息管理方法
  getMessages(): RuntimeMessage[] {
    return this.messages;
  }

  addMessage(msg: RuntimeMessage) {
    this.messages.push(msg);
    this.saveChat();
  }

  updateLastMessage(patch: Partial<RuntimeMessage>) {
    if (this.messages.length === 0) return;
    const last = this.messages[this.messages.length - 1];
    Object.assign(last, patch);
    this.saveChat();
  }

  clearMessages() {
    this.messages = [];
    this.saveChat();
  }

  // 消息工厂方法
  createUserMessage(content: string, status: MessageStatus = 'stable', extra: Partial<BaseMessageProps> = {}): RuntimeMessage {
    const props: BaseMessageProps & { status: MessageStatus } = {
      id: extra.id || `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      status,
      ...extra,
    };
    return new RuntimeMessage(props);
  }

  createAssistantMessage(content: string = '', status: MessageStatus = 'connecting', extra: Partial<BaseMessageProps> = {}): RuntimeMessage {
    const props: BaseMessageProps & { status: MessageStatus } = {
      id: extra.id || `msg-${Date.now()}-response`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      status,
      ...extra,
    };
    return new RuntimeMessage(props);
  }

  createSystemMessage(content: string, extra: Partial<BaseMessageProps> = {}): RuntimeMessage {
    const props: BaseMessageProps & { status: MessageStatus } = {
      id: extra.id || `sys-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      status: 'stable',
      ...extra,
    };
    return new RuntimeMessage(props);
  }

  createClientNoticeMessage(
    content: string,
    noticeType: 'error' | 'warning' | 'info' = 'error',
    errorCode?: string
  ): RuntimeMessage {
    const props: BaseMessageProps & { status: MessageStatus } = {
      id: `notice-${Date.now()}`,
      role: 'client-notice',
      content,
      timestamp: Date.now(),
      status: 'stable',
      noticeType,
      errorCode,
    };
    return new RuntimeMessage(props);
  }

  // 便捷方法：创建并添加消息
  addUserMessage(content: string, status: MessageStatus = 'stable', extra: Partial<BaseMessageProps> = {}) {
    const msg = this.createUserMessage(content, status, extra);
    this.addMessage(msg);
    return msg;
  }

  addAssistantMessage(content: string = '', status: MessageStatus = 'connecting', extra: Partial<BaseMessageProps> = {}) {
    const msg = this.createAssistantMessage(content, status, extra);
    this.addMessage(msg);
    return msg;
  }

  addSystemMessage(content: string, extra: Partial<BaseMessageProps> = {}) {
    const msg = this.createSystemMessage(content, extra);
    this.addMessage(msg);
    return msg;
  }

  addClientNoticeMessage(content: string, noticeType: 'error' | 'warning' | 'info' = 'error', errorCode?: string) {
    const msg = this.createClientNoticeMessage(content, noticeType, errorCode);
    this.addMessage(msg);
    return msg;
  }

  // 过滤方法
  filterForLLM(): RuntimeMessage[] {
    return this.messages.filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
  }

  filterForPersist(): RuntimeMessage[] {
    return this.messages.filter(m => m.role !== 'client-notice');
  }

  // 设置保存回调
  setSaveCallback(saveChat: () => void) {
    this.saveChat = saveChat;
  }
}
