import { useCallback } from 'react';
import { useStore } from 'zustand';
import { useChatStore } from '@/store/chatStore';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import type { ChatMessage } from '@/types/chat';
import { MessageManager } from '@engine/utils/messageManager';
import { defaultChatSetting } from '@/config/defaultChatSetting';

// web 层持久化服务实例
const chatStorage = new ChatStorageService(getStorage());

// 包裹 engine 层 hook，监听 stable 状态写入
export function useChatMessages(chatId: string) {
  // 响应式获取当前聊天的消息
  const messages = useStore(useChatStore, s => s.messages);
  // isGenerating 需由外部状态管理（如 zustand 或父组件），此处仅占位
  const isGenerating = false;
  const setIsGenerating = () => {};

  // 允许所有消息类型通过 addMessage
  const addMessage = useCallback((msg: ChatMessage) => {
    // chatStore 的 addMessage 只支持 user/assistant/system，其他类型直接 setMessages
    if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
      useChatStore.getState().addMessage({
        role: msg.role,
        content: msg.content,
        status: msg.status,
        name: (msg as { name?: string }).name
      });
    } else {
      // 其它类型直接拼接到 messages
      const msgs = useChatStore.getState().messages;
      useChatStore.getState().setMessages([...msgs, msg]);
    }
  }, []);

  // updateLastMessage 只 patch user/assistant/system，setMessages 时断言为 ChatMessage[]
  const updateLastMessage = useCallback((update: Partial<ChatMessage>) => {
    const msgs = useChatStore.getState().messages;
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      // 允许所有类型消息被 patch
      const patched = { ...last, ...update };
      const newMessages = [...msgs.slice(0, -1), patched] as ChatMessage[];
      useChatStore.getState().setMessages(newMessages);
      // 仅在消息状态为 stable 时写入本地存储
      if (update.status === 'stable' && chatId) {
        const chatData = chatStorage.getChatData(chatId);
        // 使用 MessageManager 过滤可持久化消息
        // 只持久化 user/assistant/system/tool 类型，去除 status 字段
        const chatMessages = MessageManager.filterForPersist(newMessages)
          .map((msg: ChatMessage) => {
            if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system' || msg.role === 'tool') {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { status, ...chatMessage } = msg;
              return chatMessage;
            }
            return msg;
          });
        // 完整默认 ChatSetting
        chatStorage.saveChatData(chatId, {
          info: chatData?.info || {
            id: chatId,
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: chatMessages.length
          },
          messages: chatMessages,
          settings: chatData?.settings || defaultChatSetting,
          updateTime: Date.now()
        });
      }
    }
  }, [chatId]);

  // 移除 useEffect 自动持久化，避免死循环

  return {
    messages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage
  };
}

// 兼容原有导出
export * from '@engine/hooks/useChatMessages';