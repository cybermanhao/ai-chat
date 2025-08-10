// engine/adapters/modelAdapterManager.ts
// 统一模型适配器管理器 - 根据模型和LLM配置自动选择适配器

import type { 
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionCreateParams
} from 'openai/resources/chat/completions';
import type { StorageMessage, UIMessage } from '../utils/messageConverter';
import type { Tool } from '../service/mcpClient';
import type { LLMConfig } from '../utils/llms';
import { OpenAIAdapter } from './openaiAdapter';
import { DeepSeekAdapter, type DeepSeekMessageParam, type DeepSeekAssistantResponse } from './deepseekAdapter';
import type { 
  UnifiedLLMResponse, 
  UnifiedLLMChunk, 
  LLMAPIResponse,
  LLMStreamEvent,
  LLMStreamConfig
} from '../types/llmResponse';

// 联合类型定义
export type UnifiedMessageParam = ChatCompletionMessageParam | DeepSeekMessageParam;
export type UnifiedAPIResponse = UnifiedLLMResponse;

// 模型适配器类型枚举
export enum ModelAdapterType {
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  OPENAI_COMPATIBLE = 'openai-compatible'
}

// 统一的LLM配置参数
export interface UnifiedLLMParams {
  llmConfig: LLMConfig;
  model: string;
  messages: StorageMessage[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  parallelToolCalls?: boolean;
  // DeepSeek特有选项
  enablePrefix?: boolean;
  prefixMessageIndex?: number;
  // OpenAI特有选项
  enableStrict?: boolean;
  responseFormat?: any;
}

// 模型适配器管理器
export class ModelAdapterManager {
  
  /**
   * 根据LLM配置和模型名称自动识别适配器类型
   * @param llmConfig LLM配置
   * @param model 模型名称
   * @returns 适配器类型
   */
  static detectAdapterType(llmConfig: LLMConfig, model?: string): ModelAdapterType {
    // 优先根据模型名称判断
    if (model && model.includes('deepseek')) {
      return ModelAdapterType.DEEPSEEK;
    }
    
    // 根据LLM配置判断
    if (DeepSeekAdapter.isDeepSeekLLM(llmConfig)) {
      return ModelAdapterType.DEEPSEEK;
    }
    
    if (OpenAIAdapter.isOfficialOpenAI(llmConfig)) {
      return ModelAdapterType.OPENAI;
    }
    
    if (OpenAIAdapter.isOpenAICompatible(llmConfig)) {
      return ModelAdapterType.OPENAI_COMPATIBLE;
    }
    
    // 默认使用OpenAI兼容模式
    return ModelAdapterType.OPENAI_COMPATIBLE;
  }

  /**
   * 统一的消息转换接口
   * @param params 统一参数
   * @returns 转换后的API消息数组
   */
  static convertMessages(params: UnifiedLLMParams): UnifiedMessageParam[] {
    const adapterType = this.detectAdapterType(params.llmConfig, params.model);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        return DeepSeekAdapter.storageToDeepSeek(params.messages, {
          enablePrefix: params.enablePrefix,
          prefixMessageIndex: params.prefixMessageIndex
        });
        
      case ModelAdapterType.OPENAI:
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return OpenAIAdapter.storageToOpenAI(params.messages);
    }
  }

  /**
   * 统一的工具转换接口
   * @param params 统一参数
   * @returns 转换后的API工具数组
   */
  static convertTools(params: UnifiedLLMParams): ChatCompletionTool[] {
    if (!params.tools || params.tools.length === 0) {
      return [];
    }

    const adapterType = this.detectAdapterType(params.llmConfig, params.model);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        // DeepSeek使用OpenAI兼容的工具格式
        return OpenAIAdapter.mcpToolsToOpenAI(params.tools, {
          enableStrict: false, // DeepSeek不支持Structured Outputs
          enableParallel: params.parallelToolCalls
        });
        
      case ModelAdapterType.OPENAI:
        return OpenAIAdapter.mcpToolsToOpenAI(params.tools, {
          enableStrict: params.enableStrict,
          enableParallel: params.parallelToolCalls
        });
        
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return OpenAIAdapter.mcpToolsToOpenAI(params.tools, {
          enableStrict: false, // 兼容模式不使用Structured Outputs
          enableParallel: params.parallelToolCalls
        });
    }
  }

  /**
   * 统一的消息清理接口
   * @param params 统一参数
   * @returns 清理后的消息数组
   */
  static cleanMessages<T extends { role: string; content?: string; [key: string]: any }>(
    messages: T[],
    llmConfig: LLMConfig
  ): T[] {
    const adapterType = this.detectAdapterType(llmConfig);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        return DeepSeekAdapter.cleanForDeepSeek(messages);
        
      case ModelAdapterType.OPENAI:
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return OpenAIAdapter.cleanForOpenAI(messages);
    }
  }

  /**
   * 统一的API响应转换接口
   * @param apiResponse API响应
   * @param chatId 会话ID
   * @param llmConfig LLM配置
   * @returns UI消息
   */
  static convertResponse(
    apiResponse: UnifiedAPIResponse,
    chatId: string,
    llmConfig: LLMConfig
  ): UIMessage {
    const adapterType = this.detectAdapterType(llmConfig);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        return DeepSeekAdapter.responseToUI(apiResponse as DeepSeekAssistantResponse, chatId);
        
      case ModelAdapterType.OPENAI:
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return OpenAIAdapter.responseToUI(apiResponse, chatId);
    }
  }

  /**
   * 统一的参数验证接口
   * @param params 统一参数
   * @returns 验证结果
   */
  static validateParams(params: UnifiedLLMParams): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const adapterType = this.detectAdapterType(params.llmConfig);
    const messages = this.convertMessages(params);
    const tools = this.convertTools(params);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        return DeepSeekAdapter.validateParams(
          messages as DeepSeekMessageParam[], 
          params.model
        );
        
      case ModelAdapterType.OPENAI:
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return OpenAIAdapter.validateParams(
          messages as ChatCompletionMessageParam[],
          tools,
          {
            parallel_tool_calls: params.parallelToolCalls,
            response_format: params.responseFormat
          }
        );
    }
  }

  /**
   * 构建统一的API请求参数
   * @param params 统一参数
   * @returns API请求参数
   */
  static buildAPIParams(params: UnifiedLLMParams): ChatCompletionCreateParams {
    const messages = this.convertMessages(params);
    const tools = this.convertTools(params);
    const adapterType = this.detectAdapterType(params.llmConfig);
    
    const baseParams = {
      model: params.model,
      messages: messages as ChatCompletionMessageParam[],
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      stream: true
    };

    // 添加工具参数
    if (tools.length > 0) {
      (baseParams as any).tools = tools;
      
      // 处理并行工具调用
      if (params.parallelToolCalls !== undefined) {
        (baseParams as any).parallel_tool_calls = params.parallelToolCalls;
      }
    }

    // 平台特有参数
    switch (adapterType) {
      case ModelAdapterType.OPENAI:
        if (params.responseFormat) {
          (baseParams as any).response_format = params.responseFormat;
        }
        break;
        
      case ModelAdapterType.DEEPSEEK:
        // DeepSeek特有参数由适配器在底层处理
        break;
    }

    return baseParams as ChatCompletionCreateParams;
  }

  /**
   * 获取平台特定的API配置
   * @param params 统一参数
   * @returns API配置
   */
  static getAPIConfig(params: UnifiedLLMParams): {
    baseURL: string;
    additionalHeaders?: Record<string, string>;
  } {
    const adapterType = this.detectAdapterType(params.llmConfig);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        const deepseekConfig = DeepSeekAdapter.getAPIParams(
          params.model, 
          params.enablePrefix
        );
        return {
          baseURL: deepseekConfig.baseURL || params.llmConfig.baseUrl,
          additionalHeaders: deepseekConfig.additionalHeaders
        };
        
      case ModelAdapterType.OPENAI:
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return {
          baseURL: params.llmConfig.baseUrl
        };
    }
  }

  /**
   * 获取模型能力信息
   * @param model 模型名称
   * @param llmConfig LLM配置
   * @returns 模型能力
   */
  static getModelCapabilities(model: string, llmConfig: LLMConfig): {
    supportsTools: boolean;
    supportsStructuredOutputs: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
    supportsReasoning?: boolean;
    supportsPrefix?: boolean;
    maxTokens: number;
  } {
    const adapterType = this.detectAdapterType(llmConfig);
    
    switch (adapterType) {
      case ModelAdapterType.DEEPSEEK:
        return {
          supportsTools: true,
          supportsStructuredOutputs: false,
          supportsVision: false,
          supportsStreaming: true,
          supportsReasoning: DeepSeekAdapter.supportsReasoning(model),
          supportsPrefix: true,
          maxTokens: 128000 // DeepSeek默认上下文长度
        };
        
      case ModelAdapterType.OPENAI:
        return OpenAIAdapter.getModelCapabilities(model);
        
      case ModelAdapterType.OPENAI_COMPATIBLE:
      default:
        return {
          supportsTools: true,
          supportsStructuredOutputs: false,
          supportsVision: false,
          supportsStreaming: true,
          maxTokens: 4096
        };
    }
  }
}

// 导出便捷函数
export const {
  detectAdapterType,
  convertMessages,
  convertTools,
  cleanMessages,
  convertResponse,
  validateParams,
  buildAPIParams,
  getAPIConfig,
  getModelCapabilities
} = ModelAdapterManager;