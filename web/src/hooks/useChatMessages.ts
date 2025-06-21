import { useEffect } from 'react';
import { useChatMessages as useEngineChatMessages } from '@engine/hooks/useChatMessages';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import type { RuntimeMessage, ChatMessage } from '@/types/chat';

// web 层持久化服务实例
const chatStorage = new ChatStorageService(getStorage());

// 包裹 engine 层 hook，监听 stable 状态写入
export function useChatMessages(chatId: string) {
  const result = useEngineChatMessages(chatId);
  const { messages } = result;

  useEffect(() => {
    if (!chatId || !messages?.length) return;
    const last = messages[messages.length - 1];
    // 仅在最后一条消息为 stable 时写入
    if (last.status === 'stable') {
      // 只持久化标准 ChatMessage 类型（排除 client-notice 且去除 status 字段）
      const pureMessages: ChatMessage[] = messages
        .filter((msg: RuntimeMessage) => msg.role !== 'client-notice')
        .map((msg) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { status, ...rest } = msg;
          return rest as ChatMessage;
        });
      chatStorage.saveMessages(chatId, pureMessages);
    }
  }, [chatId, messages]);

  return result;
}

// 兼容原有导出
export * from '@engine/hooks/useChatMessages';