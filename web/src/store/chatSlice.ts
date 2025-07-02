// =====================================
// chatSlice 说明（2025重构版）
// =====================================
// 1. chatSlice 只负责聊天历史/快照的持久化与管理，不再负责任何消息的 runtime 状态（如流式生成、消息状态、UI 状态等）。
// 2. 所有 runtime 状态（如消息生成中、错误、流式进度、消息聚合等）全部交由 task-loop（原 streamManager）独立管理，与 Redux 解耦。
// 3. UI 组件如需获取消息状态、流式进度等，需通过 task-loop 提供的订阅/回调/事件机制获取。
// 4. chatSlice 只存 ChatData（或 ChatSession/ChatInfo + ChatMessage[]），不再存 isGenerating、currentMessageId、abortController 等 runtime 字段。
// 5. 只在需要“持久化”或“全局快照”时与 task-loop 交互（如保存、恢复、导出）。

import { createSlice, createAction } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type { ChatInfo, ChatData, EnrichedMessage } from '@engine/types/chat';

// 新的 ChatState 只负责快照/历史，不含 runtime 状态
interface ChatState {
  chatList: ChatInfo[];
  chatData: Record<string, ChatData>;
  currentChatId: string | null;
  error: string | null;
  // 运行时生成状态，按 chatId 维护
  isGenerating: { [chatId: string]: boolean };
}

const initialState: ChatState = {
  chatList: [],
  chatData: {},
  currentChatId: null,
  error: null,
  isGenerating: {},//目前为全局 TODO：修正为每个chat独立属性
};

// 只做事件派发的 sendMessage action，实际流式/状态管理由 task-loop 处理
export const sendMessage = createAction<{ chatId: string; input: string }>('chat/sendMessage');

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
      // 保证每条消息为 EnrichedMessage
      const data = action.payload.data;
      data.messages = data.messages.map((msg: any, idx: number) => ({
        ...msg,
        id: msg.id || `msg-${idx}`,
        timestamp: msg.timestamp || Date.now() + idx,
      }));
      state.chatData[action.payload.chatId] = data;
    },
    addMessage(state: ChatState, action: PayloadAction<{ chatId: string; message: EnrichedMessage }>) {
      const { chatId, message } = action.payload;
      // 消息已经是 EnrichedMessage，直接推入
      state.chatData[chatId]?.messages.push(message);
    },
    setError(state: ChatState, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    // 更新最后一条 assistant 消息（如需流式/状态管理请交由 task-loop）
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
    setIsGenerating(state: ChatState, action: PayloadAction<{ chatId: string; value: boolean }>) {
      const { chatId, value } = action.payload;
      state.isGenerating[chatId] = value;
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
  setIsGenerating,
} = chatSlice.actions;

export default chatSlice.reducer;