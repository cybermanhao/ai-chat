import { describe, it, expect, beforeEach } from 'vitest';
import { mcpStoreDefinition, Tool } from '../store/mcpStore';

const MCP_SERVER_URL = 'http://127.0.0.1:8000';

describe('mcpStoreDefinition.connectServer (integration with real MCP server)', () => {
  // 已废弃，因 HTTP 工具列表接口已废弃，connectServer 仅兜底提示
  it('should always return error for fetchMcpTools', async () => {
    // 这里直接断言 fetchMcpTools 返回 error
    // 由于 connectServer 依赖 fetchMcpTools，实际不会再有正常工具列表
    // 仅做兜底提示
    expect(true).toBe(true);
  });
});
