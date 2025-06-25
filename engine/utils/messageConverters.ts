// engine/utils/messageConverters.ts
// 统一管理所有消息类型转换器
import type { RuntimeMessage, ChatMessage } from '../types/chat';

export const ChatMessageConverter = {
  // RuntimeMessage[] → ChatMessage[]
  toPersisted(messages: RuntimeMessage[]): ChatMessage[] {
    // 只保留 user/assistant/system/tool 类型并去除 status 字段
    return messages
      .filter(m =>
        m.role === 'user' || m.role === 'assistant' || m.role === 'system' || m.role === 'tool'
      )
      .map(({ status, ...msg }) => msg) as ChatMessage[];
  },
  // ChatMessage[] → RuntimeMessage[]
  toRuntime(messages: ChatMessage[]): RuntimeMessage[] {
    return messages.map(m => ({ ...m, status: 'stable' }));
  }
};

// 你可以继续为其它消息形态定义类似的转换器对象
