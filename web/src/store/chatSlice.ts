import { createSlice, createAction } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { ChatInfo, ChatData, EnrichedMessage, IMessageCardStatus } from '@engine/types/chat';
import { llms } from '@engine/utils/llms';
import { autoSaveChatData } from '@/utils/chatStorage';
import type { ChatStorageData } from '@/utils/chatStorage';

// 工具调用状态接口
export interface ToolCallState {
  id: string;
  name: string;
  args: any;
  status: 'calling' | 'success' | 'error';
  result?: string;
  error?: string;
  timestamp: number;
}

// 新的 ChatState 只负责快照/历史，不含 runtime 状态
interface ChatState {
  chatList: ChatInfo[];
  chatData: Record<string, ChatData>;
  currentChatId: string | null;
  error: string | null;
  // 运行时生成状态，按 chatId 维护
  isGenerating: { [chatId: string]: boolean };
  // MessageCard 状态，按 chatId 维护
  messageCardStatus: { [chatId: string]: IMessageCardStatus };
  // 工具调用状态，按 chatId -> toolCallId 维护
  toolCallStates: { [chatId: string]: { [toolCallId: string]: ToolCallState } };
  // 聊天设置
  settings: {
    autoScroll: boolean; // 自动滚动开关
  };
}

const initialState: ChatState = {
  chatList: [],
  chatData: {},
  currentChatId: null,
  error: null,
  isGenerating: {},// 运行时状态，每个 chatId 对应 false，表示没有在生成中
  messageCardStatus: {}, // MessageCard 状态，每个 chatId 对应 'stable'
  toolCallStates: {}, // 工具调用状态，每个 chatId 对应空对象
  settings: {
    autoScroll: true, // 默认开启自动滚动
  },
};

// 只做事件派发的 sendMessage action，实际流式/状态管理由 task-loop 处理
export const sendMessage = createAction<{ chatId: string; input: string }>('chat/sendMessage');

// 停止生成 action
export const stopGeneration = createAction<{ chatId: string }>('chat/stopGeneration');

// 应用启动时自动加载配置的 action
export const initializeChatStore = createAction('chat/initializeChatStore');

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<{ title: string; llmConfig?: any }>) => {
      const newChatId = uuidv4();
      const { title, llmConfig } = action.payload;
      // 获取默认模型：优先从传入的llmConfig获取，否则使用默认LLM的userModel
      const defaultLLM = llms[0];
      const defaultUserModel = llmConfig?.userModel || defaultLLM?.userModel || defaultLLM?.models?.[0] || 'deepseek-chat';
      
      const newChatInfo: ChatInfo = {
        id: newChatId,
        title,
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
          userModel: defaultUserModel, // 添加用户模型设置
          systemPrompt: '',
          enableTools: [],
          temperature: 0.6,
          enableWebSearch: false,
          contextLength: 4,
          parallelToolCalls: true,
        },
      };
      state.currentChatId = newChatId;
      // 初始化运行时状态
      state.isGenerating[newChatId] = false;
      state.messageCardStatus[newChatId] = 'stable';
      state.toolCallStates[newChatId] = {};
    },
    deleteChat: (state, action: PayloadAction<string>) => {
      const chatIdToDelete = action.payload;
      state.chatList = state.chatList.filter(chat => chat.id !== chatIdToDelete);
      delete state.chatData[chatIdToDelete];
      // 清理运行时状态
      delete state.isGenerating[chatIdToDelete];
      delete state.messageCardStatus[chatIdToDelete];
      delete state.toolCallStates[chatIdToDelete];
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
      // 保证每条消息为 EnrichedMessage
      const data = action.payload.data;
      data.messages = data.messages.map((msg: any, idx: number) => ({
        ...msg,
        id: msg.id || `msg-${idx}`,
        timestamp: msg.timestamp || Date.now() + idx,
      }));
      state.chatData[action.payload.chatId] = data;
      // 确保运行时状态存在
      if (!(action.payload.chatId in state.isGenerating)) {
        state.isGenerating[action.payload.chatId] = false;
      }
      if (!(action.payload.chatId in state.messageCardStatus)) {
        state.messageCardStatus[action.payload.chatId] = 'stable';
      }
      if (!(action.payload.chatId in state.toolCallStates)) {
        state.toolCallStates[action.payload.chatId] = {};
      }
      
      // 智能初始化历史工具调用状态：基于消息序列推断已完成的工具调用状态
      const chatId = action.payload.chatId;
      const messages = data.messages;
      const toolCallStates: { [toolCallId: string]: ToolCallState } = {};
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        
        // 如果是 assistant 消息且包含 tool_calls
        if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls)) {
          for (const toolCall of msg.tool_calls) {
            const toolCallId = toolCall.id || `${msg.id}_${toolCall.function?.name || 'unknown'}`;
            
            // 查找对应的 tool 消息
            const toolMessage = messages.find((m, idx) => 
              idx > i && 
              m.role === 'tool' && 
              (m.tool_call_id === toolCallId || 
               (m.toolName === toolCall.function?.name && Math.abs(idx - i) <= 5)) // 容错匹配：相近位置且工具名相同
            );
            
            if (toolMessage) {
              // 找到对应的 tool 消息，说明工具调用已完成
              toolCallStates[toolCallId] = {
                id: toolCallId,
                name: toolCall.function?.name || 'unknown',
                args: toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {},
                status: 'success', // 假设有结果就是成功，可以根据 tool 消息内容进一步判断
                result: toolMessage.content,
                timestamp: toolMessage.timestamp || Date.now(),
              };
            }
            // 如果没找到对应的 tool 消息，则不设置状态（默认不会显示为 calling）
          }
        }
      }
      
      // 合并到现有的 toolCallStates
      state.toolCallStates[chatId] = { ...state.toolCallStates[chatId], ...toolCallStates };
    },
    addMessage(state: ChatState, action: PayloadAction<{ chatId: string; message: EnrichedMessage }>) {
      const { chatId, message } = action.payload;
      // 消息已经是 EnrichedMessage，直接推入
      state.chatData[chatId]?.messages.push(message);
    },
    setError(state: ChatState, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    // 更新最后一条 assistant 消消息（如需流式/状态管理请交由 task-loop）
    updateLastAssistantMessage(state: ChatState, action: PayloadAction<{ chatId: string; message: Partial<EnrichedMessage> }>) {
      const { chatId, message } = action.payload;
      const msgs = state.chatData[chatId]?.messages;
      if (msgs && msgs.length > 0) {
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            // 使用 Object.assign 确保类型安全
            Object.assign(msgs[i], message);
            break;
          }
        }
      }
    },
    // 最小差分更新 assistant 消息（优化版本，避免整个对象重新创建）
    patchLastAssistantMessage(state: ChatState, action: PayloadAction<{ chatId: string; patch: Partial<EnrichedMessage> }>) {
      const { chatId, patch } = action.payload;
      const msgs = state.chatData[chatId]?.messages;
      if (msgs && msgs.length > 0) {
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            const current = msgs[i];
            // 只更新实际变化的字段，避免不必要的对象重创建
            for (const [key, value] of Object.entries(patch)) {
              if (current[key as keyof EnrichedMessage] !== value) {
                // 特殊处理 tool_calls 数组，确保 Immer 可以正确处理
                if (key === 'tool_calls' && Array.isArray(value)) {
                  // 确保创建新的数组而不是直接赋值引用
                  (current as any)[key] = [...value];
                } else {
                  (current as any)[key] = value;
                }
              }
            }
            break;
          }
        }
      }
    },
    setIsGenerating(state: ChatState, action: PayloadAction<{ chatId: string; value: boolean }>) {
      const { chatId, value } = action.payload;
      state.isGenerating[chatId] = value;
    },
    setMessageCardStatus(state: ChatState, action: PayloadAction<{ chatId: string; status: IMessageCardStatus }>) {
      const { chatId, status } = action.payload;
      state.messageCardStatus[chatId] = status;
    },
    // 重置所有运行时状态 - 在应用启动时调用
    resetRuntimeStates(state: ChatState) {
      // 为所有存在的 chatId 重置运行时状态为 false/'stable'，而不是清空
      Object.keys(state.chatData).forEach(chatId => {
        state.isGenerating[chatId] = false;
        state.messageCardStatus[chatId] = 'stable';
        state.toolCallStates[chatId] = {};
      });
      state.error = null;
    },
    // 设置自动滚动开关
    setAutoScroll(state: ChatState, action: PayloadAction<boolean>) {
      state.settings.autoScroll = action.payload;
    },
    // 设置工具调用状态
    setToolCallState(state: ChatState, action: PayloadAction<{ chatId: string; toolCallId: string; toolCallState: ToolCallState }>) {
      const { chatId, toolCallId, toolCallState } = action.payload;
      if (!state.toolCallStates[chatId]) {
        state.toolCallStates[chatId] = {};
      }
      state.toolCallStates[chatId][toolCallId] = toolCallState;
    },
    // 更新工具调用状态
    updateToolCallState(state: ChatState, action: PayloadAction<{ chatId: string; toolCallId: string; updates: Partial<ToolCallState> }>) {
      const { chatId, toolCallId, updates } = action.payload;
      if (state.toolCallStates[chatId]?.[toolCallId]) {
        Object.assign(state.toolCallStates[chatId][toolCallId], updates);
      }
    },
    // 清除工具调用状态
    clearToolCallStates(state: ChatState, action: PayloadAction<{ chatId: string }>) {
      const { chatId } = action.payload;
      if (state.toolCallStates[chatId]) {
        state.toolCallStates[chatId] = {};
      }
    },
    // 清空指定聊天的所有消息
    clearMessages(state: ChatState, action: PayloadAction<{ chatId: string }>) {
      const { chatId } = action.payload;
      if (state.chatData[chatId]) {
        state.chatData[chatId].messages = [];
      }
    },
    // 更新聊天设置
    updateChatSettings(state: ChatState, action: PayloadAction<{ chatId: string; settings: Partial<any> }>) {
      const { chatId, settings } = action.payload;
      if (state.chatData[chatId]) {
        state.chatData[chatId].settings = {
          ...state.chatData[chatId].settings,
          ...settings
        };
        
        // 自动保存到本地存储
        const storageData: ChatStorageData = {
          chatData: state.chatData,
          chatList: state.chatList,
          currentChatId: state.currentChatId
        };
        autoSaveChatData(storageData);
      }
    },
    // 从本地存储加载聊天数据
    loadChatDataFromStorage(state: ChatState, action: PayloadAction<ChatStorageData>) {
      const { chatData, chatList, currentChatId } = action.payload;
      
      // 恢复聊天列表
      state.chatList = chatList || [];
      state.currentChatId = currentChatId;
      
      // 恢复聊天数据
      state.chatData = chatData || {};
      
      // 重置运行时状态
      Object.keys(state.chatData).forEach(chatId => {
        state.isGenerating[chatId] = false;
        state.messageCardStatus[chatId] = 'stable';
        state.toolCallStates[chatId] = {};
      });
      
      console.log('[ChatSlice] 从本地存储加载聊天数据完成');
    },
    // 加载配置
    loadConfig(state: ChatState, action: PayloadAction<{ chatId: string; settings: Partial<any> }>) {
      const { chatId, settings } = action.payload;
      const chatData = state.chatData[chatId];
      if (chatData) {
        chatData.settings = {
          ...chatData.settings,
          ...settings,
        };
      }
    },
    // 保存配置
    saveConfig(state: ChatState, action: PayloadAction<{ chatId: string }>) {
      const chatId = action.payload.chatId;
      const chatData = state.chatData[chatId];
      if (chatData) {
        // 保存当前聊天的配置到本地存储
        const storageData: ChatStorageData = {
          chatData: { [chatId]: chatData },
          chatList: state.chatList,
          currentChatId: state.currentChatId
        };
        autoSaveChatData(storageData);
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
  setError,
  updateLastAssistantMessage,
  patchLastAssistantMessage,
  setIsGenerating,
  setMessageCardStatus,
  resetRuntimeStates,
  setAutoScroll,
  setToolCallState,
  updateToolCallState,
  clearToolCallStates,
  clearMessages,
  updateChatSettings,
  loadChatDataFromStorage,
  loadConfig,
  saveConfig,
} = chatSlice.actions;

export default chatSlice.reducer;