import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MCPService } from '../service/mcpService';

describe('MCP Server Integration Test', () => {
  let mcpService: MCPService;

  beforeEach(() => {
    mcpService = new MCPService('http://localhost:8000/mcp', 'STREAMABLE_HTTP');
  });

  afterEach(async () => {
    await mcpService.disconnect();
  });

  it('should connect and list tools', async () => {
    const { data: tools, error } = await mcpService.listTools();
    console.log('[Test] Available tools:', tools);
    expect(error).toBeUndefined();
    expect(Array.isArray(tools)).toBeTruthy();
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should call weather tool successfully', async () => {
    const { data, error } = await mcpService.callTool('weather', { city_code: 101010100 });
    console.log('[Test] Weather tool response:', data);
    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(data.content[0].text).toContain('天气信息');
  });

  it('should call test tool with complex parameters', async () => {
    const testParams = {
      params: { start: '2024-01-01', end: '2024-12-31' },
      test1: 'Hello',
      test2: ['World', 'MCP'],
      test3: 'Test'
    };
    
    const { data, error } = await mcpService.callTool('test', testParams);
    console.log('[Test] Test tool response:', data);
    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(data.content[0].text).toBeDefined();

    // 验证返回的 JSON 是否包含所有参数
    const responseData = JSON.parse(data.content[0].text);
    expect(responseData).toContain('Hello');
    expect(responseData).toContain('Test');
    expect(responseData[1]).toEqual(['World', 'MCP']);
  });
});
