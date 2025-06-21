import type { ChatInfo, ChatMessage, ChatData, AssistantMessage } from '@/types/chat'
import { persistData, loadPersistedData, type Storage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storage'

/**
 * 聊天数据存储服务
 * 管理聊天列表和聊天内容的本地存储
 */
export class ChatStorageService {
  private storage: Storage

  constructor(storage: Storage) {
    this.storage = storage
  }

  // 获取聊天列表
  getChatList(): ChatInfo[] {
    return loadPersistedData<ChatInfo[]>(STORAGE_KEYS.CHAT_LIST, [], this.storage)
  }

  // 保存聊天列表
  saveChatList(list: ChatInfo[]): void {
    persistData(STORAGE_KEYS.CHAT_LIST, list, this.storage)
  }

  // 加载聊天消息
  async loadMessages(chatId: string): Promise<ChatMessage[]> {
    const data = this.getChatData(chatId)
    return data?.messages || []
  }
  // 保存聊天消息
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
    }
    data.messages = messages
    data.updateTime = Date.now()
    data.info.messageCount = messages.length
    data.info.updateTime = Date.now()
    this.saveChatData(chatId, data)
  }

  // 更新聊天信息
  async saveChatInfo(chatId: string, info: Partial<ChatInfo>): Promise<void> {
    const list = this.getChatList()
    const updatedList = list.map(chat => 
      chat.id === chatId ? { ...chat, ...info } : chat
    )
    this.saveChatList(updatedList)
  }

  // 删除聊天
  async deleteChat(chatId: string): Promise<void> {
    const list = this.getChatList()
    this.saveChatList(list.filter(chat => chat.id !== chatId))
    this.deleteChatData(chatId)
  }

  // 获取某个聊天的完整数据
  getChatData(chatId: string): ChatData | null {
    return loadPersistedData<ChatData | null>(
      STORAGE_KEYS.CHAT_DATA_PREFIX + chatId,
      null,
      this.storage
    )
  }
  // 保存聊天数据
  saveChatData(chatId: string, data: ChatData): void {

    persistData(STORAGE_KEYS.CHAT_DATA_PREFIX + chatId, data, this.storage);
  }

  // 删除聊天数据
  deleteChatData(chatId: string): void {
    this.storage.removeItem(STORAGE_KEYS.CHAT_DATA_PREFIX + chatId)
  }

  // 获取当前选中的聊天ID
  getCurrentChatId(): string | null {
    return loadPersistedData<string | null>(STORAGE_KEYS.CURRENT_CHAT, null, this.storage)
  }

  // 保存当前选中的聊天ID
  saveCurrentChatId(chatId: string | null): void {
    persistData(STORAGE_KEYS.CURRENT_CHAT, chatId, this.storage)
  }
}

// 创建默认实例
export const chatStorage = new ChatStorageService(localStorage)
