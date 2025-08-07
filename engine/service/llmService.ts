// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';
import { handleResponseStream } from '../stream/streamHandler';

export let currentStream: AsyncIterable<any> | null = null;

// 工具链/后处理 glue 预留接口
export type PostProcessMessages = (messages: any[]) => Promise<void>;
export type OcrService = (imageData: any) => Promise<string>;
export type ImageService = (imageData: any) => Promise<any>;

export async function streamLLMChat({
  chatId,
  baseURL,
  apiKey,
  model,
  messages,
  temperature,
  tools = [],
  parallelToolCalls = true,
  proxyServer = '',
  onChunk,
  onDone,
  onError,
  onToolCall,
  // postProcessMessages,
  // ocrService, // 预留 OCR glue
  // imageService, // 预留图片 glue
  customFetch,
  signal,
  assistantMessageId, // 新增：传入固定的 assistant 消 Messages ID
}: {
  chatId?: string; // 可选，便于跟踪会话
  baseURL: string;
  apiKey: string;
  model: string;
  messages: any[];
  temperature?: number;
  tools?: any[];
  parallelToolCalls?: boolean;
  proxyServer?: string;
  onChunk?: (chunk: any) => void;
  onDone?: (result: any) => void;
  onError?: (err: any) => void;
  onToolCall?: (toolCall: any) => void;
  // postProcessMessages?: PostProcessMessages;
  // ocrService?: OcrService;
  // imageService?: ImageService;
  customFetch?: typeof fetch;
  signal?: AbortSignal;
  assistantMessageId?: string; // 固定的 assistant 消息 ID
}) {
  // 消息后处理（如有 OCR、图片等 glue，可在此调用）
  // if (postProcessMessages) {
  //   await postProcessMessages(messages);
  // }
  // 如需 OCR glue，可在此调用 ocrService(imageData)
  // 如需图片 glue，可在此调用 imageService(imageData)

  // Debug logs can be enabled for debugging (currently commented out for performance)
  console.log('[streamLLMChat] 接收到的参数:');
  console.log('[streamLLMChat] baseURL:', baseURL);
  console.log('[streamLLMChat] model:', model);
  console.log('[streamLLMChat] apiKey:', apiKey ? '***已设置***' : '未设置');
  console.log('[streamLLMChat] messages 数量:', messages.length);
  console.log('[streamLLMChat] tools 数量:', tools?.length || 0);
  console.log('[streamLLMChat] parallelToolCalls 原始值:', parallelToolCalls);
  console.log('[streamLLMChat] temperature:', temperature);

  const client = new OpenAI({
    baseURL,
    apiKey,
    fetch: customFetch,
    dangerouslyAllowBrowser: true
  });

  const seriableTools = (tools && tools.length === 0) ? undefined : tools;
  const seriableParallelToolCalls = (tools && tools.length > 0) ? parallelToolCalls : undefined;

  console.log('[streamLLMChat] 序列化后的参数:');
  console.log('[streamLLMChat] seriableTools:', seriableTools ? `${seriableTools.length} 个工具` : 'undefined');
  console.log('[streamLLMChat] seriableParallelToolCalls:', seriableParallelToolCalls);

  // 清理消息格式，确保只包含 API 需要的字段
  const cleanMessages = messages
    .filter(msg => {
      // 基本验证：必须有 role
      if (!msg || !msg.role) return false;
      
      // tool 消息必须有 tool_call_id，content 可以为空字符串
      if (msg.role === 'tool') {
        return !!(msg as any).tool_call_id;
      }
      
      // 其他消息必须有 content
      return msg.content !== undefined;
    })
    .map(msg => {
      const cleanMsg: any = {
        role: msg.role,
        content: msg.content || '', // 确保 content 不为 undefined
      };

      // 保留其他必要的 OpenAI 字段
      if (msg.name) cleanMsg.name = msg.name;

      // 只有当 tool_calls 存在且非空时才包含
      if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls;
        // console.log('[llmService] 包含 tool_calls:', msg.tool_calls.length, '个');
      } else if (msg.tool_calls) {
        // console.log('[llmService] 跳过空的 tool_calls 数组, 长度:', Array.isArray(msg.tool_calls) ? msg.tool_calls.length : '非数组');
      }

      // 特别重要：保留 tool_call_id 用于工具响应消息
      if ((msg as any).tool_call_id) {
        cleanMsg.tool_call_id = (msg as any).tool_call_id;
      }

      return cleanMsg;
    });

  // Debug logs can be enabled for debugging (currently commented out for performance)
  console.log('[llmService] 原始 messages:', messages);
  console.log('[llmService] 清理后的 messages:', cleanMessages);
  
  // 特别检查工具调用相关消息
  const assistantWithTools = cleanMessages.filter(msg => msg.role === 'assistant' && msg.tool_calls);
  const toolMessages = cleanMessages.filter(msg => msg.role === 'tool');
  console.log('[llmService] 助手工具调用消息:', assistantWithTools.length, '个');
  console.log('[llmService] 工具响应消息:', toolMessages.length, '个');
  
  if (assistantWithTools.length > 0) {
    console.log('[llmService] 最新的助手工具调用:', JSON.stringify(assistantWithTools[assistantWithTools.length - 1], null, 2));
  }
  
  if (toolMessages.length > 0) {
    console.log('[llmService] 工具响应消息详情:', JSON.stringify(toolMessages, null, 2));
  }
  
  // 验证工具调用和响应的配对关系
  if (assistantWithTools.length > 0) {
    const lastAssistantWithTools = assistantWithTools[assistantWithTools.length - 1];
    const expectedToolCallIds = lastAssistantWithTools.tool_calls?.map(tc => tc.id) || [];
    const actualToolCallIds = toolMessages.map(tm => tm.tool_call_id);
    
    console.log('[llmService] 期望的 tool_call_ids:', expectedToolCallIds);
    console.log('[llmService] 实际的 tool_call_ids:', actualToolCallIds);
    
    const missingResponses = expectedToolCallIds.filter(id => !actualToolCallIds.includes(id));
    const extraResponses = actualToolCallIds.filter(id => !expectedToolCallIds.includes(id));
    
    if (missingResponses.length > 0) {
      console.warn('[llmService] 缺少对应的工具响应消息:', missingResponses);
    }
    if (extraResponses.length > 0) {
      console.warn('[llmService] 多余的工具响应消息:', extraResponses);
    }
  }
  
  // 增强验证：检查整个消息序列的完整性
  let messageSequenceValid = true;
  let sequenceErrors: string[] = [];
  
  for (let i = 0; i < cleanMessages.length; i++) {
    const msg = cleanMessages[i];
    
    // 如果是带 tool_calls 的 assistant 消息
    if (msg.role === 'assistant' && msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
      const expectedIds = msg.tool_calls.map(tc => tc.id);
      const foundIds: string[] = [];
      
      // 检查后续消息中是否有对应的 tool 响应
      for (let j = i + 1; j < cleanMessages.length; j++) {
        const nextMsg = cleanMessages[j];
        if (nextMsg.role === 'tool' && nextMsg.tool_call_id) {
          if (expectedIds.includes(nextMsg.tool_call_id)) {
            foundIds.push(nextMsg.tool_call_id);
          }
        }
        // 如果遇到下一个 assistant 消息，停止搜索
        if (nextMsg.role === 'assistant') {
          break;
        }
      }
      
      const missingIds = expectedIds.filter(id => !foundIds.includes(id));
      if (missingIds.length > 0) {
        messageSequenceValid = false;
        sequenceErrors.push(`Assistant 消息 ${i} 的工具调用缺少响应: ${missingIds.join(', ')}`);
      }
    }
  }
  
  if (!messageSequenceValid) {
    console.error('[llmService] 消息序列验证失败:', sequenceErrors);
    console.error('[llmService] 完整消息序列:', cleanMessages.map((msg, idx) => ({
      index: idx,
      role: msg.role,
      has_content: !!msg.content,
      has_tool_calls: !!(msg.tool_calls && msg.tool_calls.length > 0),
      tool_call_id: msg.tool_call_id,
      tool_calls_ids: msg.tool_calls?.map(tc => tc.id)
    })));
  } else {
    console.log('[llmService] 消息序列验证通过 ✓');
  }

  const requestParams: ChatCompletionCreateParams = {
    model,
    messages: cleanMessages,
    temperature,
    stream: true,
    ...(seriableTools && { tools: seriableTools }),
    ...(seriableParallelToolCalls !== undefined && { parallel_tool_calls: seriableParallelToolCalls }),
  };

  console.log('[streamLLMChat] 最终请求参数:', JSON.stringify(requestParams, null, 2));

  const stream = await client.chat.completions.create(requestParams, { signal });

  // 使用streamHandler处理完整逻辑，由MessageBridge负责增量处理
  try {
    // 记录已触发的工具调用，避免重复触发
    const triggeredToolCalls = new Set<string>();
    
    const result = await handleResponseStream(stream, (chunk) => {
      // 继续调用原始的 onChunk（传递streamHandler累积的完整内容）
      if (onChunk) {
        onChunk({
          type: 'chunk',
          content: chunk.content,
          reasoning_content: chunk.reasoning_content,
          tool_calls: chunk.tool_calls,
          phase: chunk.phase
        });
      }
    });
    
    // 添加调试信息查看返回结果
    console.log('[streamLLMChat] 🔍 流完成，result 结构:', {
      hasToolCalls: !!(result.tool_calls && result.tool_calls.length > 0),
      toolCallsLength: result.tool_calls?.length || 0,
      hasOnToolCall: !!onToolCall,
      content: result.content,
      reasoning_content: result.reasoning_content
    });
    
    if (result.tool_calls && result.tool_calls.length > 0) {
      console.log('[streamLLMChat] 🔍 详细的 tool_calls 结构:', JSON.stringify(result.tool_calls, null, 2));
    }
    
    // 流处理完成后，检查最终聚合的工具调用
    if (result.tool_calls && result.tool_calls.length > 0 && onToolCall) {
      console.log('[streamLLMChat] 🔍 流完成，检查最终工具调用:', result.tool_calls.length, '个');
      
      for (const toolCall of result.tool_calls) {
        if (toolCall.function && toolCall.function.name && toolCall.function.arguments !== undefined) {
          const toolKey = `${toolCall.id || toolCall.function.name}`;
          
          console.log('[streamLLMChat] 检查最终工具调用:', toolCall.function.name, 'ID:', toolCall.id, 'arguments:', JSON.stringify(toolCall.function.arguments));
          
          // 只触发未触发过的工具调用
          if (!triggeredToolCalls.has(toolKey)) {
            try {
              // 验证 arguments 是有效的 JSON，允许空字符串
              let parsedArgs = {};
              const argsStr = toolCall.function.arguments?.trim();
              if (argsStr && argsStr !== '') {
                parsedArgs = JSON.parse(argsStr);
              }
              console.log('[streamLLMChat] ✅ 流完成后检测到完整工具调用:', toolCall.function.name, 'ID:', toolCall.id, '解析的参数:', parsedArgs);
              triggeredToolCalls.add(toolKey);
              onToolCall(toolCall);
            } catch (e) {
              console.log('[streamLLMChat] ❌ 流完成后工具调用参数解析失败:', toolCall.function.name, 'arguments:', JSON.stringify(toolCall.function.arguments), 'error:', e);
              // 即使解析失败，也尝试触发工具调用（使用空参数）
              console.log('[streamLLMChat] 🔄 尝试使用空参数触发工具调用');
              triggeredToolCalls.add(toolKey);
              onToolCall(toolCall);
            }
          } else {
            console.log('[streamLLMChat] ⚠️  最终工具调用已触发过，跳过:', toolCall.function.name);
          }
        } else {
          console.log('[streamLLMChat] ❌ 最终工具调用缺少必要信息 - function:', !!toolCall.function, 'name:', toolCall.function?.name, 'arguments:', !!toolCall.function?.arguments);
        }
      }
    } else {
      console.log('[streamLLMChat] 📝 流完成，无工具调用或回调未提供');
    }
    
    // 流处理完成后，调用 onDone 回调，确保返回完整的 EnrichedMessage 格式
    if (onDone) {
      const enrichedResult = {
        role: 'assistant' as const,
        content: result.content,
        id: assistantMessageId, // 使用传入的 ID，避免重新生成
        // 只在流完成时设置最终的 timestamp，避免频繁更新
        timestamp: Date.now(),
        ...(result.reasoning_content && { reasoning_content: result.reasoning_content }),
        ...(result.tool_calls && result.tool_calls.length > 0 && { tool_calls: result.tool_calls }),
      };
      onDone(enrichedResult);
    }
  } catch (err) {
    if (onError) onError(err);
  }
}

export function abortLLMStream() {
  currentStream = null;
}

// 平台适配对象：web下直接调用streamLLMChat，统一事件分发
export const llmService = {
  /**
   * 统一协议消息发送，web下直接调用 streamLLMChat
   * @param type 消息类型（仅支持 message/llm/chat）
   * @param payload LLM请求参数
   * @param callback 统一事件回调 { type, ... }
   */
  send(type: string, payload: any, callback: (msg: any) => void) {
    if (type !== 'message/llm/chat') {
      console.warn('llmService.send: 仅支持 message/llm/chat');
      return;
    }
    streamLLMChat({
      ...payload,
      onChunk: (data: any) => callback({ type: 'chunk', ...data }),
      onDone: (data: any) => callback({ type: 'done', ...data }),
      onError: (err: any) => callback({ type: 'error', ...err }),
      onAbort: (info: any) => callback({ type: 'abort', ...info }),
      onToolCall: (toolCall: any) => callback({ type: 'toolcall', ...toolCall }),
    });
  },

  /**
   * 中断 LLM 推理（可选实现）
   */
  abort(type: string, payload: any, callback: (msg: any) => void) {
    // 如有 abort 能力可实现，否则留空
    // abortLLMStream();
    callback({ type: 'abort', ...payload });
  }
};

// 用法示例：
// llmService.send('message/llm/chat', payload, (msg) => { ... })
// llmService.abort('message/llm/abort', payload, (msg) => { ... })
