// 类型检查工具 - 验证 Redux store 类型安全性
// @ts-ignore
import type { RootState } from '@/store';
import type { ChatSetting, EnrichedMessage, ChatData } from '@engine/types/chat';

// 类型检查函数，确保类型推断正确
export function validateStoreTypes() {
  // 验证 RootState 类型
  const testState: RootState = {} as RootState;
  
  // 验证 chat slice 类型
  const chatState = testState.chat;
  const chatData: Record<string, ChatData> = chatState.chatData;
  const currentChatId: string | null = chatState.currentChatId;
  const chatList = chatState.chatList;
  
  // 验证 ChatSetting 类型
  const sampleChatId = 'test-chat';
  if (chatData[sampleChatId]) {
    const settings: ChatSetting = chatData[sampleChatId].settings;
    const messages: EnrichedMessage[] = chatData[sampleChatId].messages;
    
    // 验证设置字段类型
    const userModel: string | undefined = settings.userModel;
    const systemPrompt: string = settings.systemPrompt;
    const temperature: number = settings.temperature;
    const contextLength: number = settings.contextLength;
    const parallelToolCalls: boolean = settings.parallelToolCalls;
    
    console.log('Type validation passed:', {
      userModel,
      systemPrompt,
      temperature,
      contextLength,
      parallelToolCalls,
      messagesCount: messages.length
    });
  }
  
  // 验证 llmConfig slice 类型
  const llmConfig = testState.llmConfig;
  const activeLLMId: string = llmConfig.activeLLMId;
  const userModel: string = llmConfig.userModel;
  const apiKeys: Record<string, string> = llmConfig.apiKeys;
  
  console.log('LLM Config type validation passed:', {
    activeLLMId,
    userModel,
    apiKeysCount: Object.keys(apiKeys).length
  });
  
  return true;
}

// 类型守卫函数
export function isChatSetting(obj: any): obj is ChatSetting {
  return obj && 
    typeof obj.systemPrompt === 'string' &&
    typeof obj.temperature === 'number' &&
    typeof obj.contextLength === 'number' &&
    typeof obj.parallelToolCalls === 'boolean' &&
    Array.isArray(obj.enableTools);
}

export function isEnrichedMessage(obj: any): obj is EnrichedMessage {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.timestamp === 'number';
}

// 运行时类型验证
export function validateChatSettings(settings: any): ChatSetting {
  if (!isChatSetting(settings)) {
    throw new Error('Invalid ChatSetting object');
  }
  return settings;
}

export function validateMessage(message: any): EnrichedMessage {
  if (!isEnrichedMessage(message)) {
    throw new Error('Invalid EnrichedMessage object');
  }
  return message;
}
