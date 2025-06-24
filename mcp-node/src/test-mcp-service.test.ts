import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const SERVER_URL = 'http://127.0.0.1:8010/mcp-weather';
let serverProcess: ChildProcess | null = null;

async function waitForServerReady(url: string, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Server did not start in time');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Weather MCP Server Integration', () => {
  beforeAll(async () => {
    // 先编译 TypeScript
    execSync('pnpm tsc -p mcp-node', { stdio: 'inherit' });
    // 启动已编译的 server
    const serverPath = path.resolve(__dirname, '../dist/weather-server.js');
    serverProcess = spawn('node', [serverPath], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    await waitForServerReady('http://127.0.0.1:8010/mcp-weather');
  }, 20000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });

  it('should connect, list tools, call hello and add tool (single session)', async () => {
    // 创建 SDK Client 实例
    const client = new Client({ name: 'mcp-client', version: '1.0.0' });
    // 创建 StreamableHTTPClientTransport
    const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
    const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL));
    try {
      // 连接 MCP Server
      await client.connect(transport);

      // list tools
      const toolsResponse = await client.listTools();
      // toolsResponse 结构为 { [toolName]: { ...meta } }
      const tools = Object.entries(toolsResponse).map(([name, info]) => {
        const meta = info as any;
        return {
          name,
          title: meta.title || name,
          description: meta.description || '',
          type: meta.type || 'unknown',
        };
      });
      expect(Array.isArray(tools)).toBeTruthy();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.map(t => t.name)).toContain('hello');
      expect(tools.map(t => t.name)).toContain('add');

      // call hello tool
      const helloData = await client.callTool({ name: 'hello', arguments: { name: 'World' } });
      const helloContent = (helloData as any).content;
      expect(helloContent).toBeDefined();
      expect(Array.isArray(helloContent)).toBeTruthy();
      expect(helloContent[0].text).toContain('Hello, World');

      // call add tool
      const addData = await client.callTool({ name: 'add', arguments: { a: 2, b: 3 } });
      const addContent = (addData as any).content;
      expect(addContent).toBeDefined();
      expect(Array.isArray(addContent)).toBeTruthy();
      expect(addContent[0].text).toContain('Result: 5');

      // list prompts
      const promptsResponse = await client.listPrompts();
      const prompts = Object.entries(promptsResponse).map(([name, info]) => ({
        name,
        ...(info as any)
      }));
      expect(Array.isArray(prompts)).toBeTruthy();
      // 可根据实际 server 返回内容补充更细致断言

      // list resources
      const resourcesResponse = await client.listResources();
      const resources = Object.entries(resourcesResponse).map(([name, info]) => ({
        name,
        ...(info as any)
      }));
      expect(Array.isArray(resources)).toBeTruthy();
      // 可根据实际 server 返回内容补充更细致断言
    } finally {
      console.log('[TEST] 开始断开 MCP 客户端连接...');
      await client.close();
      console.log('[TEST] MCP 客户端已断开连接');
    }
  }, 20000); // 增加超时时间，防止 server 启动慢导致测试失败
});
