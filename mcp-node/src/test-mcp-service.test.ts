import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MCPService } from '../../engine/service/mcpService.js';
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
    const mcpService = new MCPService(SERVER_URL, 'STREAMABLE_HTTP');
    try {
      await mcpService.connect();

      // list tools
      const { data: tools, error } = await mcpService.listTools();
      expect(error).toBeUndefined();
      expect(Array.isArray(tools)).toBeTruthy();
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.map(t => t.name)).toContain('hello');
      expect(tools.map(t => t.name)).toContain('add');

      // call hello tool
      const { data: helloData, error: helloError } = await mcpService.callTool('hello', { name: 'World' });
      expect(helloError).toBeUndefined();
      expect(helloData).toBeDefined();
      expect(helloData.content[0].text).toContain('Hello, World');

      // call add tool
      const { data: addData, error: addError } = await mcpService.callTool('add', { a: 2, b: 3 });
      expect(addError).toBeUndefined();
      expect(addData).toBeDefined();
      expect(addData.content[0].text).toContain('Result: 5');
    } finally {
      await mcpService.disconnect();
    }
  });
});
