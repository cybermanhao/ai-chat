// web/src/store/chatStore.ts
import { create } from 'zustand';
import { chatStoreDefinition } from '@engine/store/chatStore';

export const useChatStore = create(chatStoreDefinition);
