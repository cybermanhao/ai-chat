import type { MessageStatus } from './chat';

// 基础消息属性接口
export interface BaseMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool' | 'client-notice';
  content: string;
  timestamp: number;
  status?: MessageStatus;
  name?: string;
  [key: string]: any;
}

// 基础消息类
export class BaseMessage {
  id!: string;
  role!: string;
  content!: string;
  timestamp!: number;
  status?: MessageStatus;
  name?: string;
  [key: string]: any;

  constructor(props: BaseMessageProps) {
    Object.assign(this, props);
  }

  updateContent(newContent: string) {
    this.content = newContent;
  }

  updateStatus(newStatus: MessageStatus) {
    this.status = newStatus;
  }
}

// 聊天消息类（继承自BaseMessage）
export class ChatMessage extends BaseMessage {
  constructor(props: BaseMessageProps) {
    super(props);
  }
}

// 运行时消息类（继承自ChatMessage，必须有status）
export class RuntimeMessage extends ChatMessage {
  declare status: MessageStatus;

  constructor(props: BaseMessageProps & { status: MessageStatus }) {
    super(props);
    this.status = props.status;
  }
}

// 统一的消息管理器
export class MessageManager {
  protected messageMap = new Map<string, ChatMessage>();

  constructor(initialMessages: BaseMessageProps[] = []) {
    initialMessages.forEach(props => {
      const msg = new ChatMessage(props);
      this.messageMap.set(msg.id, msg);
    });
  }

  createMessage(props: BaseMessageProps): ChatMessage {
    const msg = new ChatMessage(props);
    this.messageMap.set(msg.id, msg);
    return msg;
  }

  createRuntimeMessage(props: BaseMessageProps & { status: MessageStatus }): RuntimeMessage {
    const msg = new RuntimeMessage(props);
    this.messageMap.set(msg.id, msg);
    return msg;
  }

  getMessage(id: string): ChatMessage | undefined {
    return this.messageMap.get(id);
  }

  updateMessage(id: string, patch: Partial<BaseMessageProps>) {
    const msg = this.messageMap.get(id);
    if (msg) Object.assign(msg, patch);
  }

  deleteMessage(id: string) {
    this.messageMap.delete(id);
  }

  getAllMessages(): ChatMessage[] {
    return Array.from(this.messageMap.values());
  }

  clearMessages() {
    this.messageMap.clear();
  }

  // 静态方法：过滤和转换
  static filterForLLM(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
  }

  static filterForPersist(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m => m.role !== 'client-notice');
  }
} 