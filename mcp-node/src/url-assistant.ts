import { defineTool, createMcpServer } from './index.js';
import WebSocket from 'ws';

class RagWsClient {
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

const ragWsClient = new RagWsClient('ws://127.0.0.1:9101/ws');

const queryUrlTool = defineTool({
    name: 'query_url',
    description: '根据用户自然语言问题，智能检索RAG系统，返回最合适的页面URL及相关信息，供用户跳转或操作。',
    inputSchema: {
        type: 'object',
        properties: { natural_language_input: { type: 'string' } },
        required: ['natural_language_input']
    },
    handler: async ({ natural_language_input }: { natural_language_input: string }) => {
        const result = await ragWsClient.call('query_url', { natural_language_input });
        console.log('[DEBUG] query_url result:', result);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
});

const termMatchTool = defineTool({
    name: 'term_match',
    description: '术语向量匹配：将自然语言与术语库匹配，返回相关术语及链接',
    inputSchema: {
        type: 'object',
        properties: { text: { type: 'string' }, top_k: { type: 'integer', default: 3 } },
        required: ['text']
    },
    handler: async ({ text, top_k }: { text: string, top_k?: number }) => {
        const result = await ragWsClient.call('term_match', { text, top_k });
        console.log('[DEBUG] term_match result:', result);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
});

console.log('[MCP SDK] 注册的RAG工具:', [queryUrlTool.name, termMatchTool.name]);

createMcpServer({
    tools: [queryUrlTool, termMatchTool],
    port: 10093,
    mcpPath: '/mcp'
});
