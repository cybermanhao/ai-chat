// web/src/store/chatStore.ts
import PubStore from 'zustand-pub';
import { chatStoreDefinition } from '@engine/store/chatStore';

const pubStore = new PubStore('chat');
export const useChatStore = pubStore.defineStore('chat', chatStoreDefinition);
