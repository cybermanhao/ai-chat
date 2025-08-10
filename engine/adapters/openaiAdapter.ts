// engine/adapters/openaiAdapter.ts
// OpenAI平台适配器 - 处理OpenAI标准API和特殊功能

import type { 
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionCreateParams
} from 'openai/resources/chat/completions';
import type { StorageMessage, UIMessage } from '../utils/messageConverter';
import { MessageConverter } from '../utils/messageConverter';
import type { Tool } from '../service/mcpClient';
import type { LLMConfig } from '../utils/llms';

/**
 * OpenAI平台适配器
 * 处理OpenAI API的标准功能和高级特性
 */
export class OpenAIAdapter {
  
  /**
   * 检查LLM配置是否为OpenAI兼容
   * @param llmConfig LLM配置
   * @returns 是否为OpenAI兼容
   */
  static isOpenAICompatible(llmConfig: LLMConfig): boolean {
    return llmConfig.isOpenAICompatible;
  }

  /**
   * 检查是否为官方OpenAI
   * @param llmConfig LLM配置
   * @returns 是否为官方OpenAI
   */
  static isOfficialOpenAI(llmConfig: LLMConfig): boolean {
    return llmConfig.id === 'openai' || 
           (llmConfig.provider && llmConfig.provider.toLowerCase() === 'openai') ||
           (llmConfig.baseUrl && llmConfig.baseUrl.includes('api.openai.com'));
  }

  /**
   * 将存储消息转换为OpenAI API格式
   * @param storageMessages 存储消息数组
   * @returns OpenAI API消息数组
   */
  static storageToOpenAI(storageMessages: StorageMessage[]): ChatCompletionMessageParam[] {
    const result = MessageConverter.storageToOpenAI(storageMessages);
    if (!result.success || result.errors.length > 0) {
      console.warn('[OpenAIAdapter] 消息转换警告:', result.warnings);
      if (result.errors.length > 0) {
        console.error('[OpenAIAdapter] 消息转换错误:', result.errors);
      }
    }
    return result.data;
  }

  /**
   * 将MCP工具转换为OpenAI工具格式
   * @param mcpTools MCP工具数组
   * @param options 转换选项
   * @returns OpenAI工具数组
   */
  static mcpToolsToOpenAI(
    mcpTools: Tool[],
    options: {
      enableStrict?: boolean; // Structured Outputs
      enableParallel?: boolean; // 并行工具调用
    } = {}
  ): ChatCompletionTool[] {
    const { enableStrict = false } = options;
    
    const additionalParams = enableStrict ? { strict: true } : {};
    return MessageConverter.mcpToolsToOpenAI(mcpTools, additionalParams);
  }

  /**
   * 处理OpenAI API响应，转换为UI格式
   * @param apiResponse OpenAI API响应
   * @param chatId 会话ID
   * @returns UI消息
   */
  static responseToUI(apiResponse: any, chatId: string): UIMessage {
    return MessageConverter.apiResponseToUI(apiResponse, chatId);
  }

  /**
   * 清理消息用于OpenAI API调用
   * @param messages 消息数组
   * @returns 清理后的消息数组
   */
  static cleanForOpenAI<T extends { role: string; content?: string; [key: string]: any }>(
    messages: T[]
  ): T[] {
    return MessageConverter.cleanMessages(messages, {
      removeClientNotice: true,
      removeEmptyContent: true,
      // 移除OpenAI API不支持的字段
      fieldBlacklist: ['reasoning_content', 'prefix']
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
   * 验证OpenAI API参数
   * @param messages 消息数组
   * @param tools 工具数组
   * @param options API选项
   * @returns 验证结果
   */
  static validateParams(
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[],
    options: {
      parallel_tool_calls?: boolean;
      response_format?: any;
    } = {}
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 检查消息序列
    if (messages.length === 0) {
      errors.push('消息数组不能为空');
    }
    
    // 检查Structured Outputs和并行工具调用的兼容性
    if (options.parallel_tool_calls && tools?.some(tool => (tool.function as any).strict)) {
      warnings.push('Structured Outputs与并行工具调用不兼容，建议设置parallel_tool_calls=false');
    }
    
    // 检查tool消息是否有对应的tool_call
    const toolMessages = messages.filter(msg => msg.role === 'tool') as any[];
    const assistantMessages = messages.filter(msg => msg.role === 'assistant') as any[];
    
    const toolCallIds = new Set(
      assistantMessages
        .flatMap(msg => msg.tool_calls || [])
        .map((call: any) => call.id)
        .filter(Boolean)
    );
    
    for (const toolMsg of toolMessages) {
      if (!toolCallIds.has(toolMsg.tool_call_id)) {
        warnings.push(`tool消息的tool_call_id "${toolMsg.tool_call_id}" 没有对应的tool_call`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 构建OpenAI API请求参数
   * @param messages 消息数组
   * @param options 请求选项
   * @returns API请求参数
   */
  static buildAPIParams(
    messages: ChatCompletionMessageParam[],
    options: {
      model: string;
      tools?: ChatCompletionTool[];
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
      parallel_tool_calls?: boolean;
      response_format?: any;
      [key: string]: any;
    }
  ): ChatCompletionCreateParams {
    const { model, tools, ...otherOptions } = options;
    
    const params: ChatCompletionCreateParams = {
      model,
      messages,
      ...otherOptions
    };
    
    // 只在有工具时添加tools参数
    if (tools && tools.length > 0) {
      params.tools = tools;
    }
    
    // 处理并行工具调用设置
    if (tools && tools.length > 0 && options.parallel_tool_calls !== undefined) {
      params.parallel_tool_calls = options.parallel_tool_calls;
    }
    
    return params;
  }

  /**
   * 检查模型是否支持特定功能
   * @param model 模型名称
   * @returns 功能支持情况
   */
  static getModelCapabilities(model: string): {
    supportsTools: boolean;
    supportsStructuredOutputs: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
    maxTokens: number;
  } {
    const capabilities = {
      supportsTools: true,
      supportsStructuredOutputs: false,
      supportsVision: false,
      supportsStreaming: true,
      maxTokens: 4096
    };
    
    // GPT-4系列
    if (model.startsWith('gpt-4')) {
      capabilities.supportsStructuredOutputs = model >= 'gpt-4-0613';
      capabilities.supportsVision = model.includes('vision') || model.includes('gpt-4o');
      capabilities.maxTokens = model.includes('32k') ? 32768 : 
                              model.includes('128k') ? 128000 : 
                              model.includes('gpt-4o') ? 128000 : 8192;
    }
    
    // GPT-3.5系列
    if (model.startsWith('gpt-3.5')) {
      capabilities.supportsStructuredOutputs = model >= 'gpt-3.5-turbo-0613';
      capabilities.maxTokens = model.includes('16k') ? 16384 : 4096;
    }
    
    return capabilities;
  }
}

// 导出便捷函数
export const {
  isOpenAICompatible,
  isOfficialOpenAI,
  storageToOpenAI,
  mcpToolsToOpenAI,
  responseToUI,
  cleanForOpenAI,
  validateParams,
  buildAPIParams,
  getModelCapabilities
} = OpenAIAdapter;