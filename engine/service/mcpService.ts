// engine/service/mcpService.ts
// MCP 协议层服务，适用于 Node/Electron 等支持进程的环境
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export interface Tool {
  name: string;
  title: string;
  description: string;
  type: string;
}

export class MCPService {
  private mcp: any;
  private transport: any;
  private connected = false;
  private url: string;
  private connectionType: "STDIO" | "SSE" | "STREAMABLE_HTTP";
  private serverCommand: string;
  private serverArgs: string[];
  private clientName: string;
  private clientVersion: string;

  constructor(
    url: string = "",
    connectionType?: "STDIO" | "SSE" | "STREAMABLE_HTTP",
    serverCommand: string = "node",
    serverArgs: string[] = ["server.js"],
    clientName: string = "mcp-client",
    clientVersion: string = "1.0.0"
  ) {
    // 自动协议推断：如未指定 connectionType，根据 url 自动判断
    if (!connectionType) {
      if (!url) {
        connectionType = "STDIO";
      } else if (/\/sse(\/|$)/i.test(url)) {
        connectionType = "SSE";
      } else if (/\/streamable(_|-)?http(\/|$)/i.test(url)) {
        connectionType = "STREAMABLE_HTTP";
      } else {
        // 默认 HTTP 走 STREAMABLE_HTTP
        connectionType = "STREAMABLE_HTTP";
      }
    }
    this.url = url;
    this.connectionType = connectionType;
    this.serverCommand = serverCommand;
    this.serverArgs = serverArgs;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
  }

  async connect() {
    console.log(`[MCPService] 开始连接服务器... URL: ${this.url}, 连接类型: ${this.connectionType}`);
    this.mcp = new Client({ name: this.clientName, version: this.clientVersion });
    console.log(`[MCPService] 已创建 MCP 客户端, 名称: ${this.clientName}, 版本: ${this.clientVersion}`);

    try {
      switch (this.connectionType) {
        case "STDIO":
          if (typeof window !== "undefined") throw new Error("STDIO not supported in browser");
          console.log(`[MCPService] 使用 STDIO 传输, 命令: ${this.serverCommand}, 参数:`, this.serverArgs);
          const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
          this.transport = new StdioClientTransport({ command: this.serverCommand, args: this.serverArgs });
          break;
        case "SSE":
          if (!this.url) throw new Error("URL is required for SSE connection");
          console.log(`[MCPService] 使用 SSE 传输, URL: ${this.url}`);
          const { SSEClientTransport } = await import("@modelcontextprotocol/sdk/client/sse.js");
          this.transport = new SSEClientTransport(new URL(this.url));
          break;
        case "STREAMABLE_HTTP":
          if (!this.url) throw new Error("URL is required for STREAMABLE_HTTP connection");
          console.log(`[MCPService] 使用 StreamableHTTP 传输, URL: ${this.url}`);
          const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");
          this.transport = new StreamableHTTPClientTransport(new URL(this.url));
          break;
        default:
          throw new Error(`Unsupported connection type: ${this.connectionType}`);
      }

      console.log('[MCPService] 开始建立连接...');
      await this.mcp.connect(this.transport);
      this.connected = true;
      console.log('[MCPService] 连接成功!');
    } catch (error) {
      console.error('[MCPService] 连接失败:', error);
      this.connected = false;
      throw error;
    }
  }

  async listTools(): Promise<{ data: Tool[]; error?: string }> {
    try {
      console.log('[MCPService] 检查连接状态:', this.connected ? '已连接' : '未连接');
      if (!this.connected) {
        console.log('[MCPService] 尚未连接，尝试建立连接...');
        await this.connect();
      }
      console.log('[MCPService] 开始获取工具列表...');
      const toolsResponse = await this.mcp.listTools();
      console.log('[MCPService] 原始工具列表响应:', toolsResponse);
      // 只处理数组或 { tools: Tool[] } 结构
      let tools: Tool[] = [];
      if (Array.isArray(toolsResponse)) {
        tools = toolsResponse;
      } else if (toolsResponse && Array.isArray(toolsResponse.tools)) {
        tools = toolsResponse.tools;
      }
      console.log('[MCPService] 处理后的工具列表:', tools);
      return { data: tools };
    } catch (e: any) {
      console.error('[MCPService] 获取工具列表失败:', e);
      return { data: [], error: e.message };
    }
  }

  async callTool(name: string, args: Record<string, any>): Promise<{ data: any; error?: string }> {
    try {
      console.log(`[MCPService] 调用工具 ${name}, 参数:`, args);
      if (!this.connected) {
        console.log('[MCPService] 尚未连接，尝试建立连接...');
        await this.connect();
      }
      console.log('[MCPService] 开始调用工具...');
      const result = await this.mcp.callTool({ name, arguments: args });
      console.log(`[MCPService] 工具 ${name} 调用成功:`, result);
      return { data: result };
    } catch (e: any) {
      console.error(`[MCPService] 工具 ${name} 调用失败:`, e);
      return { data: null, error: e.message };
    }
  }

  // 列出所有 prompts
  public async listPrompts() {
    if (!this.connected) await this.connect();
    return await this.mcp.listPrompts();
  }

  // 列出所有资源
  public async listResources() {
    if (!this.connected) await this.connect();
    return await this.mcp.listResources();
  }

  // 列出所有资源模板
  public async listResourceTemplates() {
    if (!this.connected) await this.connect();
    return await this.mcp.listResourceTemplates();
  }

  // 获取单个 prompt
  public async getPrompt(name: string, args: Record<string, any> = {}) {
    if (!this.connected) await this.connect();
    return await this.mcp.getPrompt({ name, arguments: args });
  }

  // 读取单个资源
  public async readResource(uri: string) {
    if (!this.connected) await this.connect();
    return await this.mcp.readResource({ uri });
  }

  async disconnect() {
    console.log('[MCPService] 开始断开连接...');
    if (this.transport && this.transport.disconnect) {
      await this.transport.disconnect();
    }
    if (this.mcp && this.mcp.close) {
      await this.mcp.close();
    }
    this.connected = false;
    console.log('[MCPService] 已断开连接');
  }
}
