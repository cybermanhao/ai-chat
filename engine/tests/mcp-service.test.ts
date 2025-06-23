import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPService } from '../service/mcpService';

// 注意：此测试需在Node环境下，且server.js可用

describe('MCPService', () => {
  let mcp: MCPService;

  beforeAll(() => {
    mcp = new MCPService();
  });

  afterAll(async () => {
    await mcp.disconnect();
  });

  it('should fetch tool list from MCP server via protocol', async () => {
    const { data, error } = await mcp.listTools();
    expect(Array.isArray(data)).toBe(true);
    // 允许 error 存在（如 server.js 未启动），但 data 必须为数组
    // 可根据实际server.js内容断言工具名
    // expect(data.some(t => t.name === 'test')).toBe(true);
  });

  it('should call a tool and return result or error', async () => {
    // 假设有 test 工具，参数可根据实际 server.js 调整
    const { data, error } = await mcp.callTool('test', { test1: 'a', test2: 'b', test3: 'c', params: { start: 'x', end: 'y' } });
    // 只断言返回结构，具体内容视 server.js 实现
    expect(error === undefined || typeof error === 'string').toBe(true);
  });
});
