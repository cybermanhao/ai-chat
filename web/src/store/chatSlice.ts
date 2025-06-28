import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { ChatInfo, ChatData, ChatMessage } from '@engine/types/chat';
import { createLLMStreamManager } from '@engine/stream/streamManager';
import { llms } from '@engine/utils/llms';

interface ChatState {
  chatList: ChatInfo[];
  chatData: Record<string, ChatData>;
  currentChatId: string | null;
  isGenerating: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chatList: [],
  chatData: {},
  currentChatId: null,
  isGenerating: false,
  error: null,
};

// 重构后的异步 action：流式发送消息
export const sendMessageAsync = createAsyncThunk<
  void,
  { chatId: string; input: string },
  { state: { chat: ChatState; llmConfig: any } }
>(
  'chat/sendMessageAsync',
  async ({ chatId, input }, { dispatch, getState }) => {
    console.log('[chatSlice] sendMessageAsync called', { chatId, input });
    dispatch(setIsGenerating(true));
    try {
      const state = getState();
      const chatData = state.chat.chatData[chatId];
      const messages = chatData?.messages || [];
      const llmConfig = state.llmConfig;
      const activeLLMConfig = llms.find(l => l.id === llmConfig.activeLLMId);
      const currentApiKey = llmConfig.apiKeys[llmConfig.activeLLMId] || '';
      const chatConfig = chatData?.settings || {};
      // 追加用户消息
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: input,
        timestamp: Date.now(),
        status: 'stable',
      };
      dispatch(addMessage({ chatId, message: userMessage }));
      // 通过 streamManager 进行流式 glue
      const streamManager = createLLMStreamManager({
        initialMessages: [
          ...messages.map(m => JSON.parse(JSON.stringify({ ...m, status: m.status || 'stable' }))),
          JSON.parse(JSON.stringify({ ...userMessage, status: userMessage.status || 'stable' }))
        ],
        currentConfig: {
          ...llmConfig,
          apiKey: currentApiKey,
        },
        activeLLMConfig,
        config: chatConfig,
        saveChat: () => {},
        mcpServiceInstance: undefined,
        activeServer: undefined,
        onAddMessage: (msg: ChatMessage) => {
          console.log('[chatSlice] onAddMessage', msg);
          dispatch(addMessage({ chatId, message: msg }));
        },
        onUpdateLastMessage: (patch: Partial<ChatMessage>) => {
          console.log('[chatSlice] onUpdateLastMessage', patch);
          dispatch({
          type: 'chat/updateLastAssistantMessage',
          payload: { chatId, message: patch },
          });
        },
        onError: (err: string) => dispatch(setError(err)),
      });
      console.log('[chatSlice] before streamManager.handleSend');
      await streamManager.handleSend(input, new AbortController().signal);
      console.log('[chatSlice] after streamManager.handleSend');
    } catch (e: any) {
      dispatch(setError(e.message || 'LLM error'));
    } finally {
      dispatch(setIsGenerating(false));
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<string>) => {
      const newChatId = uuidv4();
      const newChatInfo: ChatInfo = {
        id: newChatId,
        title: action.payload,
        createTime: Date.now(),
        updateTime: Date.now(),
        messageCount: 0,
      };
      state.chatList.unshift(newChatInfo);
      state.chatData[newChatId] = {
        info: newChatInfo,
        messages: [],
        updateTime: Date.now(),
        settings: {
          modelIndex: 0,
          systemPrompt: '',
          enableTools: [],
          temperature: 0.6,
          enableWebSearch: false,
          contextLength: 4,
          parallelToolCalls: true,
        },
      };
      state.currentChatId = newChatId;
    },
    deleteChat: (state, action: PayloadAction<string>) => {
      const chatIdToDelete = action.payload;
      state.chatList = state.chatList.filter(chat => chat.id !== chatIdToDelete);
      delete state.chatData[chatIdToDelete];
      if (state.currentChatId === chatIdToDelete) {
        state.currentChatId = state.chatList[0]?.id || null;
      }
    },
    renameChat: (state, action: PayloadAction<{ id: string; title: string }>) => {
      const { id, title } = action.payload;
      const chatInfo = state.chatList.find(chat => chat.id === id);
      if (chatInfo) {
        chatInfo.title = title;
        chatInfo.updateTime = Date.now();
      }
      const chatData = state.chatData[id];
      if (chatData) {
        chatData.info.title = title;
        chatData.updateTime = Date.now();
      }
    },
    setCurrentChat(state: ChatState, action: PayloadAction<string>) {
      state.currentChatId = action.payload;
      state.error = null;
    },
    setChatList(state: ChatState, action: PayloadAction<ChatInfo[]>) {
      state.chatList = action.payload;
    },
    setChatData(state: ChatState, action: PayloadAction<{ chatId: string; data: ChatData }>) {
      state.chatData[action.payload.chatId] = action.payload.data;
    },
    addMessage(state: ChatState, action: PayloadAction<{ chatId: string; message: ChatMessage }>) {
      const { chatId, message } = action.payload;
      state.chatData[chatId]?.messages.push(message);
    },
    setIsGenerating(state: ChatState, action: PayloadAction<boolean>) {
      state.isGenerating = action.payload;
    },
    setError(state: ChatState, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    // 新增：更新最后一条 assistant 消息
    updateLastAssistantMessage(state: ChatState, action: PayloadAction<{ chatId: string; message: ChatMessage }>) {
      const { chatId, message } = action.payload;
      const msgs = state.chatData[chatId]?.messages;
      if (msgs && msgs.length > 0) {
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            console.log('[chatSlice] updateLastAssistantMessage before', msgs[i]);
            msgs[i] = { ...msgs[i], ...message };
            console.log('[chatSlice] updateLastAssistantMessage after', msgs[i]);
            break;
          }
        }
      }
    },
  }
});

export const {
  addChat,
  deleteChat,
  renameChat,
  setCurrentChat,
  setChatList,
  setChatData,
  addMessage,
  setIsGenerating,
  setError,
  updateLastAssistantMessage,
} = chatSlice.actions;

export default chatSlice.reducer; 