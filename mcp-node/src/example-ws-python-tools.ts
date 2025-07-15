import { defineTool, createMcpServer } from './index.js';
import WebSocket from 'ws';

// 简单的 ws 客户端封装
class PyWsClient {
  url: string;
  ws: any;
  ready: boolean;
  queue: Array<() => void>;
  constructor(url: string) {
    this.url = url;
    this.ws = null;
    this.ready = false;
    this.queue = [];
    this.connect();
  }
  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.on('open', () => {
      this.ready = true;
      this.queue.forEach(fn => fn());
      this.queue = [];
    });
    this.ws.on('close', () => { this.ready = false; });
    this.ws.on('error', () => { this.ready = false; });
  }
  call(func: string, params: Record<string, any>) {
    return new Promise((resolve, reject) => {
      const send = () => {
        this.ws.once('message', (msg: string) => {
          try {
            const res = JSON.parse(msg);
            resolve(res.result);
          } catch (e) { reject(e); }
        });
        this.ws.send(JSON.stringify({ func, ...params }));
      };
      if (this.ready) send();
      else this.queue.push(send);
    });
  }
}

const wsClient = new PyWsClient('ws://127.0.0.1:9000/ws');

const reverseTool = defineTool({
  name: 'reverse',
  description: '字符串反转',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  },
  handler: async ({ text }: { text: string }) => {
    const result = await wsClient.call('reverse', { text });
    return { content: [{ type: 'text', text: result }] };
  }
});

const palindromeTool = defineTool({
  name: 'is_palindrome',
  description: '判断字符串是否为回文',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  },
  handler: async ({ text }: { text: string }) => {
    const result = await wsClient.call('is_palindrome', { text });
    return { content: [{ type: 'text', text: String(result) }] };
  }
});

const greetingTool = defineTool({
  name: 'greeting',
  description: 'greeting 工具）',
  inputSchema: {
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name']
  },
  handler: async ({ name }: { name: string }) => {
    const result = await wsClient.call('greeting', { name });
    return { content: [{ type: 'text', text: result }] };
  }
});

const translateTool = defineTool({
  name: 'translate',
  description: 'translate 工具',
  inputSchema: {
    type: 'object',
    properties: { message: { type: 'string' } },
    required: ['message']
  },
  handler: async ({ message }: { message: string }) => {
    const result = await wsClient.call('translate', { message });
    return { content: [{ type: 'text', text: result }] };
  }
});

const testTool = defineTool({
  name: 'test',
  description: 'test 工具',
  inputSchema: {
    type: 'object',
    properties: {
      params: { type: 'object', properties: { start: { type: 'string' }, end: { type: 'string' } }, required: ['start', 'end'] },
      test1: { type: 'string' },
      test2: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
      test3: { type: 'string' }
    },
    required: ['params', 'test1']
  },
  handler: async ({ params, test1, test2, test3 }: any) => {
    const result = await wsClient.call('test', { params, test1, test2, test3 });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
});

const weatherTool = defineTool({
  name: 'weather',
  description: 'weather 工具',
  inputSchema: {
    type: 'object',
    properties: { city_code: { type: 'integer' } },
    required: ['city_code']
  },
  handler: async ({ city_code }: { city_code: number }) => {
    const result = await wsClient.call('weather', { city_code });
    return { content: [{ type: 'text', text: String(result) }] };
  }
});

console.log('[MCP SDK] 注册的工具:', [
  reverseTool.name,
  palindromeTool.name,
  greetingTool.name,
  translateTool.name,
  testTool.name,
  weatherTool.name
]);

createMcpServer({
  tools: [reverseTool, palindromeTool, greetingTool, translateTool, testTool, weatherTool],
  port: 10092,
  mcpPath: '/mcp'
});
