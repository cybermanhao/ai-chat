import { create } from 'zustand';
import { chatRuntimeStoreDefinition } from '@engine/store/chatRuntimeStore';

export const useChatRuntimeStore = create(chatRuntimeStoreDefinition);

export type { ChatRuntimeState } from '@engine/store/chatRuntimeStore';
