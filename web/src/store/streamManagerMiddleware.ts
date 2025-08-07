
// taskLoopMiddleware.ts
// 拦截 sendMessage action，交由 engine/stream/task-loop 处理业务复杂度
import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { ChatSetting } from '@engine/types/chat';
import { sendMessage, stopGeneration, addMessage, setIsGenerating, setError, patchLastAssistantMessage, setMessageCardStatus, setToolCallState, updateToolCallState } from './chatSlice';
import { TaskLoop } from '@engine/stream/task-loop';
import { llms } from '@engine/utils/llms';
// import { createStreamingPatch } from './utils/messageDiff'; // 注释掉差分更新逻辑
import { generateUserMessageId } from '@engine/utils/messageIdGenerator';
import { selectAvailableTools, mcpClientManager } from './mcpStore';
// import { StreamingPerformanceMonitor } from './utils/performanceMonitor'; // 注释掉性能监控

// LLM 任务参数类型，便于类型推导和后续扩展
export interface LLMTaskParams {
  chatId: string;
  messages: any[]; // 可根据你的类型系统进一步指定为 ChatMessage[]
  llmConfig: any;
  activeLLMConfig: any;
  currentApiKey: string;
  chatConfig: ChatSetting;
  input: string;
}

// 工具函数：从 Redux store 拼接 LLM/Chat 相关参数，便于复用和测试
export function buildLLMTaskParamsFromStore(state: RootState, chatId: string, input: string): LLMTaskParams {
  const chatData = state.chat.chatData[chatId];
  const messages = chatData?.messages || [];
  const llmConfig = state.llmConfig;
  const activeLLMConfig = llms.find(l => l.id === llmConfig.activeLLMId);
  const currentApiKey = llmConfig.apiKeys[llmConfig.activeLLMId] || '';
  const chatConfig = chatData?.settings || {} as ChatSetting;
  
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
export function buildLLMMessagesWithSystemPrompt({ messages, chatConfig }: { messages: any[]; chatConfig: ChatSetting }) {
  const contextLength = chatConfig.contextLength || 4; // 默认4，对应4000 tokens
  const systemPrompt = chatConfig.systemPrompt || '';
  
  // 1. 过滤消息：保留 OpenAI API 支持的所有 role 类型，特别是 tool 消息
  const validRoles = ['user', 'system', 'assistant', 'tool'] as const;
  const filteredMessages = messages.filter(msg => 
    msg && msg.role && validRoles.includes(msg.role)
  );
  
  // 2. 拼接系统提示词
  const systemMessage = systemPrompt && systemPrompt.trim()
    ? { role: 'system' as const, content: systemPrompt.trim() }
    : undefined;
    
  // 3. 暂时注释掉消息裁剪，设置为固定10轮对话
  // const maxHistoryCount = Math.max(1, contextLength * 2); // 每1k token大约对应2条消息
  // const trimmedMessages = filteredMessages.slice(-maxHistoryCount);
  const maxHistoryCount = 20; // 10轮对话 = 20条消息（用户+助手各10条）
  const trimmedMessages = filteredMessages.slice(-maxHistoryCount);
  
  // 4. 组装最终消息数组
  const finalMessages = systemMessage
    ? [systemMessage, ...trimmedMessages]
    : [...trimmedMessages];
    
  console.log('[buildLLMMessagesWithSystemPrompt] contextLength:', contextLength, 'maxTokens:', contextLength * 1000);
  console.log('[buildLLMMessagesWithSystemPrompt] 系统提示词:', systemPrompt ? '已设置' : '未设置');
  console.log('[buildLLMMessagesWithSystemPrompt] 原始消息数:', messages.length, '过滤后消息数:', filteredMessages.length);
  console.log('[buildLLMMessagesWithSystemPrompt] 历史消息 (固定10轮):', trimmedMessages.length, '最终消息:', finalMessages.length);
  
  // 特别检查 tool 消息是否被正确包含
  const toolMessages = finalMessages.filter(msg => msg.role === 'tool');
  const assistantWithToolCalls = finalMessages.filter(msg => msg.role === 'assistant' && msg.tool_calls);
  console.log('[buildLLMMessagesWithSystemPrompt] 包含的 tool 消息数:', toolMessages.length);
  console.log('[buildLLMMessagesWithSystemPrompt] 包含的 assistant+tool_calls 消息数:', assistantWithToolCalls.length);
  
  if (toolMessages.length > 0) {
    console.log('[buildLLMMessagesWithSystemPrompt] tool 消息详情:', toolMessages.map(tm => ({ 
      tool_call_id: tm.tool_call_id, 
      toolName: tm.toolName, 
      content: tm.content?.substring(0, 100) + '...' 
    })));
  }
  
  return finalMessages;
}

const taskLoopMap = new Map<string, TaskLoop>();
// 注释掉差分更新相关的存储 - 存储每个 chatId 的最后一条 assistant 消息，用于差分比较
// const lastAssistantMessageMap = new Map<string, Partial<any>>();

// 清理指定 chatId 的所有资源
export function cleanupChatResources(chatId: string) {
  // lastAssistantMessageMap.delete(chatId); // 注释掉差分更新逻辑
  taskLoopMap.delete(chatId);
  // 清理性能监控实例
  // StreamingPerformanceMonitor.cleanup(chatId); // 注释掉性能监控
}

// 清理所有资源（应用关闭时使用）
export function cleanupAllResources() {
  // lastAssistantMessageMap.clear(); // 注释掉差分更新逻辑
  taskLoopMap.clear();
}



import type { EnrichedMessage } from '@engine/types/chat';

// 为中间件提供更强的类型安全性  
const taskLoopMiddleware: Middleware = (storeAPI: any) => next => async action => {
  if (sendMessage.match(action)) {
    const { chatId, input } = action.payload;
    const params = buildLLMTaskParamsFromStore(storeAPI.getState(), chatId, input);
    
    // 获取可用的 MCP 工具
    const state = storeAPI.getState() as RootState;
    const availableMCPTools = selectAvailableTools(state);
    
    // 将 MCP 工具转换为 OpenAI tools 格式
    const openAITools = availableMCPTools.map(mcpTool => ({
      type: "function" as const,
      function: {
        name: mcpTool.name,
        description: mcpTool.description,
        parameters: mcpTool.inputSchema || {
          type: "object",
          properties: {},
          required: []
        }
      }
    }));
    
    console.log('[TaskLoop] 发现可用的 MCP 工具:', availableMCPTools.length, '个');
    console.log('[TaskLoop] 转换为 OpenAI 格式的工具:', openAITools.length, '个');
    
    // 设置生成状态（消息创建由TaskLoop管理）
    storeAPI.dispatch(setIsGenerating({ chatId, value: true }));
    
    // 多实例 TaskLoop
    let taskLoop = taskLoopMap.get(chatId);
    
    // 构建带系统提示词的消息历史
    const messagesWithSystemPrompt = buildLLMMessagesWithSystemPrompt({
      messages: params.messages,
      chatConfig: params.chatConfig
    });
    
    // 构建完整的 LLM 配置，包含 API Key 和 baseURL
    const llmConfig = {
      ...params.activeLLMConfig,
      apiKey: params.currentApiKey,
      baseURL: params.activeLLMConfig?.baseUrl,
      // 优先使用聊天设置中的模型，然后是全局设置，最后是默认模型
      model: params.chatConfig?.userModel || params.llmConfig.userModel || params.activeLLMConfig?.userModel || params.activeLLMConfig?.models?.[0],
      temperature: params.chatConfig?.temperature || 0.6,
      maxTokens: (params.chatConfig?.contextLength || 4) * 1000, // contextLength 1-20 对应 maxTokens 1000-20000
      tools: openAITools, // 使用转换后的 MCP 工具而不是 chatConfig.enableTools
      parallelToolCalls: params.chatConfig?.parallelToolCalls ?? true,
    };
    
    // 生成助手消息ID，用于TaskLoop内部消息管理
    const assistantMessageId = `assistant-${Date.now()}`;
    
    // 每次都重新创建TaskLoop以使用最新的llmConfig配置
    // 因为用户可能在UI中更改了模型、API Key等设置
    if (taskLoop) {
      // 清理旧的TaskLoop实例
      taskLoop.abortTask();
      taskLoopMap.delete(chatId);
    }
    
    // Debug logs can be enabled for debugging (currently commented out for performance)
    console.log('[TaskLoop] 重新创建TaskLoop使用最新配置');
    console.log('[TaskLoop] 当前模型:', llmConfig.model);
    console.log('[TaskLoop] 聊天设置userModel:', params.chatConfig?.userModel);
    console.log('[TaskLoop] 全局设置userModel:', params.llmConfig.userModel);
    console.log('[TaskLoop] 系统提示词:', params.chatConfig?.systemPrompt || '无');
    console.log('[TaskLoop] parallelToolCalls配置:', params.chatConfig?.parallelToolCalls);
    console.log('[TaskLoop] 最终llmConfig.parallelToolCalls:', llmConfig.parallelToolCalls);
    console.log('[TaskLoop] 消息历史长度 (含系统提示词):', messagesWithSystemPrompt.length);
    
    // 获取活跃的 MCP 服务
    const currentState = storeAPI.getState();
    const activeServer = currentState.mcp?.servers?.find(s => s.id === currentState.mcp?.activeServerId);
    const mcpClient = activeServer?.isConnected 
      ? mcpClientManager.getService(activeServer.id) 
      : undefined;
    
    console.log('[TaskLoop] 活跃 MCP 服务器:', activeServer?.name || '无');
    console.log('[TaskLoop] MCP 服务注入状态:', mcpClient ? '已注入' : '未注入');
    
    taskLoop = new TaskLoop({
      chatId,
      history: JSON.parse(JSON.stringify(messagesWithSystemPrompt)), // 使用包含系统提示词的消息历史
      config: llmConfig, // 传入完整的 LLM 配置而不是 chatConfig
      mcpClient, // 注入 MCP 服务
    });
    taskLoopMap.set(chatId, taskLoop);
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
        // 设置 cardStatus（如果事件中指定了）
        if (event.cardStatus) {
          storeAPI.dispatch(setMessageCardStatus({ chatId, status: event.cardStatus }));
        }
      } else if (event.type === 'update') {
        // 处理增量内容更新（优先使用delta，性能优化）
        const patch: any = { role: event.message.role };
        
        // 每次都获取最新状态，确保累加基于最新的消息内容
        const getCurrentMessage = () => {
          const currentState = storeAPI.getState();
          const messages = currentState.chat.chatData[chatId]?.messages || [];
          return messages[messages.length - 1];
        };
        
        // 处理增量内容更新（只支持增量模式）
        if (event.message.content_delta !== undefined) {
          const msg = getCurrentMessage();
          if (msg && msg.role === 'assistant') {
            patch.content = (msg.content || '') + event.message.content_delta;
          } else {
            patch.content = event.message.content_delta;
          }
        }
        
        // 处理增量推理内容更新（只支持增量模式）
        if (event.message.reasoning_delta !== undefined) {
          const msg = getCurrentMessage();
          if (msg && msg.role === 'assistant') {
            patch.reasoning_content = (msg.reasoning_content || '') + event.message.reasoning_delta;
          } else {
            patch.reasoning_content = event.message.reasoning_delta;
          }
        }
        
        // 工具调用直接使用完整数据，不需要增量处理
        if (event.message.tool_calls !== undefined) {
          patch.tool_calls = event.message.tool_calls;
        }
        
        storeAPI.dispatch(patchLastAssistantMessage({ chatId, patch }));
      } else if (event.type === 'status') {
        // 独立处理状态变化事件
        if (event.cardStatus) {
          storeAPI.dispatch(setMessageCardStatus({ chatId, status: event.cardStatus }));
        }
      } else if (event.type === 'toolcall') {
        // 处理工具调用事件
        console.log('[StreamManagerMiddleware] 处理工具调用事件:', event);
        const toolCall = event.toolCall;
        
        if (toolCall && toolCall.id) {
          // 创建工具调用状态
          const toolCallState = {
            id: toolCall.id,
            name: toolCall.function?.name || 'unknown',
            args: toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {},
            status: 'calling' as const,
            timestamp: Date.now()
          };
          
          // 设置工具调用状态
          storeAPI.dispatch(setToolCallState({ 
            chatId, 
            toolCallId: toolCall.id, 
            toolCallState 
          }));
          
          console.log('[StreamManagerMiddleware] 设置工具调用状态:', { chatId, toolCallId: toolCall.id, toolCallState });
        }
      } else if (event.type === 'toolresult') {
        // 处理工具调用结果事件
        console.log('[StreamManagerMiddleware] 处理工具调用结果事件:', event);
        const { toolCallId, result, error } = event;
        
        if (toolCallId) {
          // 更新工具调用状态
          const updates = {
            status: error ? 'error' as const : 'success' as const,
            result: error ? undefined : result,
            error: error,
          };
          
          storeAPI.dispatch(updateToolCallState({ 
            chatId, 
            toolCallId, 
            updates 
          }));
          
          console.log('[StreamManagerMiddleware] 更新工具调用状态:', { chatId, toolCallId, updates });
        }
      } else if (event.type === 'done') {
        // done事件表示LLM流完成，但不需要添加新消息（增量更新已经处理了内容）
        // 只需要确保最终的tool_calls被正确设置到现有消息中
        console.log('[StreamManagerMiddleware] Done事件内容:', event);
        
        // 如果done事件包含tool_calls，需要更新现有助手消息的tool_calls
        if (event.tool_calls && event.tool_calls.length > 0) {
          console.log('[StreamManagerMiddleware] Done事件包含tool_calls，更新现有助手消息');
          storeAPI.dispatch(patchLastAssistantMessage({ 
            chatId, 
            patch: { tool_calls: event.tool_calls }
          }));
        }
        
        // 流完成时，停止生成状态，但不重置MessageCard状态
        // cardStatus将由TaskLoop根据后续是否有工具调用来管理
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        // 注释掉立即重置cardStatus，让TaskLoop管理完整的生命周期
        // storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
        // 注释掉差分更新缓存清理
        // lastAssistantMessageMap.delete(chatId);
        // 注释掉性能统计输出
        // const monitor = StreamingPerformanceMonitor.getInstance(chatId);
        // monitor.logStats();
      } else if (event.type === 'error') {
        // 错误时也清理缓存并重置状态
        // lastAssistantMessageMap.delete(chatId); // 注释掉差分更新缓存清理
        storeAPI.dispatch(setError(event.error));
        storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
        storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
        // 注释掉性能统计输出
        // const monitor = StreamingPerformanceMonitor.getInstance(chatId);
        // monitor.logStats();
      }
    });
    // 启动TaskLoop，但不立即取消订阅
    await taskLoop.start(input);
    
    // 注意：不立即unsubscribe()，让事件能继续流转到UI
    // unsubscribe将在done/error事件中调用，或者TaskLoop实例被替换时调用
    
    // 清理缓存和 TaskLoop（可选，根据业务需求决定是否保持长连接）
    // taskLoopMap.delete(chatId);
    // lastAssistantMessageMap.delete(chatId);
    
    return;
  }
  
  // 处理停止生成 action
  if (stopGeneration.match(action)) {
    const { chatId } = action.payload;
    const taskLoop = taskLoopMap.get(chatId);
    
    if (taskLoop) {
      // console.log('[TaskLoopMiddleware] 停止生成任务:', chatId);
      taskLoop.abortTask();
      
      // 立即更新状态
      storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
      storeAPI.dispatch(setMessageCardStatus({ chatId, status: 'stable' }));
      
      // 注释掉差分更新缓存清理
      // lastAssistantMessageMap.delete(chatId);
      
      // 注释掉性能统计输出
      // const monitor = StreamingPerformanceMonitor.getInstance(chatId);
      // monitor.logStats();
    } else {
      // console.warn('[TaskLoopMiddleware] 未找到要停止的任务:', chatId);
    }
    
    return;
  }
  
  return next(action);
};

export default taskLoopMiddleware;
