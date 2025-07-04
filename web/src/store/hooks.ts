// web/src/store/hooks.ts
// 提供类型安全的 Redux hooks

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// 使用预设类型的 dispatch hook
export const useAppDispatch = () => useDispatch<AppDispatch>();

// 使用预设类型的 selector hook
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// 常用的选择器 hooks，提供更好的类型推断
export const useChatData = (chatId: string | null) => {
  return useAppSelector(state => 
    chatId ? state.chat.chatData[chatId] : null
  );
};

export const useCurrentChat = () => {
  const currentChatId = useAppSelector(state => state.chat.currentChatId);
  const chatData = useChatData(currentChatId);
  return { currentChatId, chatData };
};

export const useChatSettings = (chatId: string | null) => {
  return useAppSelector(state => 
    chatId ? state.chat.chatData[chatId]?.settings : null
  );
};

export const useLLMConfig = () => {
  return useAppSelector(state => state.llmConfig);
};

export const useIsGenerating = (chatId: string | null) => {
  return useAppSelector(state => 
    chatId ? state.chat.isGenerating[chatId] || false : false
  );
};

export const useMessageCardStatus = (chatId: string | null) => {
  return useAppSelector(state => 
    chatId ? state.chat.messageCardStatus[chatId] || 'stable' : 'stable'
  );
};

// 组合 hook：获取聊天相关的所有状态
export const useChatState = (chatId: string | null) => {
  const chatData = useChatData(chatId);
  const chatSettings = useChatSettings(chatId);
  const isGenerating = useIsGenerating(chatId);
  const messageCardStatus = useMessageCardStatus(chatId);
  
  return {
    chatData,
    chatSettings,
    isGenerating,
    messageCardStatus,
    messages: chatData?.messages || [],
  };
};
