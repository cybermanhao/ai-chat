import { defineTool, createMcpServer } from './index.js';

const echoTool = defineTool({
  name: 'echo',
  description: '回显输入',
  inputSchema: {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text']
  },
  handler: async ({ text }: { text: string }) => ({
    content: [{ type: 'text', text }]
  })
});

const addTool = defineTool({
  name: 'add',
  description: '两个数相加',
  inputSchema: {
    type: 'object',
    properties: { a: { type: 'number' }, b: { type: 'number' } },
    required: ['a', 'b']
  },
  handler: async ({ a, b }: { a: number; b: number }) => ({
    content: [{ type: 'text', text: String(a + b) }]
  })
});

createMcpServer({
  tools: [echoTool, addTool],
  port: 8000
});
