import { create } from 'zustand';
import type { RuntimeMessage, MessageStatus, RuntimeChatState } from '@/types/chat';
// 由于聊天时具有多种特殊情况，例如网络错误，大模型错误，因此设计额外的状态管理
interface ChatRuntimeState {
  // 连接状态
  isGenerating: boolean;
  abortController: AbortController | null;
  
  // 消息状态
  runtimeMessages: Record<string, RuntimeMessage>;
  setMessageStatus: (messageId: string, status: MessageStatus) => void;
  
  // 运行时聊天状态
  runtimeStates: Record<string, RuntimeChatState>;
  setRuntimeState: (chatId: string, state: Partial<RuntimeChatState>) => void;
  
  // 清理方法
  clearRuntimeState: (chatId: string) => void;
  clearAllRuntimeStates: () => void;
}

export const useChatRuntimeStore = create<ChatRuntimeState>((set) => ({
  // 初始状态
  isGenerating: false,
  abortController: null,
  runtimeMessages: {},
  runtimeStates: {},
  
  // 消息状态管理
  setMessageStatus: (messageId: string, status: MessageStatus) => {
    set((state) => ({
      runtimeMessages: {
        ...state.runtimeMessages,
        [messageId]: {
          ...(state.runtimeMessages[messageId] || {}),
          status
        }
      }
    }));
  },
  
  // 运行时状态管理
  setRuntimeState: (chatId: string, newState: Partial<RuntimeChatState>) => {
    set((state) => ({
      runtimeStates: {
        ...state.runtimeStates,
        [chatId]: {
          ...(state.runtimeStates[chatId] || {
            isGenerating: false,
            currentMessageId: null,
            abortController: null
          }),
          ...newState
        }
      }
    }));
  },
  
  // 清理方法
  clearRuntimeState: (chatId: string) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [chatId]: removed, ...rest } = state.runtimeStates;
      return {
        runtimeStates: rest
      };
    });
  },
  
  clearAllRuntimeStates: () => {
    set({
      isGenerating: false,
      abortController: null,
      runtimeMessages: {},
      runtimeStates: {}
    });
  }
}));
