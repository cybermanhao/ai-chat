import { MCPService } from '@engine/service/mcpService';

// 移除多端口硬编码，统一由外部传入
export interface MCPResponse<T = unknown> {
  data: T
  error?: string
}

export class MCPServiceAdapter {
  private mcp: MCPService | null = null;

  constructor(url: string, mode: 'STDIO' | 'SSE' | 'STREAMABLE_HTTP' = 'STREAMABLE_HTTP') {
    this.mcp = new MCPService(url, mode);
  }

  async listTools(): Promise<MCPResponse<Array<{ name: string; description: string }>>> {
    const { data, error } = await this.mcp!.listTools();
    return { data, error };
  }

  async getGreeting(name: string): Promise<MCPResponse<string>> {
    const { data, error } = await this.mcp!.callTool('greeting', { name });
    return { data, error };
  }

  async translate(text: string): Promise<MCPResponse<string>> {
    const { data, error } = await this.mcp!.callTool('translate', { message: text });
    return { data, error };
  }

  async getWeather(cityCode: number): Promise<MCPResponse<string>> {
    const { data, error } = await this.mcp!.callTool('weather', { city_code: cityCode });
    return { data, error };
  }
}

// 默认导出一个 Adapter 实例，实际端口/协议由外部传入
export const mcpService = new MCPServiceAdapter('/mcp/streamable_http', 'STREAMABLE_HTTP');
// 如需切换 SSE 或 STDIO，可实例化 new MCPServiceAdapter(url, mode)
