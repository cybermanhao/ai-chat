// MessageBridge V2 - 基于集中环境判断的简化实现
import { getRuntimeContext, needsLLMProxy, needsMCPProxy, getLLMProxyType, getMCPProxyType } from '../utils/runtimeContext';

export type MessageBridgeEvent =
  | 'chunk'
  | 'toolcall'
  | 'toolresult'
  | 'status'
  | 'done'
  | 'error'
  | 'abort';

export interface MessageBridgeOptions {
  mcpClient?: any;
  llmService?: any;
  [key: string]: any;
}

export class MessageBridgeV2 {
  private mcpClient: any;
  private llmService: any;
  private listeners: Map<MessageBridgeEvent, Array<(payload: any) => void>> = new Map();
  private context = getRuntimeContext();
  
  // Web模式的增量状态跟踪（用于处理streamHandler的累积内容）
  private webModeState = {
    previousContent: '',
    previousReasoningContent: '',
    previousPhase: '',
    emittedToolCallIds: new Set<string>(), // 跟踪已发出的tool_calls，避免重复
  };

  constructor(options: MessageBridgeOptions = {}) {
    this.mcpClient = options.mcpClient;
    this.llmService = options.llmService;
    
    console.log('[MessageBridge] 初始化环境:', {
      mode: this.context.mode,
      needsLLMProxy: needsLLMProxy(),
      needsMCPProxy: needsMCPProxy(),
      llmProxyType: getLLMProxyType(),
      mcpProxyType: getMCPProxyType(),
    });
  }

  // 事件系统
  on(event: MessageBridgeEvent, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: MessageBridgeEvent, handler: (payload: any) => void) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(event, handlers.filter(fn => fn !== handler));
    }
  }

  emit(event: MessageBridgeEvent, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }

  // 统一消息发送入口
  send(type: string, payload: any) {
    switch (type) {
      case 'message/llm/chat':
        this.handleLLMChat(payload);
        break;
      case 'message/llm/abort':
        this.handleLLMAbort(payload);
        break;
      case 'message/mcp/connect':
        this.handleMCPConnect(payload);
        break;
      case 'message/mcp/disconnect':
        this.handleMCPDisconnect(payload);
        break;
      case 'message/mcp/call-tool':
        this.handleMCPCallTool(payload);
        break;
      default:
        console.warn('[MessageBridge] 未知消息类型:', type);
    }
  }

  // LLM处理 - 基于能力而非环境判断
  private async handleLLMChat(payload: any) {
    console.log('[MessageBridge] 处理LLM聊天请求, 代理类型:', getLLMProxyType());
    
    try {
      if (!needsLLMProxy()) {
        // 直接调用本地LLM
        await this.callLocalLLM(payload);
      } else {
        // 通过代理调用
        const proxyType = getLLMProxyType();
        if (proxyType === 'http') {
          await this.callLLMViaHTTP(payload);
        } else if (proxyType === 'ipc') {
          await this.callLLMViaIPC(payload);
        } else {
          throw new Error(`不支持的LLM代理类型: ${proxyType}`);
        }
      }
    } catch (error) {
      console.error('[MessageBridge] LLM请求失败:', error);
      this.emit('error', { error: String(error) });
    }
  }

  private async handleLLMAbort(payload: any) {
    console.log('[MessageBridge] 处理LLM中断请求');
    
    try {
      if (!needsLLMProxy()) {
        // 直接中断本地LLM
        if (this.llmService?.abort) {
          await this.llmService.abort('message/llm/abort', payload, (event: any) => {
            this.handleLLMEvent(event, payload);
          });
        } else {
          this.emit('abort', payload);
        }
      } else {
        // 通过代理中断
        const proxyType = getLLMProxyType();
        if (proxyType === 'http') {
          await this.abortLLMViaHTTP(payload);
        } else if (proxyType === 'ipc') {
          await this.abortLLMViaIPC(payload);
        } else {
          this.emit('abort', payload);
        }
      }
    } catch (error) {
      console.error('[MessageBridge] LLM中断失败:', error);
      this.emit('error', { error: String(error) });
    }
  }

  // MCP处理 - 基于能力而非环境判断
  private async handleMCPCallTool(payload: any) {
    const { serverId, toolName, args, callId } = payload;
    console.log('[MessageBridge] 处理MCP工具调用, 代理类型:', getMCPProxyType());
    
    try {
      if (!needsMCPProxy()) {
        // 直接调用本地MCP
        const result = await this.callLocalMCP(serverId, toolName, args);
        this.handleMCPResult(serverId, toolName, args, callId, result);
      } else {
        // 通过代理调用
        const proxyType = getMCPProxyType();
        if (proxyType === 'http') {
          await this.callMCPViaHTTP(payload);
        } else if (proxyType === 'ipc') {
          await this.callMCPViaIPC(payload);
        } else {
          throw new Error(`不支持的MCP代理类型: ${proxyType}`);
        }
      }
    } catch (error) {
      console.error('[MessageBridge] MCP调用失败:', error);
      this.emit('error', { serverId, toolName, callId, error: String(error) });
    }
  }

  private async handleMCPConnect(payload: any) {
    const { serverId, url } = payload;
    
    if (!needsMCPProxy() && this.mcpClient) {
      // 本地MCP连接
      await this.connectLocalMCP(serverId, url);
    } else {
      // 代理模式下，连接由服务端管理
      const proxyType = getMCPProxyType();
      if (proxyType === 'ipc') {
        await this.connectMCPViaIPC(serverId, url);
      } else {
        // HTTP代理模式，连接由服务端管理  
        this.emit('done', { serverId, tools: [] });
      }
    }
  }

  private async handleMCPDisconnect(payload: any) {
    const { serverId } = payload;
    
    if (!needsMCPProxy() && this.mcpClient) {
      // 本地MCP断开
      await this.disconnectLocalMCP(serverId);
    } else {
      // 代理模式下，断开由服务端管理
      const proxyType = getMCPProxyType();
      if (proxyType === 'ipc') {
        await this.disconnectMCPViaIPC(serverId);
      } else {
        // HTTP代理模式，断开由服务端管理
        this.emit('done', { serverId });
      }
    }
  }

  // 本地LLM调用实现
  private async callLocalLLM(payload: any) {
    if (this.llmService) {
      await this.llmService.send('message/llm/chat', payload, (event: any) => {
        this.handleLLMEvent(event, payload);
      });
    } else {
      // 动态导入本地llmService
      const { streamLLMChat } = await import('./llmService');
      await streamLLMChat({
        ...payload,
        onChunk: (chunk: any) => this.handleLLMEvent({ type: 'chunk', ...chunk }, payload),
        onDone: (result: any) => this.handleLLMEvent({ type: 'done', ...result }, payload),
        onError: (error: any) => this.handleLLMEvent({ type: 'error', error: String(error) }, payload),
        onToolCall: (toolCall: any) => this.handleLLMEvent({ type: 'toolcall', toolCall }, payload),
      });
    }
  }

  // HTTP代理LLM调用实现
  private async callLLMViaHTTP(payload: any) {
    const response = await fetch(`${this.context.config.sscApiBaseUrl}/api/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        chatId: payload.chatId,
        messages: payload.messages,
        model: payload.model,
        temperature: payload.temperature,
        tools: payload.tools,
        parallelToolCalls: payload.parallelToolCalls,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP LLM请求失败: ${response.status} ${response.statusText}`);
    }
    
    if (response.body) {
      await this.processSSEStream(response.body, payload);
    }
  }

  // HTTP代理LLM中断实现
  private async abortLLMViaHTTP(payload: any) {
    const response = await fetch(`${this.context.config.sscApiBaseUrl}/api/llm/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: payload.chatId }),
    });
    
    if (response.ok) {
      this.emit('abort', payload);
    } else {
      throw new Error(`HTTP LLM中断失败: ${response.status}`);
    }
  }

  // IPC代理LLM调用实现
  private async callLLMViaIPC(payload: any) {
    const electronAPI = this.context.config.electronAPI;
    if (!electronAPI) {
      throw new Error('Electron API不可用');
    }
    
    const stream = electronAPI.createStream('chat:stream', payload);
    
    stream.onChunk((chunk: any) => {
      this.handleLLMEvent({ type: 'chunk', ...chunk }, payload);
    });
    
    stream.onDone((result: any) => {
      this.handleLLMEvent({ type: 'done', ...result }, payload);
    });
    
    stream.onError((error: any) => {
      this.handleLLMEvent({ type: 'error', ...error }, payload);
    });
    
    stream.onAbort(() => {
      this.emit('abort', payload);
    });
  }

  // IPC代理LLM中断实现
  private async abortLLMViaIPC(payload: any) {
    const electronAPI = this.context.config.electronAPI;
    if (electronAPI?.send) {
      electronAPI.send('chat:abort', payload);
      this.emit('abort', payload);
    }
  }

  // 本地MCP调用实现
  private async callLocalMCP(serverId: string, toolName: string, args: any) {
    if (!this.mcpClient) {
      throw new Error('MCPClient未注入');
    }
    
    let result;
    
    if (typeof this.mcpClient.getService === 'function') {
      if (serverId === 'auto') {
        const firstService = this.mcpClient.getFirstAvailableService?.();
        if (!firstService) {
          throw new Error('没有可用的MCP服务器');
        }
        result = await firstService.callTool(toolName, args);
      } else {
        const service = this.mcpClient.getService(serverId);
        if (!service) {
          throw new Error(`服务器 ${serverId} 未连接`);
        }
        result = await service.callTool(toolName, args);
      }
    } else if (typeof this.mcpClient.callTool === 'function') {
      result = await this.mcpClient.callTool(toolName, args);
    } else {
      throw new Error('MCPClient接口不兼容');
    }
    
    return result;
  }

  // HTTP代理MCP调用实现
  private async callMCPViaHTTP(payload: any) {
    const { serverId, toolName, args, callId } = payload;
    
    const response = await fetch(`${this.context.config.sscApiBaseUrl}/api/mcp/call-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, toolName, args, callId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP MCP请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    this.handleMCPResult(serverId, toolName, args, callId, result);
  }

  // IPC代理MCP调用实现  
  private async callMCPViaIPC(payload: any) {
    const { serverId, toolName, args, callId } = payload;
    const electronAPI = this.context.config.electronAPI;
    
    if (!electronAPI || !electronAPI.send) {
      throw new Error('Electron API不可用');
    }
    
    console.log('[MessageBridge] 通过IPC调用MCP工具:', { serverId, toolName, callId });
    
    // 通过IPC发送MCP调用请求
    electronAPI.send('mcp:call-tool', {
      serverId,
      toolName, 
      args,
      callId
    });
    
    // 监听IPC响应
    if (electronAPI.on) {
      const cleanup = electronAPI.on(`mcp:tool-result:${callId}`, (result: any) => {
        cleanup(); // 清理监听器
        this.handleMCPResult(serverId, toolName, args, callId, result);
      });
      
      const cleanupError = electronAPI.on(`mcp:tool-error:${callId}`, (error: any) => {
        cleanupError(); // 清理监听器
        this.emit('error', { serverId, toolName, callId, error: error.message || String(error) });
      });
    }
  }

  // IPC代理MCP连接实现
  private async connectMCPViaIPC(serverId: string, url: string) {
    const electronAPI = this.context.config.electronAPI;
    
    if (!electronAPI || !electronAPI.send) {
      throw new Error('Electron API不可用');
    }
    
    console.log('[MessageBridge] 通过IPC连接MCP服务器:', { serverId, url });
    this.emit('status', { serverId, status: 'connecting' });
    
    // 通过IPC发送连接请求
    electronAPI.send('mcp:connect', { serverId, url });
    
    // 监听连接响应
    if (electronAPI.on) {
      const cleanup = electronAPI.on(`mcp:connect-result:${serverId}`, (result: any) => {
        cleanup(); // 清理监听器
        if (result.error) {
          this.emit('error', { serverId, error: result.error });
        } else {
          this.emit('done', { serverId, tools: result.tools || [] });
        }
      });
    }
  }

  // IPC代理MCP断开实现
  private async disconnectMCPViaIPC(serverId: string) {
    const electronAPI = this.context.config.electronAPI;
    
    if (!electronAPI || !electronAPI.send) {
      throw new Error('Electron API不可用');
    }
    
    console.log('[MessageBridge] 通过IPC断开MCP服务器:', { serverId });
    this.emit('status', { serverId, status: 'disconnecting' });
    
    // 通过IPC发送断开请求
    electronAPI.send('mcp:disconnect', { serverId });
    
    // 监听断开响应
    if (electronAPI.on) {
      const cleanup = electronAPI.on(`mcp:disconnect-result:${serverId}`, (result: any) => {
        cleanup(); // 清理监听器
        if (result.error) {
          this.emit('error', { serverId, error: result.error });
        } else {
          this.emit('done', { serverId });
        }
      });
    }
  }

  // 本地MCP连接实现
  private async connectLocalMCP(serverId: string, url: string) {
    this.emit('status', { serverId, status: 'connecting' });
    
    try {
      if (typeof this.mcpClient.createService === 'function') {
        const service = this.mcpClient.createService(serverId, url);
        await service.connect();
        const toolsResult = await service.listTools();
        this.emit('done', { serverId, tools: toolsResult.data || [] });
      } else if (typeof this.mcpClient.connect === 'function') {
        await this.mcpClient.connect();
        const toolsResult = await this.mcpClient.listTools();
        this.emit('done', { serverId, tools: toolsResult.data || [] });
      } else {
        throw new Error('MCPClient接口不兼容');
      }
    } catch (error) {
      this.emit('error', { serverId, error: String(error) });
    }
  }

  // 本地MCP断开实现
  private async disconnectLocalMCP(serverId: string) {
    this.emit('status', { serverId, status: 'disconnecting' });
    
    try {
      if (typeof this.mcpClient.removeService === 'function') {
        await this.mcpClient.removeService(serverId);
        this.emit('done', { serverId });
      } else if (typeof this.mcpClient.disconnect === 'function') {
        await this.mcpClient.disconnect(serverId);
        this.emit('done', { serverId });
      } else {
        throw new Error('MCPClient接口不兼容');
      }
    } catch (error) {
      this.emit('error', { serverId, error: String(error) });
    }
  }

  // 辅助方法 - Web模式LLM事件处理（从streamHandler累积内容计算增量）
  private handleLLMEvent(event: any, payload: any) {
    switch (event.type) {
      case 'status':
        this.emit('status', event);
        break;
      case 'chunk':
        // Web模式：从streamHandler的累积内容计算增量
        const content = event.content || '';
        const reasoningContent = event.reasoning_content || '';
        const phase = event.phase || 'generating';
        
        // 计算增量
        const contentDelta = content.slice(this.webModeState.previousContent.length);
        const reasoningDelta = reasoningContent.slice(this.webModeState.previousReasoningContent.length);
        
        // 只有实际内容变化时才发出chunk事件
        if (contentDelta.length > 0 || reasoningDelta.length > 0) {
          this.emit('chunk', {
            role: 'assistant',
            content_delta: contentDelta,
            reasoning_delta: reasoningDelta,
            tool_calls: event.tool_calls,
            phase: phase
          });
        }
        
        // 状态变化事件
        if (phase !== this.webModeState.previousPhase) {
          this.emit('status', {
            phase: phase,
            cardStatus: phase === 'thinking' ? 'thinking' : 'generating'
          });
          this.webModeState.previousPhase = phase;
        }
        
        // 更新状态
        this.webModeState.previousContent = content;
        this.webModeState.previousReasoningContent = reasoningContent;
        
        // 处理工具调用 - 只对新的tool_calls发出事件，避免重复
        if (event.tool_calls?.length > 0) {
          event.tool_calls.forEach((toolCall: any) => {
            // 检查是否是新的工具调用（根据ID和基本信息判断）
            const toolKey = `${toolCall.id || 'unknown'}_${toolCall.function?.name || 'unknown'}`;
            
            // 对于ToolCard显示，使用更宽松的检查：只要有工具调用的迹象就立即显示
            const hasToolCallIndication = toolCall && (
              toolCall.id || 
              toolCall.function?.name || 
              (toolCall.function && Object.keys(toolCall.function).length > 0)
            );
            
            if (!this.webModeState.emittedToolCallIds.has(toolKey) && hasToolCallIndication) {
              console.log('[MessageBridge] 检测到工具调用迹象，立即发出toolcall事件用于ToolCard显示:', {
                toolKey,
                id: toolCall.id,
                name: toolCall.function?.name,
                hasArgs: !!toolCall.function?.arguments,
                argsLength: toolCall.function?.arguments?.length || 0
              });
              this.webModeState.emittedToolCallIds.add(toolKey);
              this.emit('toolcall', { toolCall });
            }
          });
        }
        break;
      case 'done':
        this.emit('done', {
          role: 'assistant',
          content: event.content,
          reasoning_content: event.reasoning_content,
          tool_calls: event.tool_calls,
          id: payload.assistantMessageId || `assistant-${Date.now()}`,
          timestamp: Date.now(),
        });
        // 重置Web模式状态
        this.webModeState = {
          previousContent: '',
          previousReasoningContent: '',
          previousPhase: '',
          emittedToolCallIds: new Set<string>(),
        };
        break;
      case 'error':
        this.emit('error', { error: event.error || String(event) });
        // 重置Web模式状态
        this.webModeState = {
          previousContent: '',
          previousReasoningContent: '',
          previousPhase: '',
          emittedToolCallIds: new Set<string>(),
        };
        break;
      case 'toolcall':
        this.emit('toolcall', { toolCall: event.toolCall });
        break;
      case 'abort':
        this.emit('abort', event);
        // 重置Web模式状态
        this.webModeState = {
          previousContent: '',
          previousReasoningContent: '',
          previousPhase: '',
          emittedToolCallIds: new Set<string>(),
        };
        break;
      case 'stream_end':
        // 流结束信号，仅用于技术层面的清理，不需要传递给UI
        console.log('[MessageBridge] 收到流结束信号');
        break;
      default:
        console.warn('[MessageBridge] 未知LLM事件类型:', event.type);
    }
  }

  private handleMCPResult(serverId: string, toolName: string, args: any, callId: any, result: any) {
    if (result.error) {
      this.emit('error', { serverId, toolName, callId, error: result.error });
    } else {
      this.emit('toolresult', { serverId, toolName, args, callId, result: result.data });
    }
  }

  private async processSSEStream(body: ReadableStream, payload: any) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    const chunks: any[] = [];
    let currentPhase = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              // 收到结束信号，使用streamHandler处理tool_calls和最终结果
              await this.processChunksWithStreamHandler(chunks, payload);
              return;
            }
            
            try {
              const openaiChunk = JSON.parse(data);
              
              // 如果是原始OpenAI chunk
              if (openaiChunk.choices || openaiChunk.type === 'raw_chunk') {
                const chunk = openaiChunk.type === 'raw_chunk' ? openaiChunk.chunk : openaiChunk;
                
                // 收集chunks供streamHandler处理tool_calls
                chunks.push(chunk);
                
                // 直接透传content和reasoning_content的增量
                if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                  const delta = chunk.choices[0].delta;
                  
                  // 判断当前阶段（简单版本，复杂逻辑仍由streamHandler处理）
                  let phase = currentPhase || 'generating';
                  if (delta.reasoning_content) {
                    phase = 'thinking';
                  } else if (delta.content) {
                    phase = 'generating';
                  }
                  currentPhase = phase;
                  
                  // 只有当有实际内容时才发出chunk事件
                  if (delta.content || delta.reasoning_content) {
                    this.emit('chunk', {
                      role: 'assistant',
                      content_delta: delta.content || '',
                      reasoning_delta: delta.reasoning_content || '',
                      phase: phase
                    });
                  }
                  
                  // 状态变化事件
                  this.emit('status', {
                    phase: phase,
                    cardStatus: phase === 'thinking' ? 'thinking' : 'generating'
                  });
                }
              } else {
                // 其他事件（如status）直接处理
                this.handleLLMEvent(openaiChunk, payload);
              }
            } catch (e) {
              console.warn('[MessageBridge] 解析SSE数据失败:', data, e);
            }
          }
        }
      }
      
      // 如果没有收到[DONE]，也要处理收集到的chunks
      if (chunks.length > 0) {
        await this.processChunksWithStreamHandler(chunks, payload);
      }
    } finally {
      reader.releaseLock();
    }
  }

  // 使用streamHandler处理tool_calls和生成最终结果
  private async processChunksWithStreamHandler(chunks: any[], payload: any) {
    console.log('[MessageBridge] 使用streamHandler处理tool_calls，chunks数量:', chunks.length);
    
    try {
      // 动态导入streamHandler
      const { handleResponseStream } = await import('../stream/streamHandler');
      
      // 创建可迭代的chunks
      const chunkStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of chunks) {
            yield chunk;
          }
        }
      };
      
      // 使用streamHandler处理，主要用于tool_calls解析和最终结果
      const result = await handleResponseStream(chunkStream, (enhancedChunk) => {
        // streamHandler的onChunk回调，但我们不在这里发送content事件
        // content已经在processSSEStream中直接透传了
        
        // 只处理tool_calls的变化
        if (enhancedChunk.tool_calls && enhancedChunk.tool_calls.length > 0) {
          enhancedChunk.tool_calls.forEach((toolCall: any) => {
            if (this.isValidToolCall(toolCall)) {
              this.emit('toolcall', { toolCall });
            }
          });
        }
      });
      
      // 发出完成事件（包含streamHandler处理的最终结果）
      this.emit('done', {
        role: 'assistant',
        content: result.content,
        reasoning_content: result.reasoning_content,
        tool_calls: result.tool_calls,
        id: payload.assistantMessageId || `assistant-${Date.now()}`,
        timestamp: Date.now(),
      });
      
      console.log('[MessageBridge] streamHandler处理完成，最终tool_calls数量:', result.tool_calls?.length || 0);
    } catch (error) {
      console.error('[MessageBridge] streamHandler处理失败:', error);
      this.emit('error', { error: String(error) });
    }
  }


  private isValidToolCall(toolCall: any): boolean {
    if (!toolCall?.function?.name) return false;
    
    const args = toolCall.function.arguments;
    if (!args) return true;
    
    try {
      JSON.parse(args);
      return true;
    } catch {
      return false;
    }
  }

  // 便捷方法
  chatLLM(payload: any) {
    this.send('message/llm/chat', payload);
  }

  abortLLM() {
    this.send('message/llm/abort', {});
  }

  connectMCP(serverId: string, url: string) {
    this.send('message/mcp/connect', { serverId, url });
  }

  disconnectMCP(serverId: string) {
    this.send('message/mcp/disconnect', { serverId });
  }

  callTool(serverId: string, toolName: string, args: Record<string, any>) {
    this.send('message/mcp/call-tool', { serverId, toolName, args });
  }
}