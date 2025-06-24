import { describe, it, expect } from 'vitest';
import { MCPService } from '../../../engine/service/mcpService';

const STREAMABLE_URL = 'http://127.0.0.1:8000/mcp';

type Tool = { name: string; description: string };

describe('MCPService streamable http tool list', () => {
  it('should fetch tool list from MCP Python server', async () => {
    const mcp = new MCPService(STREAMABLE_URL, 'STREAMABLE_HTTP');
    const { data, error } = await mcp.listTools();
    // eslint-disable-next-line no-console
    console.log('Tool list:', data, error);
    let tools: Tool[] = [];
    if (Array.isArray(data)) {
      tools = data;
    } else if (data && typeof data === 'object' && Array.isArray((data as { tools?: Tool[] }).tools)) {
      tools = (data as { tools: Tool[] }).tools;
    }
    expect(Array.isArray(tools)).toBe(true);
    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toEqual(expect.arrayContaining(['test', 'weather']));
  });
});
