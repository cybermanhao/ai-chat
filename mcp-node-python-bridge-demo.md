# 最简 Node.js MCP Server + Python ASGI 服务端桥接原型

## 目录结构建议
```
project-root/
  mcp-node/
    simple-mcp-server.js
  mcp-python/
    simple-asgi-server.py
```

---

## 1. Python 端（ASGI，WebSocket）

`mcp-python/simple-asgi-server.py`

```python
import json
from fastapi import FastAPI, WebSocket
import uvicorn

app = FastAPI()

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    while True:
        data = await ws.receive_text()
        req = json.loads(data)
        # 只支持 add 函数
        if req.get('func') == 'add':
            a, b = req['a'], req['b']
            result = a + b
            await ws.send_text(json.dumps({'result': result}))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9000)
```

---

## 2. Node.js 端（MCP Server，调用 Python）

`mcp-node/simple-mcp-server.js`

```js
import { defineTool, createMcpServer } from './dist/index.js';
import WebSocket from 'ws';

// 简单的 ws 客户端封装
class PyWsClient {
  constructor(url) {
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
  call(func, params) {
    return new Promise((resolve, reject) => {
      const send = () => {
        this.ws.once('message', msg => {
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

const pyAddTool = defineTool({
  name: 'py_add',
  description: '调用 Python add',
  inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] },
  handler: async ({ a, b }) => {
    const result = await wsClient.call('add', { a, b });
    return { content: [{ type: 'text', text: String(result) }] };
  }
});

createMcpServer({
  tools: [pyAddTool],
  port: 8000
});
```

---

## 3. 调用流程
- 启动 Python: `python simple-asgi-server.py`
- 启动 Node: `node simple-mcp-server.js`
- 前端通过 MCP 协议调用 `py_add` 工具即可间接调用 Python add 函数。

---
如需 TypeScript 版本或更复杂参数支持，可继续补充。
