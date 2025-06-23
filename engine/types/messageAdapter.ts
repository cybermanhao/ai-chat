import type { ChatMessage } from './chat';

/**
 * 消息适配器接口：不同 LLM/存储/导出场景可实现自己的适配器
 */
export interface MessageAdapter {
  /**
   * 过滤/转换为 LLM 请求支持的消息格式
   */
  filterForLLM(messages: ChatMessage[]): ChatMessage[];

  /**
   * 过滤/转换为本地持久化需要的消息格式
   */
  filterForPersist(messages: ChatMessage[]): ChatMessage[];
}

/**
 * DeepSeek/OpenAI 兼容适配器
 */
export class OpenAICompatibleMessageAdapter implements MessageAdapter {
  filterForLLM(messages: ChatMessage[]): ChatMessage[] {
    return messages.filter(m =>
      m.role === 'user' || m.role === 'assistant' || m.role === 'system'
    );
  }
  filterForPersist(messages: ChatMessage[]): ChatMessage[] {
    // 默认全部持久化，如需排除 client-notice 可加条件
    return messages.filter(m => m.role !== 'client-notice');
  }
}
