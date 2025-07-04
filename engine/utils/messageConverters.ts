// engine/utils/messageConverters.ts
// 统一管理所有消息类型转换器
import type { ChatMessage, EnrichedMessage } from '../types/chat';

export const ChatMessageConverter = {
  // EnrichedMessage[] → ChatMessage[]
  toPersisted(messages: EnrichedMessage[]): ChatMessage[] {
    // 只保留 user/assistant/system/tool 类型并去除 metadata 字段
    return messages
      .filter(m =>
        m.role === 'user' || m.role === 'assistant' || m.role === 'system' || m.role === 'tool'
      )
      .map(({ id, timestamp, state, name, usage, ...msg }) => msg) as ChatMessage[];
  },
  // ChatMessage[] → EnrichedMessage[]
  toRuntime(messages: ChatMessage[]): EnrichedMessage[] {
    return messages.map(m => ({ 
      ...m, 
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      timestamp: Date.now()
    }));
  }
};

// 你可以继续为其它消息形态定义类似的转换器对象
