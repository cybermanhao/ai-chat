import PubStore from 'zustand-pub';
import { chatRuntimeStoreDefinition } from '@engine/store/chatRuntimeStore';

const pubStore = new PubStore('chatRuntime');
export const useChatRuntimeStore = pubStore.defineStore('chatRuntime', chatRuntimeStoreDefinition);

export type { ChatRuntimeState } from '@engine/store/chatRuntimeStore';
