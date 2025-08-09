/**
 * ================================================================================
 * 注意：此文件已被废弃，迁移到 MessageBridgeV2 系统
 * ================================================================================
 * 
 * 迁移说明：
 * - V1 系统：messageBridgeInstance.ts → MessageBridge (旧)
 * - V2 系统：messageBridgeFactoryV2.ts → MessageBridgeV2 (新)
 * 
 * 已完成的迁移文件：
 * - web/src/store/mcpStore.ts
 * - web/src/debug-messagebridge.ts  
 * - web/src/pages/Debug/index.tsx
 * - web/src/services/messageBridgeInstance.ts
 * - web/src/test-messagebridge.js
 * 
 * V2 系统优势：
 * - 使用新的 runtimeContext 统一环境检测
 * - 自动检测环境，无需手动指定
 * - 与 TaskLoop 系统保持一致
 * 
 * 迁移时间：2025-01-09
 * ================================================================================
 */

// 错误提示：引导用户使用新的 V2 系统
console.warn(
  '⚠️ messageBridgeInstance.ts 已废弃！请使用 messageBridgeFactoryV2.ts (MessageBridgeV2)'
);

// 保持原有实现以确保兼容性，但不推荐继续使用
import { MessageBridge, type MessageBridgeOptions } from './messagebridge';
import { llmService } from './llmService';
import { detectRuntimeMode } from '../utils/envDetect';

// 创建 MessageBridge 实例的工厂函数 (已废弃，请使用 V2)
export function createMessageBridge(envOrOptions?: string | MessageBridgeOptions, options?: any): MessageBridge {
  let bridgeOptions: MessageBridgeOptions;
  
  // 支持多种调用方式：
  // 1. createMessageBridge() - 自动检测环境，默认为web
  // 2. createMessageBridge('web', { mcpClient, llmService })
  // 3. createMessageBridge({ env: 'web', mcpClient, llmService })
  if (!envOrOptions) {
    // 自动检测环境，默认为web
    const detectedEnv = detectRuntimeMode();
    bridgeOptions = {
      env: detectedEnv === 'web' ? 'web' : detectedEnv, // web是默认，其他环境才替换
      ...options,
    };
  } else if (typeof envOrOptions === 'string') {
    bridgeOptions = {
      env: envOrOptions,
      ...options,
    };
  } else {
    bridgeOptions = envOrOptions;
    // 如果没有明确指定环境，进行自动检测，默认web
    if (!bridgeOptions.env) {
      const detectedEnv = detectRuntimeMode();
      bridgeOptions.env = detectedEnv === 'web' ? 'web' : detectedEnv;
    }
  }
  
  console.log(`[MessageBridge] 检测到运行环境: ${bridgeOptions.env}`);
  
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

// SSC HTTP 适配器
function createSSCLLMServiceAdapter(baseLLMService?: any) {
  // SSC模式下的HTTP端点配置
  // 在浏览器环境中，通过globalThis获取配置或使用默认值
  const SSC_BASE_URL = (globalThis as any).SSC_API_BASE_URL || 
                       (typeof process !== 'undefined' && process.env?.SSC_API_BASE_URL) || 
                       'http://localhost:8080';
  const SSC_API_ENDPOINT = `${SSC_BASE_URL}/api/llm/chat`;
  const SSC_ABORT_ENDPOINT = `${SSC_BASE_URL}/api/llm/abort`;
  
  console.log(`[SSC LLMService] 配置API端点: ${SSC_API_ENDPOINT}`);
  
  return {
    async send(type: string, payload: any, callback: (msg: any) => void) {
      if (type !== 'message/llm/chat') {
        console.warn('SSC LLMService adapter: 仅支持 message/llm/chat');
        return;
      }
      
      try {
        console.log(`[SSC LLMService] 发送请求到: ${SSC_API_ENDPOINT}`);
        console.log(`[SSC LLMService] 请求参数:`, payload);
        
        // 使用fetch进行HTTP请求
        const response = await fetch(SSC_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream', // SSE格式
          },
          body: JSON.stringify({
            chatId: payload.chatId,
            messages: payload.messages,
            model: payload.model,
            temperature: payload.temperature,
            tools: payload.tools,
            parallelToolCalls: payload.parallelToolCalls,
            // 注意：SSC模式下不传递apiKey，由后端管理
          }),
          signal: payload.signal, // 支持中断
        });
        
        if (!response.ok) {
          throw new Error(`SSC API请求失败: ${response.status} ${response.statusText}`);
        }
        
        if (!response.body) {
          throw new Error('SSC API响应没有body');
        }
        
        console.log(`[SSC LLMService] 开始处理SSE流`);
        
        // 处理SSE流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  console.log(`[SSC LLMService] 流结束`);
                  continue;
                }
                
                try {
                  const event = JSON.parse(data);
                  console.log(`[SSC LLMService] 收到事件:`, event.type);
                  callback(event);
                } catch (e) {
                  console.warn(`[SSC LLMService] 解析SSE数据失败:`, data, e);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error(`[SSC LLMService] 请求失败:`, error);
        callback({ 
          type: 'error', 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    },
    
    async abort(type: string, payload: any, callback: (msg: any) => void) {
      try {
        console.log(`[SSC LLMService] 发送中断请求到: ${SSC_ABORT_ENDPOINT}`);
        
        const response = await fetch(SSC_ABORT_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: payload.chatId,
          }),
        });
        
        if (response.ok) {
          console.log(`[SSC LLMService] 中断请求成功`);
          callback({ type: 'abort', ...payload });
        } else {
          console.warn(`[SSC LLMService] 中断请求失败: ${response.status}`);
          callback({ type: 'error', error: `中断请求失败: ${response.status}` });
        }
      } catch (error) {
        console.error(`[SSC LLMService] 中断请求异常:`, error);
        callback({ type: 'error', error: String(error) });
      }
    }
  };
}

// 保留原有的默认实例，用于向后兼容
export const messageBridge = createMessageBridge({
  env: 'web',
  mcpClient: null,
  llmService: null,
});