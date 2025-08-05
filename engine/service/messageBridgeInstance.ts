import { MessageBridge, type MessageBridgeOptions } from './messagebridge';
import { llmService } from './llmService';

// 创建 MessageBridge 实例的工厂函数
export function createMessageBridge(envOrOptions: string | MessageBridgeOptions, options?: any): MessageBridge {
  let bridgeOptions: MessageBridgeOptions;
  
  // 兼容两种调用方式：
  // 1. createMessageBridge('web', { mcpClient, llmService })
  // 2. createMessageBridge({ env: 'web', mcpClient, llmService })
  if (typeof envOrOptions === 'string') {
    bridgeOptions = {
      env: envOrOptions,
      ...options,
    };
  } else {
    bridgeOptions = envOrOptions;
  }
  
  // 根据环境创建适配的 llmService
  const adaptedLLMService = createLLMServiceAdapter(bridgeOptions.env, bridgeOptions.llmService);
  
  return new MessageBridge({
    ...bridgeOptions,
    llmService: adaptedLLMService,
  });
}

// LLM 服务适配器工厂
function createLLMServiceAdapter(env: string, providedLLMService?: any) {
  switch (env) {
    case 'web':
      // Web 环境：直接使用导入的 llmService
      return providedLLMService || llmService;
      
    case 'electron':
      // Electron 环境：创建 IPC 适配器
      return createElectronLLMServiceAdapter(providedLLMService);
      
    case 'ssc':
      // SSC 环境：创建 HTTP 适配器
      return createSSCLLMServiceAdapter(providedLLMService);
      
    default:
      console.warn(`未知环境: ${env}，使用默认 Web 适配器`);
      return providedLLMService || llmService;
  }
}

// Electron IPC 适配器
function createElectronLLMServiceAdapter(baseLLMService?: any) {
  // 检查是否在 Electron 环境中
  const isElectronRenderer = typeof window !== 'undefined' && (window as any).electronAPI;
  const isElectronMain = typeof process !== 'undefined' && process.versions && process.versions.electron;
  
  if (isElectronRenderer) {
    // 渲染进程：通过 IPC 发送到主进程
    return {
      send(type: string, payload: any, callback: (msg: any) => void) {
        if (type !== 'message/llm/chat') {
          console.warn('Electron LLMService adapter: 仅支持 message/llm/chat');
          return;
        }
        
        // 使用 preload.js 暴露的流式 API
        const electronAPI = (window as any).electronAPI;
        const stream = electronAPI.createStream('chat:stream', payload);
        
        // 注册流事件监听器，匹配 preload.js 中的方法名
        stream.onChunk((chunk: any) => {
          callback({ type: 'chunk', ...chunk });
        });
        
        stream.onStatus((status: any) => {
          callback({ type: 'status', ...status });
        });
        
        stream.onDone((result: any) => {
          callback({ type: 'done', ...result });
        });
        
        stream.onError((error: any) => {
          callback({ type: 'error', ...error });
        });
        
        stream.onAbort(() => {
          callback({ type: 'abort' });
        });
      },
      
      abort(type: string, payload: any, callback: (msg: any) => void) {
        // TODO: 实现 Electron IPC 中断逻辑
        // 可以通过 electronAPI.send('chat:abort', payload) 实现
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && electronAPI.send) {
          electronAPI.send('chat:abort', payload);
        }
        callback({ type: 'abort', ...payload });
      }
    };
  } else if (isElectronMain) {
    // 主进程：直接使用基础 llmService 或导入的 llmService
    return baseLLMService || llmService;
  } else {
    console.warn('不在 Electron 环境中，回退到基础 llmService');
    return baseLLMService || llmService;
  }
}

// SSC HTTP 适配器（预留）
function createSSCLLMServiceAdapter(baseLLMService?: any) {
  return {
    send(type: string, payload: any, callback: (msg: any) => void) {
      if (type !== 'message/llm/chat') {
        console.warn('SSC LLMService adapter: 仅支持 message/llm/chat');
        return;
      }
      
      // TODO: 实现 SSC HTTP 通信逻辑
      console.warn('SSC LLMService adapter 尚未实现');
      callback({ type: 'error', error: 'SSC adapter not implemented' });
    },
    
    abort(type: string, payload: any, callback: (msg: any) => void) {
      callback({ type: 'abort', ...payload });
    }
  };
}

// 保留原有的默认实例，用于向后兼容
export const messageBridge = createMessageBridge({
  env: 'web',
  mcpClient: null,
  llmService: null,
}); 