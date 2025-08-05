import { describe, it, expect } from 'vitest';
import { MCPClient } from '../service/mcpClient';

const STREAMABLE_URL = 'http://127.0.0.1:8000/mcp';

describe('mcpClient streamable http tool list', () => {
  it('should fetch tool list from MCP Python server', async () => {
    const mcp = new MCPClient(STREAMABLE_URL, 'STREAMABLE_HTTP');
    const { data, error } = await mcp.listTools();
    // 打印工具列表
    // eslint-disable-next-line no-console
    console.log('Tool list:', data, error);
    // 兼容 { tools: [...] } 或直接数组
    let tools: any[] = [];
    if (Array.isArray(data)) {
      tools = data;
    } else if (data && typeof data === 'object' && Array.isArray((data as any).tools)) {
      tools = (data as any).tools;
    }
    expect(Array.isArray(tools)).toBe(true);
    // 断言至少包含 test/weather 两个工具
    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toEqual(expect.arrayContaining(['test', 'weather']));
  });
});
