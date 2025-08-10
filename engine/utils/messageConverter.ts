// engine/utils/messageConverter.ts
// 消息转换适配器 - 专注于数据格式转换，不处理平台适配逻辑

import type { EnrichedMessage } from '../types/chat';
import type { Tool } from '../service/mcpClient';
import type { LLMConfig } from './llms';
// 引用OpenAI官方类型
import type { 
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam, 
  ChatCompletionAssistantMessageParam,
  ChatCompletionToolMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool
} from 'openai/resources/chat/completions';

// ===== 消息格式定义 =====

// UI层消息格式 (用于前端展示)
export interface UIMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'client-notice';
  content: string;
  timestamp: number;
  // UI特有字段
  status?: 'sending' | 'sent' | 'error';
  isStreaming?: boolean;
  tool_calls?: ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  name?: string;
  noticeType?: 'error' | 'warning' | 'info';
  errorCode?: string;
  // 扩展字段 (由具体平台适配器处理)
  [key: string]: unknown;
}

// 持久化存储格式 (用于数据库/本地存储)
export interface StorageMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  chatId: string;
  // 标准字段
  name?: string;
  tool_calls?: ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  // 扩展字段 (用于存储平台特有数据)
  [key: string]: unknown;
}

// 转换结果包装
export interface ConversionResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
}

/**
 * 消息格式转换器类
 * 纯粹的数据格式转换，不包含平台适配逻辑
 */
export class MessageConverter {
  
  // ===== UI层 ↔ 持久化层 =====
  
  /**
   * 将UI消息转换为持久化存储格式
   * @param uiMessages UI层消息数组
   * @param chatId 会话ID
   * @returns 转换结果
   */
  static uiToStorage(uiMessages: UIMessage[], chatId: string): ConversionResult<StorageMessage> {
    const result: ConversionResult<StorageMessage> = {
      success: true,
      data: [],
      errors: [],
      warnings: []
    };

    for (const uiMsg of uiMessages) {
      // 跳过客户端通知消息，不需要持久化
      if (uiMsg.role === 'client-notice') {
        result.warnings.push(`跳过客户端通知消息: ${uiMsg.id}`);
        continue;
      }

      const storageMsg: StorageMessage = {
        id: uiMsg.id,
        role: uiMsg.role as StorageMessage['role'],
        content: uiMsg.content,
        timestamp: uiMsg.timestamp,
        chatId: chatId
      };

      // 保留标准字段
      if (uiMsg.name) storageMsg.name = uiMsg.name;
      if (uiMsg.tool_calls) storageMsg.tool_calls = uiMsg.tool_calls;
      if (uiMsg.tool_call_id) storageMsg.tool_call_id = uiMsg.tool_call_id;
      
      // 保留所有其他扩展字段 (由平台适配器决定如何处理)
      Object.keys(uiMsg).forEach(key => {
        if (!['id', 'role', 'content', 'timestamp', 'status', 'isStreaming', 'noticeType', 'errorCode'].includes(key)) {
          if (uiMsg[key] !== undefined) {
            storageMsg[key] = uiMsg[key];
          }
        }
      });

      result.data.push(storageMsg);
    }

    return result;
  }

  /**
   * 将持久化存储消息转换为UI展示格式
   * @param storageMessages 存储层消息数组
   * @returns 转换结果
   */
  static storageToUI(storageMessages: StorageMessage[]): ConversionResult<UIMessage> {
    const result: ConversionResult<UIMessage> = {
      success: true,
      data: [],
      errors: [],
      warnings: []
    };

    for (const storageMsg of storageMessages) {
      const uiMsg: UIMessage = {
        id: storageMsg.id,
        role: storageMsg.role,
        content: storageMsg.content,
        timestamp: storageMsg.timestamp,
        status: 'sent' // 从存储读取的消息都是已发送状态
      };

      // 保留标准字段
      if (storageMsg.name) uiMsg.name = storageMsg.name;
      if (storageMsg.tool_calls) uiMsg.tool_calls = storageMsg.tool_calls;
      if (storageMsg.tool_call_id) uiMsg.tool_call_id = storageMsg.tool_call_id;
      
      // 保留所有其他扩展字段 (让UI层决定如何显示)
      Object.keys(storageMsg).forEach(key => {
        if (!['id', 'role', 'content', 'timestamp', 'chatId', 'name', 'tool_calls', 'tool_call_id'].includes(key)) {
          if (storageMsg[key] !== undefined) {
            uiMsg[key] = storageMsg[key];
          }
        }
      });

      result.data.push(uiMsg);
    }

    return result;
  }

  // ===== 持久化层 → OpenAI标准API =====
  
  /**
   * 将持久化消息转换为OpenAI标准API格式
   * @param storageMessages 存储层消息数组
   * @returns 转换结果
   */
  static storageToOpenAI(storageMessages: StorageMessage[]): ConversionResult<ChatCompletionMessageParam> {
    const result: ConversionResult<ChatCompletionMessageParam> = {
      success: true,
      data: [],
      errors: [],
      warnings: []
    };

    for (const storageMsg of storageMessages) {
      // 验证消息有效性
      if (!this.isValidForAPI(storageMsg)) {
        result.warnings.push(`跳过无效消息: ${storageMsg.id}`);
        continue;
      }

      // 根据角色创建对应的OpenAI官方类型
      let apiMsg: ChatCompletionMessageParam;

      switch (storageMsg.role) {
        case 'system':
          apiMsg = {
            role: 'system',
            content: storageMsg.content,
            ...(storageMsg.name && { name: storageMsg.name })
          } as ChatCompletionSystemMessageParam;
          break;

        case 'user':
          apiMsg = {
            role: 'user',
            content: storageMsg.content,
            ...(storageMsg.name && { name: storageMsg.name })
          } as ChatCompletionUserMessageParam;
          break;

        case 'assistant':
          // OpenAI标准: assistant消息在有tool_calls时content可以为null
          const assistantMsg: ChatCompletionAssistantMessageParam = {
            role: 'assistant',
            content: storageMsg.content || null,
            ...(storageMsg.name && { name: storageMsg.name })
          };
          
          if (storageMsg.tool_calls && storageMsg.tool_calls.length > 0) {
            assistantMsg.tool_calls = storageMsg.tool_calls;
          }
          
          apiMsg = assistantMsg;
          break;

        case 'tool':
          if (!storageMsg.tool_call_id) {
            result.errors.push(`tool消息缺少tool_call_id: ${storageMsg.id}`);
            continue;
          }
          
          apiMsg = {
            role: 'tool',
            content: storageMsg.content,
            tool_call_id: storageMsg.tool_call_id
          } as ChatCompletionToolMessageParam;
          break;

        default:
          result.warnings.push(`未知的消息角色: ${storageMsg.role}`);
          continue;
      }

      result.data.push(apiMsg);
    }

    return result;
  }

  // ===== API响应 → UI层 =====
  
  /**
   * 将API响应转换为UI消息格式
   * @param apiResponse API响应数据
   * @param chatId 会话ID
   * @param additionalFields 附加字段 (由平台适配器提供)
   * @returns UI消息
   */
  static apiResponseToUI(
    apiResponse: any, 
    chatId: string, 
    additionalFields: Record<string, unknown> = {}
  ): UIMessage {
    const messageId = `${chatId}-assistant-${Date.now()}`;
    
    return {
      id: messageId,
      role: 'assistant',
      content: apiResponse.content || '',
      timestamp: Date.now(),
      status: 'sent',
      tool_calls: apiResponse.tool_calls,
      name: apiResponse.name,
      // 合并平台适配器提供的附加字段
      ...additionalFields
    };
  }

  // ===== 工具转换 =====
  
  /**
   * 将MCP工具转换为OpenAI标准工具格式
   * @param mcpTools MCP工具数组
   * @param additionalParams 附加参数 (由平台适配器提供)
   * @returns OpenAI标准工具格式
   */
  static mcpToolsToOpenAI(
    mcpTools: Tool[], 
    additionalParams: Record<string, unknown> = {}
  ): ChatCompletionTool[] {
    return mcpTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: {
          type: 'object' as const,
          properties: (tool.inputSchema as any)?.properties || {},
          required: (tool.inputSchema as any)?.required || [],
          ...(tool.inputSchema || {})
        },
        // 合并平台适配器提供的附加参数
        ...additionalParams
      }
    }));
  }

  // ===== 兼容性转换 =====
  
  /**
   * 将EnrichedMessage转换为UI格式 (向后兼容)
   */
  static enrichedToUI(enrichedMessages: EnrichedMessage[]): ConversionResult<UIMessage> {
    const result: ConversionResult<UIMessage> = {
      success: true,
      data: [],
      errors: [],
      warnings: []
    };

    for (const enrichedMsg of enrichedMessages) {
      const uiMsg: UIMessage = {
        id: enrichedMsg.id,
        role: enrichedMsg.role,
        content: enrichedMsg.content,
        timestamp: enrichedMsg.timestamp,
        status: 'sent'
      };

      // 处理特殊字段 (保持现有逻辑)
      if (enrichedMsg.role === 'assistant') {
        const assistantMsg = enrichedMsg as any;
        if (assistantMsg.tool_calls) uiMsg.tool_calls = assistantMsg.tool_calls;
      }

      if (enrichedMsg.role === 'tool') {
        const toolMsg = enrichedMsg as any;
        if (toolMsg.tool_call_id) uiMsg.tool_call_id = toolMsg.tool_call_id;
      }

      if (enrichedMsg.role === 'client-notice') {
        const noticeMsg = enrichedMsg as any;
        uiMsg.noticeType = noticeMsg.noticeType;
        uiMsg.errorCode = noticeMsg.errorCode;
      }

      // 保留所有其他字段
      Object.keys(enrichedMsg).forEach(key => {
        if (!['id', 'role', 'content', 'timestamp'].includes(key)) {
          if ((enrichedMsg as any)[key] !== undefined) {
            uiMsg[key] = (enrichedMsg as any)[key];
          }
        }
      });

      result.data.push(uiMsg);
    }

    return result;
  }

  // ===== 工具方法 =====
  
  /**
   * 验证消息是否适合发送到API
   * @param message 消息对象
   * @returns 是否有效
   */
  private static isValidForAPI(message: StorageMessage): boolean {
    if (!message.role) return false;
    
    // tool消息必须有tool_call_id
    if (message.role === 'tool') {
      return !!message.tool_call_id;
    }
    
    // assistant消息: 有content或tool_calls之一即可 (符合OpenAI标准)
    if (message.role === 'assistant') {
      return !!message.content || !!(message.tool_calls && message.tool_calls.length > 0);
    }
    
    // system和user消息必须有content
    return !!message.content;
  }

  /**
   * 清理消息序列，移除无效消息
   * @param messages 消息数组
   * @param cleanupRules 清理规则 (由调用者提供)
   * @returns 清理后的消息数组
   */
  static cleanMessages<T extends { role: string; content?: string; [key: string]: any }>(
    messages: T[], 
    cleanupRules: {
      removeClientNotice?: boolean;
      removeEmptyContent?: boolean;
      customFilter?: (msg: T) => boolean;
      fieldBlacklist?: string[];
    } = {}
  ): T[] {
    const {
      removeClientNotice = true,
      removeEmptyContent = true,
      customFilter,
      fieldBlacklist = []
    } = cleanupRules;

    return messages
      .filter(msg => {
        if (!msg.role) return false;
        if (removeClientNotice && msg.role === 'client-notice') return false;
        if (removeEmptyContent && !msg.content && msg.role !== 'assistant') return false;
        if (customFilter && !customFilter(msg)) return false;
        return true;
      })
      .map(msg => {
        const cleanMsg = { ...msg };
        
        // 移除黑名单字段
        fieldBlacklist.forEach(field => {
          delete cleanMsg[field];
        });
        
        // 移除空的tool_calls数组（避免API调用失败）
        if (cleanMsg.tool_calls && Array.isArray(cleanMsg.tool_calls) && cleanMsg.tool_calls.length === 0) {
          delete cleanMsg.tool_calls;
        }
        
        return cleanMsg;
      });
  }

  /**
   * 确保消息序列包含system消息
   * @param messages 消息数组
   * @param systemPrompt 系统提示词
   * @returns 包含system消息的数组
   */
  static ensureSystemMessage<T extends UIMessage | StorageMessage | ChatCompletionMessageParam>(
    messages: T[], 
    systemPrompt?: string
  ): T[] {
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage && systemPrompt) {
      const systemMessage = {
        id: 'system-' + Date.now(),
        role: 'system' as const,
        content: systemPrompt,
        timestamp: Date.now()
      } as T;
      
      return [systemMessage, ...messages];
    }
    
    return messages;
  }
}

// 导出便捷函数
export const {
  uiToStorage,
  storageToUI,
  storageToOpenAI,
  apiResponseToUI,
  mcpToolsToOpenAI,
  enrichedToUI,
  cleanMessages,
  ensureSystemMessage
} = MessageConverter;