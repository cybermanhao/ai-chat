// engine/managers/MessageManager.ts
// 统一的消息管理器，整合消息创建和管理功能
import type { MessageStatus } from '../types/chat';
import type { RuntimeMessage, UserMessage, AssistantMessage, SystemMessage, ClientNoticeMessage } from '../types/chat';

export class ChatMessageManager {
  private messages: RuntimeMessage[] = [];
  private saveChat: () => void;

  constructor(initialMessages: RuntimeMessage[] = [], saveChat?: () => void) {
    // 无条件深拷贝，彻底解冻所有嵌套对象，防止只读属性报错
    this.messages = JSON.parse(JSON.stringify(initialMessages));
    this.saveChat = saveChat || (() => {});
  }

  // 消息管理方法
  getMessages(): RuntimeMessage[] {
    return this.messages;
  }

  addMessage(msg: RuntimeMessage) {
    // 无条件深拷贝，防止外部传入 freeze 对象
    const safeMsg = JSON.parse(JSON.stringify(msg));
    this.messages.push(safeMsg);
    // saveChat 只在最终 onDone/onError/onAbort 时手动调用
  }

  updateLastMessage(patch: Partial<RuntimeMessage>) {
    if (this.messages.length === 0) return;
    let last = this.messages[this.messages.length - 1];
    if (Object.isFrozen(last)) {
      // 兜底：替换为可写副本
      last = JSON.parse(JSON.stringify(last));
      this.messages[this.messages.length - 1] = last;
    }
    Object.assign(last, patch);
    // saveChat 只在最终 onDone/onError/onAbort 时手动调用
  }

  clearMessages() {
    this.messages = [];
    this.saveChat();
  }

  // 静态工厂方法，便于 redux/thunk 直接复用
  static createUserMessage(content: string, status: MessageStatus = 'stable', extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
      status,
      ...extra,
    } as UserMessage & { status: MessageStatus };
  }

  static createAssistantMessage(content: string = '', status: MessageStatus = 'connecting', extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `msg-${Date.now()}-response`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
      status,
      ...extra,
    } as AssistantMessage & { status: MessageStatus };
  }

  static createSystemMessage(content: string, extra: Partial<RuntimeMessage> = {}): RuntimeMessage {
    return {
      id: extra.id || `sys-${Date.now()}`,
      role: 'system',
      content,
      timestamp: Date.now(),
      status: 'stable',
      ...extra,
    } as SystemMessage & { status: MessageStatus };
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
      status: 'stable',
      noticeType,
      errorCode,
    } as ClientNoticeMessage;
  }

  // 便捷方法：创建并添加消息
  addUserMessage(content: string, status: MessageStatus = 'stable', extra: Partial<RuntimeMessage> = {}) {
    const msg = ChatMessageManager.createUserMessage(content, status, extra);
    this.addMessage(msg);
    return msg;
  }

  addAssistantMessage(content: string = '', status: MessageStatus = 'connecting', extra: Partial<RuntimeMessage> = {}) {
    const msg = ChatMessageManager.createAssistantMessage(content, status, extra);
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