import { create } from 'zustand';
import { WebChatSessionManager } from '@/chat/WebChatSession';

const manager = new WebChatSessionManager();

export const useChatSessionStore = create((set, get) => ({
  manager,
  get activeSession() { return manager.getActiveSession(); },
  get messages() { return manager.getActiveSession()?.getMessages() || []; },
  get isGenerating() { return manager.getActiveSession()?.getIsGenerating() || false; },
  setActiveChat: (id: string) => {
    manager.setActiveSession(id);
    set({}); // 触发响应式更新
  },
  // 这里可以添加 UI 副作用，如自动保存、loading、弹窗等
})); 