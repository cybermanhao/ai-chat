// V1 to V2 Migration: 使用新的 MessageBridgeV2 和 runtimeContext 系统
import { createMessageBridge } from '@engine/service/messageBridgeFactoryV2';
import { mcpClientManager } from '@/store/mcpStore';
import { llmService } from '@engine/service/llmService';
import { getRuntimeMode } from '@engine/utils/runtimeContext';
 
// V2 自动检测环境，根据环境决定是否注入 llmService
// 在Electron渲染进程中，不注入llmService以使用IPC通信
const runtimeMode = getRuntimeMode();
const shouldInjectLLMService = runtimeMode === 'web' || runtimeMode === 'ssc';

export const messageBridge = createMessageBridge({
  mcpClient: mcpClientManager,
  llmService: shouldInjectLLMService ? llmService : undefined,
}); 