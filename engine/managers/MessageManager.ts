
// @ts-nocheck
// 废弃文件 - 不再维护类型检查
// 
// engine/managers/MessageManager.ts
// 统一的消息管理器，整合消息创建和管理功能
import type { MessageStatus } from '../types/chat';
import type { RuntimeMessage, UserMessage, AssistantMessage, SystemMessage, ClientNoticeMessage } from '../types/chat';

export class ChatMessageManager {
  private messages: RuntimeMessage[] = [];
  private saveChat: () => void;

  constructor(initialMessages: RuntimeMessage[] = [], saveChat?: () => void) {
    // 只做快照管理，不做流程/渲染状态
    this.messages = JSON.parse(JSON.stringify(initialMessages));
    this.saveChat = saveChat || (() => {});
  }

  getMessages(): RuntimeMessage[] {
    return this.messages;
  }

  addMessage(msg: RuntimeMessage) {
    const safeMsg = JSON.parse(JSON.stringify(msg));
    this.messages.push(safeMsg);
  }

  updateLastMessage(patch: Partial<RuntimeMessage>) {
    if (this.messages.length === 0) return;
    let last = this.messages[this.messages.length - 1];
    if (Object.isFrozen(last)) {
      last = JSON.parse(JSON.stringify(last));
      this.messages[this.messages.length - 1] = last;
    }
    Object.assign(last, patch);
  }

  clearMessages() {
    this.messages = [];
    this.saveChat();
  }

  // 工厂方法只生成内容快照，流程状态由 glue 层补充
  static createUserMessage(content: string, extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      ...extra,
    } as RuntimeMessage;
  }

  static createAssistantMessage(content: string = '', extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `msg-${Date.now()}-response`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      ...extra,
    } as RuntimeMessage;
  }

  static createSystemMessage(content: string, extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `sys-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      ...extra,
    } as RuntimeMessage;
  }

  static createClientNoticeMessage(
    content: string,
    noticeType: 'error' | 'warning' | 'info' = 'error',
    errorCode?: string
  ): RuntimeMessage {
    return {
      id: `notice-${Date.now()}`,
      role: 'client-notice',
      content,
      timestamp: Date.now(),
      noticeType,
      errorCode,
    } as RuntimeMessage;
  }

  // 便捷方法：创建并添加消息
  addUserMessage(content: string, extra: Partial<RuntimeMessage> = {}) {
    const msg = ChatMessageManager.createUserMessage(content, extra);
    this.addMessage(msg);
    return msg;
  }

  addAssistantMessage(content: string = '', extra: Partial<RuntimeMessage> = {}) {
    const msg = ChatMessageManager.createAssistantMessage(content, extra);
    this.addMessage(msg);
    return msg;
  }

  addSystemMessage(content: string, extra: Partial<RuntimeMessage> = {}) {
    const msg = ChatMessageManager.createSystemMessage(content, extra);
    this.addMessage(msg);
    return msg;
  }

  addClientNoticeMessage(content: string, noticeType: 'error' | 'warning' | 'info' = 'error', errorCode?: string) {
    const msg = ChatMessageManager.createClientNoticeMessage(content, noticeType, errorCode);
    this.addMessage(msg);
    return msg;
  }

  filterForLLM(): RuntimeMessage[] {
    return this.messages.filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
  }

  filterForPersist(): RuntimeMessage[] {
    return this.messages.filter(m => m.role !== 'client-notice');
  }

  setSaveCallback(saveChat: () => void) {
    this.saveChat = saveChat;
  }
}