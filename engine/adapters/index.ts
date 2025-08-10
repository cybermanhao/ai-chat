// engine/adapters/index.ts
// 模型适配器统一导出

// 分别导出各个适配器以避免重名冲突
export { OpenAIAdapter } from './openaiAdapter';
export { DeepSeekAdapter } from './deepseekAdapter';
export { ModelAdapterManager, ModelAdapterType } from './modelAdapterManager';
export type { 
  UnifiedLLMParams, 
  UnifiedMessageParam, 
  UnifiedAPIResponse 
} from './modelAdapterManager';
export type { UIMessage, StorageMessage } from '../utils/messageConverter';
export type * from '../types/llmResponse';