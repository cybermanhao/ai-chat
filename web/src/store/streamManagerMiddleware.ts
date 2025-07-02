// taskLoopMiddleware.ts
// 拦截 sendMessage action，交由 engine/stream/task-loop 处理业务复杂度
import type { Middleware } from '@reduxjs/toolkit';
import { sendMessage, addMessage, setIsGenerating, setError, patchLastAssistantMessage, setMessageCardStatus } from './chatSlice';
import { TaskLoop } from '@engine/stream/task-loop';
import { llms } from '@engine/utils/llms';
import { createStreamingPatch } from './utils/messageDiff';
import { generateUserMessageId, generateAssistantMessageId } from '@engine/utils/messageIdGenerator';
import { StreamingPerformanceMonitor } from './utils/performanceMonitor';

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
  
  // Debug logs can be enabled for debugging (currently commented out for performance)
  // console.log('[buildLLMTaskParamsFromStore] Redux llmConfig:', llmConfig);
  // console.log('[buildLLMTaskParamsFromStore] activeLLMConfig:', activeLLMConfig);
  // console.log('[buildLLMTaskParamsFromStore] currentApiKey:', currentApiKey ? '***已设置***' : '未设置');
  
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
// 存储每个 chatId 的最后一条 assistant 消息，用于差分比较
const lastAssistantMessageMap = new Map<string, Partial<any>>();

// 清理指定 chatId 的所有资源
export function cleanupChatResources(chatId: string) {
  lastAssistantMessageMap.delete(chatId);
  taskLoopMap.delete(chatId);
  // 清理性能监控实例
  StreamingPerformanceMonitor.cleanup(chatId);
}

// 清理所有资源（应用关闭时使用）
export function cleanupAllResources() {
  lastAssistantMessageMap.clear();
  taskLoopMap.clear();
}

// 高效的差分更新函数
function updateAssistantMessageWithDiff(
  storeAPI: any,
  chatId: string,
  message: any
) {
  const lastMessage = lastAssistantMessageMap.get(chatId) || {};
  const patch = createStreamingPatch(lastMessage, message);
  
  if (patch.hasChanges) {
    // 性能监控
    const monitor = StreamingPerformanceMonitor.getInstance(chatId);
    monitor.recordUpdate(Object.keys(patch.changes));
    
    // 检查是否存在 assistant 消息
    const state = storeAPI.getState();
    const msgs = state.chat.chatData[chatId]?.messages || [];
    const hasAssistantMessage = msgs.some((msg: any) => msg.role === 'assistant');
    
    if (!hasAssistantMessage) {
      // 如果没有 assistant 消息，创建一个新的
      const patchChanges = patch.changes as any;
      const newAssistantMessage = {
        role: 'assistant' as const,
        content: patchChanges.content || '',
        reasoning_content: patchChanges.reasoning_content || '',
        id: `assistant-${Date.now()}`,
        timestamp: Date.now(),
      } as EnrichedMessage;
      console.log('[updateAssistantMessageWithDiff] 创建新的 assistant 消息:', newAssistantMessage);
      storeAPI.dispatch(addMessage({ chatId, message: newAssistantMessage }));
      lastAssistantMessageMap.set(chatId, newAssistantMessage);
    } else {
      // 如果存在 assistant 消息，使用差分更新
      console.log('[updateAssistantMessageWithDiff] 应用差分更新:', {
        chatId,
        changesCount: Object.keys(patch.changes).length,
        changes: patch.changes,
      });
      storeAPI.dispatch(patchLastAssistantMessage({ chatId, patch: patch.changes }));
      // 更新本地缓存
      lastAssistantMessageMap.set(chatId, { ...lastMessage, ...patch.changes });
    }
  } else {
    // 调试日志：记录无变化的情况
    // console.log('[updateAssistantMessageWithDiff] 无变化，跳过更新:', { chatId });
  }
}

import type { EnrichedMessage } from '@engine/types/chat';
const taskLoopMiddleware: Middleware = storeAPI => next => async action => {
  if (sendMessage.match(action)) {
    const { chatId, input } = action.payload;
    const params = buildLLMTaskParamsFromStore(storeAPI.getState(), chatId, input);
    // 追加用户消息
    const userMessage: EnrichedMessage = {
      id: generateUserMessageId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    storeAPI.dispatch(addMessage({ chatId, message: userMessage }));
    storeAPI.dispatch(setIsGenerating({ chatId, value: true }));
    
    // 预先添加一个空的 assistant 消息占位
    const assistantMessageId = generateAssistantMessageId();
    const assistantPlaceholder: EnrichedMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    storeAPI.dispatch(addMessage({ chatId, message: assistantPlaceholder }));
    
    // 多实例 TaskLoop
    let taskLoop = taskLoopMap.get(chatId);
    if (!taskLoop) {
      // 构建完整的 LLM 配置，包含 API Key 和 baseURL
      const llmConfig = {
        ...params.activeLLMConfig,
        apiKey: params.currentApiKey,
        baseURL: params.activeLLMConfig?.baseUrl,
        model: params.llmConfig.userModel || params.activeLLMConfig?.userModel || params.activeLLMConfig?.models?.[0],
        temperature: params.chatConfig?.temperature || 0.6,
        tools: params.chatConfig?.enableTools || [],
        parallelToolCalls: params.chatConfig?.parallelToolCalls ?? true,
        assistantMessageId, // 传递 assistant 消息 ID
      };
      
      // Debug logs can be enabled for debugging (currently commented out for performance)
      // console.log('[TaskLoop] 构建的完整 LLM 配置:', llmConfig);
      // console.log('[TaskLoop] baseURL:', llmConfig.baseURL);
      // console.log('[TaskLoop] model:', llmConfig.model);
      // console.log('[TaskLoop] apiKey:', llmConfig.apiKey ? '***已设置***' : '未设置');
      
      taskLoop = new TaskLoop({
        chatId,
        history: JSON.parse(JSON.stringify(params.messages)), // 深拷贝，避免 Redux immutable 干扰
        config: llmConfig, // 传入完整的 LLM 配置而不是 chatConfig
      });
      taskLoopMap.set(chatId, taskLoop);
    }
    // 事件流 glue
    const unsubscribe = taskLoop.subscribe(event => {
      // 处理 cardStatus（如果存在）
      if (event.cardStatus) {
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: event.cardStatus }));
      }
      
      if (event.type === 'add') {
        // 保证 event.message 必带 id、timestamp
        const enrichedMsg = {
          ...event.message,
          id: event.message.id || `msg-${Date.now()}`,
          timestamp: event.message.timestamp || Date.now(),
        };
        storeAPI.dispatch(addMessage({ chatId, message: enrichedMsg }));
        // 默认设置为连接中状态（如果没有指定 cardStatus）
        if (!event.cardStatus) {
          storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'connecting' }));
        }
      } else if (event.type === 'update') {
        // 使用差分更新避免不必要的 Redux 更新
        updateAssistantMessageWithDiff(storeAPI, chatId, event.message);
      } else if (event.type === 'done') {
        // 流完成时，停止生成状态并重置 MessageCard 状态
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
        // 清理本地缓存
        lastAssistantMessageMap.delete(chatId);
        // 输出性能统计
        const monitor = StreamingPerformanceMonitor.getInstance(chatId);
        monitor.logStats();
      } else if (event.type === 'error') {
        // 错误时也清理缓存并重置状态
        lastAssistantMessageMap.delete(chatId);
        storeAPI.dispatch(setError(event.error));
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
        // 输出性能统计
        const monitor = StreamingPerformanceMonitor.getInstance(chatId);
        monitor.logStats();
      }
    });
    await taskLoop.start(input);
    unsubscribe();
    
    // 清理缓存和 TaskLoop（可选，根据业务需求决定是否保持长连接）
    // taskLoopMap.delete(chatId);
    // lastAssistantMessageMap.delete(chatId);
    
    return;
  }
  return next(action);
};

export default taskLoopMiddleware;
