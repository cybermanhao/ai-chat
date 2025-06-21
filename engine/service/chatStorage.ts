// engine/service/chatStorage.ts
// 多端同构聊天存储服务，适用于多端 store
import type { ChatInfo, ChatMessage, ChatData } from '../types/chat';
import type { StorageLike } from '../utils/storage';

export class ChatStorageService {
  private storage: StorageLike;
  constructor(storage: StorageLike) {
    this.storage = storage;
  }
  getChatList(): ChatInfo[] {
    const raw = this.storage.getItem('chat_list');
    return raw ? JSON.parse(raw) : [];
  }
  saveChatList(list: ChatInfo[]): void {
    this.storage.setItem('chat_list', JSON.stringify(list));
  }
  getChatData(chatId: string): ChatData | null {
    const raw = this.storage.getItem('chat_data_' + chatId);
    return raw ? JSON.parse(raw) : null;
  }
  saveChatData(chatId: string, data: ChatData): void {
    this.storage.setItem('chat_data_' + chatId, JSON.stringify(data));
  }
  deleteChatData(chatId: string): void {
    this.storage.removeItem('chat_data_' + chatId);
  }
  getCurrentChatId(): string | null {
    return this.storage.getItem('current_chat_id');
  }
  saveCurrentChatId(chatId: string | null): void {
    if (chatId) {
      this.storage.setItem('current_chat_id', chatId);
    } else {
      this.storage.removeItem('current_chat_id');
    }
  }
  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const data = this.getChatData(chatId);
    return data?.messages || [];
  }
  async saveMessages(chatId: string, messages: ChatMessage[]): Promise<void> {
    const existingData = this.getChatData(chatId);
    const data: ChatData = existingData || {
      info: {
        id: chatId,
        title: '新对话',
        createTime: Date.now(),
        updateTime: Date.now(),
        messageCount: messages.length,
      },
      messages: [],
      settings: {
        modelIndex: 0,
        systemPrompt: '',
        enableTools: [],
        temperature: 0.7,
        enableWebSearch: false,
        contextLength: 2000,
        parallelToolCalls: false
      },
      updateTime: Date.now()
    };
    data.messages = messages;
    data.updateTime = Date.now();
    data.info.messageCount = messages.length;
    data.info.updateTime = Date.now();
    this.saveChatData(chatId, data);
  }
  async saveChatInfo(chatId: string, info: Partial<ChatInfo>): Promise<void> {
    const list = this.getChatList();
    const updatedList = list.map(chat => chat.id === chatId ? { ...chat, ...info } : chat);
    this.saveChatList(updatedList);
  }
  async deleteChat(chatId: string): Promise<void> {
    const list = this.getChatList();
    this.saveChatList(list.filter(chat => chat.id !== chatId));
    this.deleteChatData(chatId);
  }
}
