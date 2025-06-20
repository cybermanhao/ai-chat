import type { ChatInfo, ChatMessage } from '@/types/chat';

export interface ChatStorage {
  saveChat: (chat: ChatInfo) => Promise<void>;
  loadChat: (chatId: string) => Promise<ChatInfo | null>;
  saveMessages: (chatId: string, messages: ChatMessage[]) => Promise<void>;
  loadMessages: (chatId: string) => Promise<ChatMessage[]>;
  deleteChat: (chatId: string) => Promise<void>;
}

class LocalChatStorage implements ChatStorage {
  private readonly CHAT_KEY_PREFIX = 'chat:';
  private readonly MESSAGE_KEY_PREFIX = 'messages:';
  
  async saveChat(chat: ChatInfo): Promise<void> {
    const key = this.CHAT_KEY_PREFIX + chat.id;
    await localStorage.setItem(key, JSON.stringify(chat));
  }

  async loadChat(chatId: string): Promise<ChatInfo | null> {
    const key = this.CHAT_KEY_PREFIX + chatId;
    const data = await localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  async saveMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    const key = this.MESSAGE_KEY_PREFIX + chatId;
    await localStorage.setItem(key, JSON.stringify(messages));
  }

  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const key = this.MESSAGE_KEY_PREFIX + chatId;
    const data = await localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async deleteChat(chatId: string): Promise<void> {
    const chatKey = this.CHAT_KEY_PREFIX + chatId;
    const messageKey = this.MESSAGE_KEY_PREFIX + chatId;
    await Promise.all([
      localStorage.removeItem(chatKey),
      localStorage.removeItem(messageKey)
    ]);
  }
}

export const chatStorage = new LocalChatStorage();
