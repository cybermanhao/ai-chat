// web/src/store/chatStore.ts
import { chatStoreDefinition } from '@engine/store/chatStore';
import { create } from 'zustand';

// 绑定 zustand，导出 useChatStore
export const useChatStore = create(chatStoreDefinition);
