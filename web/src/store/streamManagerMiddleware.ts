// taskLoopMiddleware.ts
// 拦截 sendMessage action，交由 engine/stream/task-loop 处理业务复杂度
import type { Middleware } from '@reduxjs/toolkit';
import { sendMessage, addMessage, setIsGenerating, setError, updateLastAssistantMessage } from './chatSlice';
import { TaskLoop } from '@engine/stream/task-loop';
import { llms } from '@engine/utils/llms';

// LLM 任务参数类型，便于类型推导和后续扩展
export interface LLMTaskParams {
  chatId: string;
  messages: any[]; // 可根据你的类型系统进一步指定为 ChatMessage[]
  llmConfig: any;
  activeLLMConfig: any;
  currentApiKey: string;
  chatConfig: any;
  input: string;
}

// 工具函数：从 Redux store 拼接 LLM/Chat 相关参数，便于复用和测试
export function buildLLMTaskParamsFromStore(state: any, chatId: string, input: string): LLMTaskParams {
  const chatData = state.chat.chatData[chatId];
  const messages = chatData?.messages || [];
  const llmConfig = state.llmConfig;
  const activeLLMConfig = llms.find(l => l.id === llmConfig.activeLLMId);
  const currentApiKey = llmConfig.apiKeys[llmConfig.activeLLMId] || '';
  const chatConfig = chatData?.settings || {};
  return {
    chatId,
    messages,
    llmConfig,
    activeLLMConfig,
    currentApiKey,
    chatConfig,
    input,
  };
}

// 工具函数：根据 contextLength 和系统提示词拼接历史消息
export function buildLLMMessagesWithSystemPrompt({ messages, chatConfig }: { messages: any[]; chatConfig: any }) {
  const contextLength = chatConfig.contextLength || 20;
  const systemPrompt = chatConfig.systemPrompt || '';
  // 1. 拼接系统提示词
  const systemMessage = systemPrompt
    ? { role: 'system', content: systemPrompt }
    : undefined;
  // 2. 裁剪历史消息
  const trimmedMessages = messages.slice(-contextLength);
  // 3. 组装最终消息数组
  return systemMessage
    ? [systemMessage, ...trimmedMessages]
    : [...trimmedMessages];
}

const taskLoopMap = new Map<string, TaskLoop>();
import type { EnrichedMessage } from '@engine/types/chat';
const taskLoopMiddleware: Middleware = storeAPI => next => async action => {
  if (sendMessage.match(action)) {
    const { chatId, input } = action.payload;
    const params = buildLLMTaskParamsFromStore(storeAPI.getState(), chatId, input);
    // 追加用户消息
    const userMessage: EnrichedMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    const messagesWithPrompt = buildLLMMessagesWithSystemPrompt({
      messages: [...params.messages, userMessage],
      chatConfig: params.chatConfig,
    });
    storeAPI.dispatch(addMessage({ chatId, message: userMessage }));
    storeAPI.dispatch(setIsGenerating({ chatId, value: true }));
    // 多实例 TaskLoop
    let taskLoop = taskLoopMap.get(chatId);
    if (!taskLoop) {
      // 构建完整的 LLM 配置，包含 API Key 和 baseURL
      const llmConfig = {
        ...params.activeLLMConfig,
        apiKey: params.currentApiKey,
        baseURL: params.activeLLMConfig?.baseUrl,
        model: params.activeLLMConfig?.userModel || params.activeLLMConfig?.models?.[0],
        temperature: params.chatConfig?.temperature || 0.6,
        tools: params.chatConfig?.enableTools || [],
        parallelToolCalls: params.chatConfig?.parallelToolCalls ?? true,
      };
      
      taskLoop = new TaskLoop({
        chatId,
        history: params.messages,
        config: llmConfig, // 传入完整的 LLM 配置而不是 chatConfig
      });
      taskLoopMap.set(chatId, taskLoop);
    }
    // 事件流 glue
    const unsubscribe = taskLoop.subscribe(event => {
      if (event.type === 'add') {
        // 保证 event.message 必带 id、timestamp
        const enrichedMsg = {
          ...event.message,
          id: event.message.id || `msg-${Date.now()}`,
          timestamp: event.message.timestamp || Date.now(),
        };
        storeAPI.dispatch(addMessage({ chatId, message: enrichedMsg }));
      } else if (event.type === 'update') {
        storeAPI.dispatch(updateLastAssistantMessage({ chatId, message: event.message }));
      } else if (event.type === 'done') {
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
      } else if (event.type === 'error') {
        storeAPI.dispatch(setError(event.error));
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
      }
    });
    await taskLoop.start(input);
    unsubscribe();
    return;
  }
  return next(action);
};

export default taskLoopMiddleware;
