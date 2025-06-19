import type { ChatInfo, ChatData } from '@/types/chat'
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
    persistData(STORAGE_KEYS.CHAT_DATA_PREFIX + chatId, data, this.storage)
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
