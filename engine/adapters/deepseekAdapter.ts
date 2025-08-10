// engine/adapters/deepseekAdapter.ts
// DeepSeek平台适配器 - 处理DeepSeek特有的API格式和功能

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { StorageMessage, UIMessage } from '../utils/messageConverter';
import { MessageConverter } from '../utils/messageConverter';
import type { LLMConfig } from '../utils/llms';

// DeepSeek特有的消息接口
export interface DeepSeekMessageParam {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  // DeepSeek Chat Prefix Completion (Beta) 字段
  prefix?: boolean;
  // 注意：reasoning_content 只在响应中出现，请求中不应包含
}

// DeepSeek API响应格式
export interface DeepSeekAssistantResponse {
  role: 'assistant';
  content: string | null;
  tool_calls?: any[];
  reasoning_content?: string; // DeepSeek推理内容
}

/**
 * DeepSeek平台适配器
 * 处理DeepSeek API的特殊需求和格式转换
 */
export class DeepSeekAdapter {
  
  /**
   * 检查LLM配置是否为DeepSeek
   * @param llmConfig LLM配置
   * @returns 是否为DeepSeek
   */
  static isDeepSeekLLM(llmConfig: LLMConfig): boolean {
    return llmConfig.id === 'deepseek' || 
           (llmConfig.provider && llmConfig.provider.toLowerCase().includes('deepseek')) ||
           (llmConfig.baseUrl && llmConfig.baseUrl.includes('deepseek'));
  }

  /**
   * 检查模型是否支持推理内容
   * @param model 模型名称
   * @returns 是否支持reasoning_content
   */
  static supportsReasoning(model: string): boolean {
    return model.includes('deepseek-reasoner');
  }

  /**
   * 将存储消息转换为DeepSeek API格式
   * @param storageMessages 存储消息数组
   * @param options 转换选项
   * @returns DeepSeek API消息数组
   */
  static storageToDeepSeek(
    storageMessages: StorageMessage[],
    options: {
      enablePrefix?: boolean;
      prefixMessageIndex?: number;
    } = {}
  ): DeepSeekMessageParam[] {
    const { enablePrefix = false, prefixMessageIndex } = options;
    
    // 先转换为标准OpenAI格式
    const openAIResult = MessageConverter.storageToOpenAI(storageMessages);
    
    return openAIResult.data.map((msg, index) => {
      const deepSeekMsg: DeepSeekMessageParam = { ...msg };
      
      // DeepSeek Chat Prefix Completion (Beta)
      // 只在指定的assistant消息上设置prefix
      if (enablePrefix && 
          (prefixMessageIndex === index || (prefixMessageIndex === undefined && index === openAIResult.data.length - 1)) &&
          msg.role === 'assistant' && 
          msg.content) {
        deepSeekMsg.prefix = true;
      }
      
      return deepSeekMsg;
    });
  }

  /**
   * 处理DeepSeek API响应，转换为UI格式
   * @param apiResponse DeepSeek API响应
   * @param chatId 会话ID
   * @returns UI消息
   */
  static responseToUI(apiResponse: DeepSeekAssistantResponse, chatId: string): UIMessage {
    const additionalFields: Record<string, unknown> = {};
    
    // 添加DeepSeek特有的推理内容
    if (apiResponse.reasoning_content) {
      additionalFields.reasoning_content = apiResponse.reasoning_content;
    }
    
    return MessageConverter.apiResponseToUI(apiResponse, chatId, additionalFields);
  }

  /**
   * 清理消息用于DeepSeek API调用
   * @param messages 消息数组
   * @returns 清理后的消息数组
   */
  static cleanForDeepSeek<T extends { role: string; content?: string; [key: string]: any }>(
    messages: T[]
  ): T[] {
    return MessageConverter.cleanMessages(messages, {
      removeClientNotice: true,
      removeEmptyContent: true,
      // 重要：移除DeepSeek API请求中不应包含的字段
      // 根据DeepSeek文档: "如果reasoning_content字段包含在输入消息序列中，API将返回400错误"
      fieldBlacklist: ['reasoning_content']
    }).map(msg => {
      // 额外处理：确保移除空的tool_calls数组
      const cleanMsg = { ...msg };
      if (cleanMsg.tool_calls && Array.isArray(cleanMsg.tool_calls) && cleanMsg.tool_calls.length === 0) {
        delete cleanMsg.tool_calls;
      }
      return cleanMsg;
    });
  }

  /**
   * 验证DeepSeek API参数
   * @param messages 消息数组
   * @param model 模型名称
   * @returns 验证结果
   */
  static validateParams(messages: DeepSeekMessageParam[], model: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查prefix使用
    const prefixMessages = messages.filter(msg => (msg as any).prefix);
    if (prefixMessages.length > 1) {
      errors.push('最多只能有一个消息设置prefix=true');
    }
    
    if (prefixMessages.length === 1) {
      const prefixMsg = prefixMessages[0];
      if (prefixMsg.role !== 'assistant') {
        errors.push('只有assistant消息可以设置prefix=true');
      }
      if (!prefixMsg.content) {
        errors.push('设置prefix=true的消息必须有content');
      }
    }
    
    // 检查reasoning模型
    if (this.supportsReasoning(model)) {
      warnings.push('使用推理模型，响应将包含reasoning_content字段');
    }
    
    // 检查reasoning_content是否意外包含在请求中
    const hasReasoningContent = messages.some(msg => (msg as any).reasoning_content);
    if (hasReasoningContent) {
      errors.push('请求消息中不应包含reasoning_content字段');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取DeepSeek API的特殊参数
   * @param model 模型名称
   * @param enablePrefix 是否启用prefix completion
   * @returns API参数
   */
  static getAPIParams(model: string, enablePrefix = false): {
    baseURL?: string;
    additionalHeaders?: Record<string, string>;
  } {
    const params: ReturnType<typeof DeepSeekAdapter.getAPIParams> = {};
    
    // Chat Prefix Completion需要使用beta端点
    if (enablePrefix) {
      params.baseURL = 'https://api.deepseek.com/beta';
    }
    
    return params;
  }
}

// 导出便捷函数
export const {
  isDeepSeekLLM,
  supportsReasoning,
  storageToDeepSeek,
  responseToUI,
  cleanForDeepSeek,
  validateParams,
  getAPIParams
} = DeepSeekAdapter;