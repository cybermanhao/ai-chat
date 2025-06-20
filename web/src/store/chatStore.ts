// web/src/store/chatStore.ts
import { chatStoreDefinition } from '@engine/store/chatStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/config/storage';

// 绑定 zustand，导出 useChatStore
export const useChatStore = create(
  persist(
    chatStoreDefinition,
    {
      name: STORAGE_KEYS.CHAT_LIST,
      // 可根据需要自定义 partialize 只持久化 chats/currentId/messages
      partialize: (state: any) => ({
        chats: state.chats,
        currentId: state.currentId,
        messages: state.messages,
      })
    }
  )
);
