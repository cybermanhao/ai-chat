import type { ChatMessage, MessageRole } from '../types/chat';

/**
 * 消息管理器：负责消息的过滤、转换、持久化等逻辑
 */
export class MessageManager {
  /**
   * 过滤出可用于 LLM 请求的消息（仅 user/assistant/system）
   */
  static filterForLLM(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
  }

  /**
   * 过滤出可持久化的消息（如需排除 client-notice，可在此处理）
   */
  static filterForPersist(messages: ChatMessage[]): ChatMessage[] {
    // 默认全部持久化，如需排除 client-notice 可加条件
    return messages.filter(m => m.role !== 'client-notice');
  }

  /**
   * 保存消息到本地存储
   */
  static save(storage: { saveMessages: (chatId: string, msgs: ChatMessage[]) => void }, chatId: string, messages: ChatMessage[]) {
    const filtered = this.filterForPersist(messages);
    storage.saveMessages(chatId, filtered);
  }

  /**
   * 加载消息（可加转换）
   */
  static load(storage: { loadMessages: (chatId: string) => ChatMessage[] }, chatId: string): ChatMessage[] {
    return storage.loadMessages(chatId) || [];
  }
}
