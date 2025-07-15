import { describe, it, expect } from 'vitest';
import { MCPService } from '../../../engine/service/mcpService';

const MCP_URL = 'http://127.0.0.1:10092/mcp';

type Tool = { name: string; description: string };

describe('MCPService custom http tool list', () => {
  it('should fetch tool list from MCP custom server', async () => {
    const mcp = new MCPService(MCP_URL, 'STREAMABLE_HTTP');
    const result = await Promise.race([
      mcp.listTools(),
      new Promise<{ data: null; error: string }>(resolve => setTimeout(() => resolve({ data: null, error: 'timeout' }), 5000))
    ]);
    const { data, error } = result as { data: any; error: any };
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
    expect(toolNames.length).toBeGreaterThan(0);
    expect(toolNames).toEqual(expect.arrayContaining(['reverse', 'is_palindrome', 'greeting', 'translate', 'test', 'weather']));
    if (error) {
      console.error('MCPService error:', error);
    }
  });
});
