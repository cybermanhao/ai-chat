// engine/config/defaultChatSetting.ts
// 多端统一默认聊天设置
import type { ChatSetting } from '../types/chat';

export const defaultChatSetting: ChatSetting = {
  modelIndex: 0,
  systemPrompt: '',
  enableTools: [],
  temperature: 0.7,
  enableWebSearch: false,
  contextLength: 2000,
  parallelToolCalls: false
};
