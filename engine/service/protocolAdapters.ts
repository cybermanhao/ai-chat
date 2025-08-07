// 通信协议适配器 - 将MessageBridge事件适配到不同的通信协议
// 统一SSC-Server和Electron-Main的架构

// 协议适配器接口
export interface ProtocolAdapter {
  sendChunk(data: any): void;
  sendStatus(data: any): void; 
  sendToolCall(data: any): void;
  sendToolResult(data: any): void;
  sendDone(data: any): void;
  sendError(data: any): void;
  sendAbort(data: any): void;
  onDisconnect?(callback: () => void): void;
  cleanup?(): void;
}

// IPC协议适配器 (Electron主进程用)
export class IPCProtocolAdapter implements ProtocolAdapter {
  constructor(
    private event: any, // Electron.IpcMainEvent
    private streamId: string
  ) {}

  sendChunk(data: any): void {
    this.event.sender.send(`chat:stream:chunk:${this.streamId}`, data);
  }

  sendStatus(data: any): void {
    this.event.sender.send(`chat:stream:status:${this.streamId}`, data);
  }

  sendToolCall(data: any): void {
    this.event.sender.send(`chat:stream:toolcall:${this.streamId}`, data);
  }

  sendToolResult(data: any): void {
    this.event.sender.send(`chat:stream:toolresult:${this.streamId}`, data);
  }

  sendDone(data: any): void {
    this.event.sender.send(`chat:stream:done:${this.streamId}`, data);
  }

  sendError(data: any): void {
    this.event.sender.send(`chat:stream:error:${this.streamId}`, data);
  }

  sendAbort(data: any): void {
    this.event.sender.send(`chat:stream:abort:${this.streamId}`, data);
  }

  onDisconnect(callback: () => void): void {
    this.event.sender.on('destroyed', callback);
  }

  cleanup(): void {
    console.log(`[IPCAdapter] 清理 streamId: ${this.streamId}`);
  }
}

// HTTP/SSE协议适配器 (SSC-Server用)
export class SSEProtocolAdapter implements ProtocolAdapter {
  constructor(
    private res: any, // Express Response对象
    private req: any  // Express Request对象  
  ) {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }

  sendChunk(data: any): void {
    this.writeSSE('chunk', data);
  }

  sendStatus(data: any): void {
    this.writeSSE('status', data);
  }

  sendToolCall(data: any): void {
    this.writeSSE('toolcall', data);
  }

  sendToolResult(data: any): void {
    this.writeSSE('toolresult', data);
  }

  sendDone(data: any): void {
    this.writeSSE('done', data);
    this.writeSSE('[DONE]', null);
    this.res.end();
  }

  sendError(data: any): void {
    this.writeSSE('error', data);
    this.res.end();
  }

  sendAbort(data: any): void {
    this.writeSSE('abort', data);
    this.res.end();
  }

  onDisconnect(callback: () => void): void {
    this.req.on('close', callback);
    this.req.on('aborted', callback);
  }

  cleanup(): void {
    if (!this.res.finished) {
      this.res.end();
    }
  }

  private writeSSE(type: string, data: any): void {
    if (type === '[DONE]') {
      this.res.write('data: [DONE]\n\n');
    } else {
      const sseData = JSON.stringify({ type, ...data });
      this.res.write(`data: ${sseData}\n\n`);
    }
  }
}

// 统一的服务端消息处理器
export class ServerMessageHandler {
  private protocolAdapter: ProtocolAdapter;
  private messageBridge: any;
  private eventHandlers: Map<string, (data: any) => void> = new Map();

  constructor(protocolAdapter: ProtocolAdapter, messageBridge: any) {
    this.protocolAdapter = protocolAdapter;
    this.messageBridge = messageBridge;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    const handlers = {
      chunk: (data: any) => this.protocolAdapter.sendChunk(data),
      status: (data: any) => this.protocolAdapter.sendStatus(data),
      toolcall: (data: any) => this.protocolAdapter.sendToolCall(data),
      toolresult: (data: any) => this.protocolAdapter.sendToolResult(data),
      done: (data: any) => {
        this.protocolAdapter.sendDone(data);
        this.cleanup();
      },
      error: (data: any) => {
        this.protocolAdapter.sendError(data);
        this.cleanup();
      },
      abort: (data: any) => {
        this.protocolAdapter.sendAbort(data);
        this.cleanup();
      }
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      this.eventHandlers.set(event, handler);
      this.messageBridge.on(event, handler);
    });

    this.protocolAdapter.onDisconnect?.(() => {
      console.log('[ServerMessageHandler] 客户端连接断开');
      this.cleanup();
    });
  }

  async handleLLMChat(payload: any): Promise<void> {
    this.messageBridge.send('message/llm/chat', payload);
  }

  async handleLLMAbort(payload: any): Promise<void> {
    this.messageBridge.send('message/llm/abort', payload);
  }

  async handleMCPCallTool(payload: any): Promise<void> {
    this.messageBridge.send('message/mcp/call-tool', payload);
  }

  private cleanup(): void {
    this.eventHandlers.forEach((handler, event) => {
      this.messageBridge.off(event, handler);
    });
    this.eventHandlers.clear();
    this.protocolAdapter.cleanup?.();
  }
}

export function createProtocolAdapter(
  type: 'ipc' | 'sse',
  ...args: any[]
): ProtocolAdapter {
  switch (type) {
    case 'ipc':
      return new IPCProtocolAdapter(args[0], args[1]);
    case 'sse':
      return new SSEProtocolAdapter(args[0], args[1]);
    default:
      throw new Error(`不支持的协议类型: ${type}`);
  }
}