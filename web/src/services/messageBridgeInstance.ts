import { createMessageBridge } from '@engine/service/messageBridgeInstance';
import { mcpClientManager } from '@/store/mcpStore';
import { llmService } from '@engine/service/llmService';
 
export const messageBridge = createMessageBridge('web', {
  mcpClient: mcpClientManager,
  llmService: llmService,
}); 