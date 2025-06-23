import { describe, it, expect, beforeEach } from 'vitest';
import { mcpStoreDefinition, Tool } from '../store/mcpStore';

const MCP_SERVER_URL = 'http://127.0.0.1:8000';

describe('mcpStoreDefinition.connectServer (integration with real MCP server)', () => {
  let state: any;
  let get: any;
  let set: any;

  beforeEach(() => {
    state = {
      servers: [
        {
          id: 's1',
          name: 'PythonMCP',
          url: MCP_SERVER_URL,
          isConnected: false,
          tools: [],
          error: undefined
        }
      ],
      activeServerId: undefined,
      isLoading: false,
      messages: [],
      currentModel: ''
    };
    get = () => state;
    set = (fn: any) => {
      const newState = fn(state);
      state = { ...state, ...newState };
    };
  });

  it('should connect to real MCP server and fetch tools', async () => {
    const store = mcpStoreDefinition(set, get);
    await store.connectServer('s1');
    // 工具列表应包含 test、weather 等
    expect(state.servers[0].isConnected).toBe(true);
    expect(Array.isArray(state.servers[0].tools)).toBe(true);
    expect(state.servers[0].tools.length).toBeGreaterThan(0);
    const toolNames = state.servers[0].tools.map((t: Tool) => t.name);
    expect(toolNames).toContain('test');
    expect(toolNames).toContain('weather');
    expect(state.servers[0].error).toBeUndefined();
    expect(state.activeServerId).toBe('s1');
    expect(state.isLoading).toBe(false);
  });

  it('should handle connection error gracefully', async () => {
    // 使用不存在的端口模拟失败
    state.servers[0].url = 'http://127.0.0.1:9999';
    const store = mcpStoreDefinition(set, get);
    await store.connectServer('s1');
    expect(state.servers[0].isConnected).toBe(false);
    expect(state.servers[0].tools).toEqual([]);
    expect(typeof state.servers[0].error).toBe('string');
    expect(state.isLoading).toBe(false);
  });
});
