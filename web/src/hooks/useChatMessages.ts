import { useCallback } from 'react';
import { useStore } from 'zustand';
import { useChatStore } from '@/store/chatStore';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import type { ChatMessage } from '@/types/chat';

// web 层持久化服务实例
const chatStorage = new ChatStorageService(getStorage());

// 包裹 engine 层 hook，监听 stable 状态写入
export function useChatMessages(chatId: string) {
  // 响应式获取当前聊天的消息
  const messages = useStore(useChatStore, s => s.messages);
  // isGenerating 需由外部状态管理（如 zustand 或父组件），此处仅占位
  const isGenerating = false;
  const setIsGenerating = (_v: boolean) => {};

  // 只允许 user/assistant/system 消息通过 addMessage
  const addMessage = useCallback((msg: ChatMessage) => {
    if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
      useChatStore.getState().addMessage({
        role: msg.role,
        content: msg.content,
        status: msg.status,
        name: (msg as { name?: string }).name
      });
    }
  }, []);

  // updateLastMessage 只 patch user/assistant/system，setMessages 时断言为 ChatMessage[]
  const updateLastMessage = useCallback((update: Partial<ChatMessage>) => {
    const msgs = useChatStore.getState().messages;
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.role === 'user' || last.role === 'assistant' || last.role === 'system') {
        const patched = { ...last, ...update };
        useChatStore.getState().setMessages([
          ...msgs.slice(0, -1),
          patched
        ] as ChatMessage[]);
      }
    }
  }, []);

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