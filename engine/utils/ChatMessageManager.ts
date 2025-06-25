// engine/utils/ChatMessageManager.ts
import type { RuntimeMessage } from '../types/chat';

export class ChatMessageManager {
  private messages: RuntimeMessage[];
  private saveChat: () => void;

  constructor(initialMessages: RuntimeMessage[], saveChat: () => void) {
    this.messages = initialMessages;
    this.saveChat = saveChat;
  }

  getMessages() {
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
}
