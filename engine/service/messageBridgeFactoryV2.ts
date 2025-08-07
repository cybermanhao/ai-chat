// MessageBridge 工厂 V2 - 基于集中环境判断的简化工厂
import { MessageBridgeV2, type MessageBridgeOptions } from './messageBridgeV2';
import { getRuntimeContext, getDebugInfo } from '../utils/runtimeContext';

// 简化的工厂函数 - 不再需要手动指定环境
export function createMessageBridge(options: MessageBridgeOptions = {}): MessageBridgeV2 {
  const context = getRuntimeContext();
  
  console.log('[MessageBridge Factory] 自动检测环境:', {
    mode: context.mode,
    processType: context.processType,
    capabilities: context.capabilities,
  });
  
  // 在开发模式下输出详细调试信息
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[MessageBridge Factory] 调试信息:', getDebugInfo());
  }
  
  return new MessageBridgeV2(options);
}

// 兼容性：保持旧版本接口，但忽略env参数
export function createMessageBridgeLegacy(
  envOrOptions?: string | MessageBridgeOptions, 
  options?: MessageBridgeOptions
): MessageBridgeV2 {
  let bridgeOptions: MessageBridgeOptions;
  
  if (typeof envOrOptions === 'string') {
    // 旧版本调用方式：createMessageBridge('web', { mcpClient, llmService })
    console.warn('[MessageBridge Factory] 使用了已废弃的env参数，将自动检测环境');
    bridgeOptions = options || {};
  } else {
    // 新版本调用方式：createMessageBridge({ mcpClient, llmService })
    bridgeOptions = envOrOptions || {};
  }
  
  return createMessageBridge(bridgeOptions);
}

// 默认实例 - 用于向后兼容
export const messageBridge = createMessageBridge();