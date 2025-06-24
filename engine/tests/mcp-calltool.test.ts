import { describe, it, expect } from 'vitest';
import { MCPService } from '../service/mcpService';

const STREAMABLE_URL = 'http://127.0.0.1:8000/mcp';

describe('MCPService callTool', () => {
  it('should call weather tool and return result', async () => {
    const mcp = new MCPService(STREAMABLE_URL, 'STREAMABLE_HTTP');
    // 假设 101010100 是北京的城市编码
    const { data, error } = await mcp.callTool('weather', { city_code: 101010100 });
    // 打印返回内容
    // eslint-disable-next-line no-console
    console.log('Weather tool result:', data, error);
    expect(error).toBeFalsy();
    expect(typeof data).toBe('object');
    expect(Array.isArray(data.content)).toBe(true);
    expect(typeof data.content[0].text).toBe('string');
    expect(data.content[0].text).toMatch(/city|weather|temp|北京|Beijing/i);
  });
});
