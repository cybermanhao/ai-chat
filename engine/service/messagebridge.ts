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

  // 协议消息发送（如 message/llm/chat, message/llm/abort 等）
  send(type: string, payload: any) {
    // 直接调用对应的处理方法
    switch (type) {
      case 'message/llm/chat': {
        this.handleLLMChat(payload);
        break;
      }
      case 'message/llm/abort': {
        console.log('[MessageBridge] LLM中断请求 - TODO实现');
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
    try {
      const { streamLLMChat } = await import('./llmService');
      
      console.log('[MessageBridge] 开始处理LLM聊天请求:', payload);
      
      await streamLLMChat({
        ...payload,
        onChunk: (chunk: any) => {
          // 发送协议chunk事件（对应 message/llm/chunk）
          this.handleIncoming('chunk', {
            role: 'assistant',
            content: chunk.content,
            reasoning_content: chunk.reasoning_content,
            tool_calls: chunk.tool_calls,
            phase: chunk.phase
          });
          
          // 如果有工具调用，发送toolcall协议事件
          if (chunk.tool_calls && chunk.tool_calls.length > 0) {
            chunk.tool_calls.forEach((toolCall: any) => {
              this.handleIncoming('toolcall', { toolCall });
            });
          }
        },
        onDone: (result: any) => {
          // 发送完成事件
          this.handleIncoming('done', {
            role: 'assistant',
            content: result.content,
            reasoning_content: result.reasoning_content,
            tool_calls: result.tool_calls,
            id: payload.assistantMessageId || `assistant-${Date.now()}`,
            timestamp: Date.now(),
          });
        },
        onError: (error: any) => {
          this.handleIncoming('error', { error: String(error) });
        },
        onToolCall: (toolCall: any) => {
          this.handleIncoming('toolcall', { toolCall });
        }
      });
    } catch (error) {
      console.error('[MessageBridge] LLM聊天请求处理失败:', error);
      this.handleIncoming('error', { error: String(error) });
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

  // 连接/断开 MCP 服务
  connectMCP(serverId: string, url: string) {
    // 连接 MCPClient，分发 status/done/error 事件
    if (!this.mcpClient) {
      this.emit('error', { serverId, error: 'MCPClient 未注入' });
      return;
    }
    this.emit('status', { serverId, status: 'connecting' });
    this.mcpClient.connect(serverId, url)
      .then((tools: any) => {
        this.emit('done', { serverId, tools });
      })
      .catch((err: any) => {
        this.emit('error', { serverId, error: String(err) });
      });
  }

  disconnectMCP(serverId: string) {
    // 断开 MCPClient，分发 status/done/error 事件
    if (!this.mcpClient) {
      this.emit('error', { serverId, error: 'MCPClient 未注入' });
      return;
    }
    this.emit('status', { serverId, status: 'disconnecting' });
    this.mcpClient.disconnect(serverId)
      .then(() => {
        this.emit('done', { serverId });
      })
      .catch((err: any) => {
        this.emit('error', { serverId, error: String(err) });
      });
  }

  // 工具链相关操作
  listTools() {
    // TODO: 调用 mcpClient.listTools 并分发 toolresult/status/error 事件
  }
  callTool(name: string, args: Record<string, any>) {
    // TODO: 调用 mcpClient.callTool 并分发 toolcall/toolresult/status/error 事件
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
    // TODO: 中断 LLM 推理，分发 abort/status/error 事件
  }

  // ...其它协议和事件扩展
}
