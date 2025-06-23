// engine/service/mcpService.ts
// MCP 协议层服务，适用于 Node/Electron 等支持进程的环境
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export class MCPService {
  private mcp: any;
  private transport: any;
  private connected = false;

  constructor(
    private serverCommand: string = "node",
    private serverArgs: string[] = ["server.js"],
    private clientName: string = "mcp-client",
    private clientVersion: string = "1.0.0"
  ) {}

  async connect() {
    this.mcp = new Client({ name: this.clientName, version: this.clientVersion });
    this.transport = new StdioClientTransport({ command: this.serverCommand, args: this.serverArgs });
    await this.mcp.connect(this.transport);
    this.connected = true;
  }

  async listTools(): Promise<{ data: any[]; error?: string }> {
    try {
      if (!this.connected) await this.connect();
      const tools = await this.mcp.listTools();
      return { data: tools };
    } catch (e: any) {
      return { data: [], error: e.message };
    }
  }

  async callTool(name: string, args: Record<string, any>): Promise<{ data: any; error?: string }> {
    try {
      if (!this.connected) await this.connect();
      const result = await this.mcp.callTool({ name, arguments: args });
      return { data: result };
    } catch (e: any) {
      return { data: null, error: e.message };
    }
  }

  async disconnect() {
    if (this.transport && this.transport.disconnect) {
      await this.transport.disconnect();
    }
    this.connected = false;
  }
}
