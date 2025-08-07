// engine/service/messagebridge.ts
// MessageBridge: 统一协议/多端适配层
// 只负责 TaskLoop 与服务端（MCP/LLM/Web/Electron/SSC）之间的协议消息桥接和事件分发，不处理 UI 本地事件（add/update）。

export type MessageBridgeEvent =
  | 'chunk'
  | 'toolcall'
  | 'toolresult'
  | 'status'
  | 'done'
  | 'error'
  | 'abort';

export interface MessageBridgeOptions {
  env: string; // 当前环境类型: 'web' | 'electron' | 'ssc' 等
  mcpClient?: any; // MCPClient 实例
  llmService?: any; // LLM 服务实例
  [key: string]: any; // 其它适配参数
}

export class MessageBridge {
  private env: string;
  private mcpClient: any;
  private llmService: any;
  private listeners: Map<MessageBridgeEvent, Array<(payload: any) => void>> = new Map();

  constructor(options: MessageBridgeOptions) {
    this.env = options.env;
    this.mcpClient = options.mcpClient;
    this.llmService = options.llmService;
  }

  // 事件注册（只注册协议事件，不处理 add/update）
  on(event: MessageBridgeEvent, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  // 事件分发
  emit(event: MessageBridgeEvent, payload: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(payload));
    }
  }

  // 事件解绑（移除监听器）
  off(event: MessageBridgeEvent, handler: (payload: any) => void) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(event, handlers.filter(fn => fn !== handler));
    }
  }

  // 检查工具调用是否完整（arguments是有效JSON）
  private isValidToolCall(toolCall: any): boolean {
    if (!toolCall || !toolCall.function) {
      return false;
    }
    
    // 检查是否有函数名
    if (!toolCall.function.name) {
      return false;
    }
    
    // 检查arguments是否是有效的JSON
    const args = toolCall.function.arguments;
    if (!args) {
      return true; // 空arguments是有效的
    }
    
    try {
      JSON.parse(args);
      return true;
    } catch (e) {
      // arguments不是有效JSON，工具调用还未完整
      return false;
    }
  }

  // 协议消息发送（如 message/llm/chat, message/llm/abort, message/mcp/connect 等）
  send(type: string, payload: any) {
    // 直接调用对应的处理方法
    switch (type) {
      case 'message/llm/chat': {
        this.handleLLMChat(payload);
        break;
      }
      case 'message/llm/abort': {
        this.handleLLMAbort(payload);
        break;
      }
      case 'message/mcp/connect': {
        this.handleMCPConnect(payload);
        break;
      }
      case 'message/mcp/disconnect': {
        this.handleMCPDisconnect(payload);
        break;
      }
      case 'message/mcp/call-tool': {
        this.handleMCPCallTool(payload);
        break;
      }
      default: {
        console.warn('MessageBridge.send: 未知消息类型', type);
        break;
      }
    }
  }

  // 处理LLM聊天请求
  private async handleLLMChat(payload: any) {
    console.log(`[MessageBridge] 在${this.env}环境下处理LLM聊天请求:`, payload);
    
    if (this.llmService) {
      // 使用注入的LLMService适配器（支持Web/Electron/SSC等不同环境）
      console.log('[MessageBridge] 使用注入的LLMService适配器');
      try {
        await this.llmService.send('message/llm/chat', payload, (event: any) => {
          this.handleLLMEvent(event, payload);
        });
      } catch (error) {
        console.error('[MessageBridge] LLMService适配器调用失败:', error);
        this.handleIncoming('error', { error: String(error) });
      }
    } else {
      // 回退到本地llmService（仅Web环境）
      if (this.env !== 'web') {
        console.error(`[MessageBridge] ${this.env}环境下缺少LLMService适配器`);
        this.handleIncoming('error', { error: `${this.env}环境下缺少LLMService适配器` });
        return;
      }
      
      try {
        const { streamLLMChat } = await import('./llmService');
        console.log('[MessageBridge] 回退到本地LLMService');
        
        await streamLLMChat({
          ...payload,
          onChunk: (chunk: any) => {
            this.handleLLMEvent({ type: 'chunk', ...chunk }, payload);
          },
          onDone: (result: any) => {
            this.handleLLMEvent({ type: 'done', ...result }, payload);
          },
          onError: (error: any) => {
            this.handleLLMEvent({ type: 'error', error: String(error) }, payload);
          },
          onToolCall: (toolCall: any) => {
            this.handleLLMEvent({ type: 'toolcall', toolCall }, payload);
          }
        });
      } catch (error) {
        console.error('[MessageBridge] 本地LLMService调用失败:', error);
        this.handleIncoming('error', { error: String(error) });
      }
    }
  }

  // 处理LLM中断请求
  private async handleLLMAbort(payload: any) {
    console.log(`[MessageBridge] 在${this.env}环境下处理LLM中断请求:`, payload);
    
    if (this.llmService && this.llmService.abort) {
      // 使用注入的LLMService适配器的中断功能
      console.log('[MessageBridge] 使用LLMService适配器中断');
      try {
        await this.llmService.abort('message/llm/abort', payload, (event: any) => {
          this.handleLLMEvent(event, payload);
        });
      } catch (error) {
        console.error('[MessageBridge] LLMService适配器中断失败:', error);
        this.handleIncoming('error', { error: String(error) });
      }
    } else {
      // 回退处理或直接发送中断事件
      console.log('[MessageBridge] 无可用的中断适配器，发送中断事件');
      this.handleIncoming('abort', payload);
    }
  }

  // 统一的LLM事件处理
  private handleLLMEvent(event: any, payload: any) {
    switch (event.type) {
      case 'status':
        this.handleIncoming('status', event);
        break;
      case 'chunk':
        // 发送协议chunk事件
        this.handleIncoming('chunk', {
          role: 'assistant',
          content: event.content,
          reasoning_content: event.reasoning_content,
          tool_calls: event.tool_calls,
          phase: event.phase
        });
        
        // 如果有工具调用，检查arguments是否完整再发送toolcall协议事件
        if (event.tool_calls && event.tool_calls.length > 0) {
          event.tool_calls.forEach((toolCall: any) => {
            if (this.isValidToolCall(toolCall)) {
              this.handleIncoming('toolcall', { toolCall });
            }
          });
        }
        break;
      case 'done':
        // 发送完成事件
        this.handleIncoming('done', {
          role: 'assistant',
          content: event.content,
          reasoning_content: event.reasoning_content,
          tool_calls: event.tool_calls,
          id: payload.assistantMessageId || `assistant-${Date.now()}`,
          timestamp: Date.now(),
        });
        break;
      case 'error':
        this.handleIncoming('error', { error: event.error || String(event) });
        break;
      case 'toolcall':
        this.handleIncoming('toolcall', { toolCall: event.toolCall });
        break;
      case 'abort':
        this.handleIncoming('abort', event);
        break;
      default:
        console.warn('[MessageBridge] 未知LLM事件类型:', event.type);
    }
  }

  // 协议消息接收
  handleIncoming(type: string, msg: any) {
    // 自动映射协议消息为事件
    // 例如 chunk→chunk, done→done, error→error, abort→abort, toolcall→toolcall, toolresult→toolresult
    switch (type) {
      case 'chunk':
        // chunk协议事件，TaskLoop监听后转换为UI的update事件
        this.emit('chunk', msg);
        if (msg.phase) {
          this.emit('status', { status: msg.phase });
        }
        break;
      case 'status':
        this.emit('status', msg);
        break;
      case 'done':
        this.emit('done', msg);
        break;
      case 'error':
        this.emit('error', msg);
        break;
      case 'abort':
        this.emit('abort', msg);
        break;
      case 'toolcall':
        this.emit('toolcall', msg);
        break;
      case 'toolresult':
        this.emit('toolresult', msg);
        break;
      default:
        // 未知类型
        break;
    }
  }

  // 处理MCP连接请求
  private async handleMCPConnect(payload: any) {
    const { serverId, url } = payload;
    
    if (!this.mcpClient) {
      this.handleIncoming('error', { serverId, error: 'MCPClient 未注入' });
      return;
    }
    
    try {
      console.log('[MessageBridge] 开始处理MCP连接请求:', { serverId, url });
      this.handleIncoming('status', { serverId, status: 'connecting' });
      
      // 检查mcpClient类型并调用相应方法
      if (typeof this.mcpClient.createService === 'function') {
        // mcpClientManager模式：创建服务并连接
        const service = this.mcpClient.createService(serverId, url);
        await service.connect();
        // 连接成功后获取工具列表
        const toolsResult = await service.listTools();
        const tools = toolsResult.data || [];
        this.handleIncoming('done', { serverId, tools });
      } else if (typeof this.mcpClient.connect === 'function') {
        // 单个MCPClient模式：直接连接
        await this.mcpClient.connect();
        // 连接成功后获取工具列表
        const toolsResult = await this.mcpClient.listTools();
        const tools = toolsResult.data || [];
        this.handleIncoming('done', { serverId, tools });
      } else {
        throw new Error('MCPClient接口不兼容');
      }
    } catch (error) {
      console.error('[MessageBridge] MCP连接请求处理失败:', error);
      this.handleIncoming('error', { serverId, error: String(error) });
    }
  }

  // 处理MCP断开请求
  private async handleMCPDisconnect(payload: any) {
    const { serverId } = payload;
    
    if (!this.mcpClient) {
      this.handleIncoming('error', { serverId, error: 'MCPClient 未注入' });
      return;
    }
    
    try {
      console.log('[MessageBridge] 开始处理MCP断开请求:', { serverId });
      this.handleIncoming('status', { serverId, status: 'disconnecting' });
      
      // 检查mcpClient类型并调用相应方法
      if (typeof this.mcpClient.removeService === 'function') {
        // mcpClientManager模式：移除服务
        await this.mcpClient.removeService(serverId);
        this.handleIncoming('done', { serverId });
      } else if (typeof this.mcpClient.disconnect === 'function') {
        // 单个MCPClient模式：直接断开
        await this.mcpClient.disconnect(serverId);
        this.handleIncoming('done', { serverId });
      } else {
        throw new Error('MCPClient接口不兼容');
      }
    } catch (error) {
      console.error('[MessageBridge] MCP断开请求处理失败:', error);
      this.handleIncoming('error', { serverId, error: String(error) });
    }
  }

  // 处理MCP工具调用请求（框架无关实现）
  private async handleMCPCallTool(payload: any) {
    const { serverId, toolName, args, callId } = payload;
    
    console.log(`[MessageBridge] 在${this.env}环境下处理MCP工具调用请求:`, { serverId, toolName, args, callId });
    
    // 非Web环境：应该通过适配器与Node代理通信，而不是直接调用mcpClient
    if (this.env === 'ssc') {
      await this.handleSSCMCPCallTool(payload);
      return;
    }
    
    if (this.env === 'electron') {
      // Electron环境：应该通过IPC与主进程通信（TODO: 实现Electron MCP适配器）
      console.warn('[MessageBridge] Electron MCP适配器尚未实现，回退到直接调用');
    }
    
    // Web环境或回退模式：直接使用mcpClient
    if (!this.mcpClient) {
      this.handleIncoming('error', { serverId, toolName, callId, error: 'MCPClient 未注入' });
      return;
    }
    
    try {
      console.log('[MessageBridge] 使用直接MCP调用模式');
      
      let result;
      let actualServerId = serverId;
      
      // 检查mcpClient类型并调用相应方法
      if (typeof this.mcpClient.getService === 'function') {
        // mcpClientManager模式：获取服务并调用工具
        if (serverId === 'auto') {
          // 框架无关的自动选择：使用第一个可用服务
          const firstService = this.mcpClient.getFirstAvailableService?.();
          const firstServerId = this.mcpClient.getFirstAvailableServerId?.();
          if (!firstService) {
            throw new Error('没有可用的MCP服务器');
          }
          result = await firstService.callTool(toolName, args);
          actualServerId = firstServerId || 'auto-selected'; // 使用实际的serverId或标记为自动选择
        } else {
          const service = this.mcpClient.getService(serverId);
          if (!service) {
            throw new Error(`服务器 ${serverId} 未连接`);
          }
          result = await service.callTool(toolName, args);
        }
      } else if (typeof this.mcpClient.callTool === 'function') {
        // 单个MCPClient模式：直接调用工具
        result = await this.mcpClient.callTool(toolName, args);
        actualServerId = 'single-client';
      } else {
        throw new Error('MCPClient接口不兼容');
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      this.handleIncoming('toolresult', { 
        serverId: actualServerId, 
        toolName, 
        args,
        callId,
        result: result.data 
      });
    } catch (error) {
      console.error('[MessageBridge] MCP工具调用请求处理失败:', error);
      this.handleIncoming('error', { 
        serverId, 
        toolName,
        callId,
        error: String(error) 
      });
    }
  }

  // SSC模式下的MCP工具调用处理
  private async handleSSCMCPCallTool(payload: any) {
    const { serverId, toolName, args, callId } = payload;
    
    try {
      // 在浏览器环境中，通过globalThis获取配置或使用默认值
      const SSC_BASE_URL = (globalThis as any).SSC_API_BASE_URL || 
                           (typeof process !== 'undefined' && process.env?.SSC_API_BASE_URL) || 
                           'http://localhost:8080';
      const SSC_MCP_ENDPOINT = `${SSC_BASE_URL}/api/mcp/call-tool`;
      
      console.log('[MessageBridge] SSC模式下处理MCP工具调用:', { serverId, toolName, args, callId });
      console.log(`[MessageBridge] SSC MCP端点: ${SSC_MCP_ENDPOINT}`);
      
      const response = await fetch(SSC_MCP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          toolName,
          args,
          callId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`SSC MCP API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      this.handleIncoming('toolresult', { 
        serverId: result.serverId || serverId, 
        toolName, 
        args,
        callId,
        result: result.data 
      });
    } catch (error) {
      console.error('[MessageBridge] SSC MCP工具调用请求处理失败:', error);
      this.handleIncoming('error', { 
        serverId, 
        toolName,
        callId,
        error: String(error) 
      });
    }
  }

  // 便捷方法，保持向后兼容（内部调用统一的send方法）
  connectMCP(serverId: string, url: string) {
    this.send('message/mcp/connect', { serverId, url });
  }

  disconnectMCP(serverId: string) {
    this.send('message/mcp/disconnect', { serverId });
  }

  callTool(serverId: string, toolName: string, args: Record<string, any>) {
    this.send('message/mcp/call-tool', { serverId, toolName, args });
  }

  // 工具链相关操作（TODO: 待实现）
  listTools() {
    // TODO: 调用 mcpClient.listTools 并分发 toolresult/status/error 事件
  }
  abortTool() {
    // TODO: 工具调用中断实现，分发 abort/status/error 事件
  }

  // LLM 相关操作
  /**
   * 发起 LLM 推理请求，所有事件通过 messageBridge.on 订阅
   * @param payload LLM 请求参数
   * @example
   * const bridge = new MessageBridge({ env, llmService });
   * bridge.on('status', fn); bridge.on('done', fn); bridge.on('error', fn);
   * bridge.chatLLM({ messages, ... });
   */
  chatLLM(payload: any) {
    // 发送统一协议消息，所有事件通过 handleIncoming 分发
    this.send('message/llm/chat', payload);
  }

  abortLLM() {
    // 发送统一协议消息，所有事件通过 handleIncoming 分发
    this.send('message/llm/abort', {});
  }

  // ...其它协议和事件扩展
}
