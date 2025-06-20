// engine/store/chatRuntimeStore.ts
// 多端同构 ChatRuntime store 纯逻辑定义
import type { RuntimeMessage, MessageStatus, RuntimeChatState } from '../types/chat';

export interface ChatRuntimeState {
  isGenerating: boolean;
  abortController: AbortController | null;
  runtimeMessages: Record<string, RuntimeMessage>;
  setMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (params: {
    messageId: string;
    content: string;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
  }) => void;
  runtimeStates: Record<string, RuntimeChatState>;
  setRuntimeState: (chatId: string, state: Partial<RuntimeChatState>) => void;
  clearRuntimeState: (chatId: string) => void;
  clearAllRuntimeStates: () => void;
}

export const useChatRuntimeStore = (set: any, get: any) => ({
  isGenerating: false,
  abortController: null,
  runtimeMessages: {},
  runtimeStates: {},

  setMessageStatus: (messageId: string, status: MessageStatus) => {
    set((state: ChatRuntimeState) => ({
      runtimeMessages: {
        ...state.runtimeMessages,
        [messageId]: {
          ...(state.runtimeMessages[messageId] || {}),
          status
        }
      }
    }));
  },

  updateMessageContent: (params: {
    messageId: string;
    content: string;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
  }) => {
    const { messageId, content, reasoning_content, tool_content, observation_content, thought_content } = params;
    set((state: ChatRuntimeState) => {
      const message = state.runtimeMessages[messageId];
      if (!message) {
        return state;
      }
      return {
        runtimeMessages: {
          ...state.runtimeMessages,
          [messageId]: {
            ...message,
            content,
            ...(reasoning_content !== undefined ? { reasoning_content } : {}),
            ...(tool_content !== undefined ? { tool_content } : {}),
            ...(observation_content !== undefined ? { observation_content } : {}),
            ...(thought_content !== undefined ? { thought_content } : {})
          }
        }
      };
    });
  },

  setRuntimeState: (chatId: string, newState: Partial<RuntimeChatState>) => {
    set((state: ChatRuntimeState) => ({
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

  clearRuntimeState: (chatId: string) => {
    set((state: ChatRuntimeState) => {
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
});

// 导出 storeDefinition 供多端绑定
export const chatRuntimeStoreDefinition = useChatRuntimeStore;
