# MCP Node-Python 跨语言工具注册与调用需求文档

## 背景
目前 MCP Python 作为服务端、TypeScript SDK 作为前端客户端时，浏览器环境下 sessionId 管理存在兼容性问题，影响了会话一致性和多轮调用。为提升前端调用 Python 能力的灵活性与一致性，需规划一套基于 Node.js 的中间层，通过 WebSocket 封装 Python 函数，并注册为 MCP 工具，供前端统一调用。

## 目标
- 前端通过 MCP 协议调用 Node.js 注册的工具，实际由 Node.js 通过 WebSocket 调用 Python 后端函数。
- 保证 sessionId、调用链、错误处理等全流程一致。
- 支持多种 Python 业务函数的动态注册与调用。
- 兼容浏览器和 Node.js 环境，解决 sessionId 问题。

## 方案设计

### 架构流程
1. **前端**：通过 MCP TypeScript SDK 发起工具调用请求。
2. **Node.js MCP Server**：注册“代理工具”，收到调用后通过 WebSocket 转发给 Python。
3. **Python 服务**：实现 WebSocket 服务端，接收调用请求，执行对应 Python 函数并返回结果。
4. **Node.js**：收到 Python 返回结果后，按 MCP 协议响应前端。

### 关键模块
- Node.js MCP Server（基于 mcp-node）：
  - 工具注册：如 `defineTool({ name: 'py_add', ... })`
  - WebSocket 客户端：与 Python 后端保持长连接，转发参数、接收结果
  - sessionId 透传与管理
- Python WebSocket 服务端：
  - 动态注册/暴露业务函数（如 add, echo, ...）
  - 接收 JSON 请求，执行函数，返回 JSON 结果
- 前端：无需感知后端实现细节，统一通过 MCP SDK 调用

### 典型调用链
```
前端（MCP SDK）--HTTP/WS--> Node.js MCP Server --WebSocket--> Python --执行函数-->
  |<-----------------------------结果返回-----------------------------|
```

### 需求细节
1. Node.js 需支持注册多个“Python代理工具”，每个工具对应 Python 端的一个函数。
2. 工具调用参数、返回值需自动序列化/反序列化，支持复杂结构。
3. 支持 sessionId 透传，保证多轮会话一致性。
4. Python 端需支持多并发、错误捕获、超时处理。
5. Node.js 需处理 WebSocket 断线重连、异常兜底。
6. 工具注册、调用、返回均需有详细日志，便于排查。

### 示例
#### Node.js 端注册工具
```js
const pyAddTool = defineTool({
  name: 'py_add',
  description: '调用 Python add 函数',
  inputSchema: { type: 'object', properties: { a: { type: 'number' }, b: { type: 'number' } }, required: ['a', 'b'] },
  handler: async ({ a, b }) => {
    // 通过 wsClient 调用 Python
    const result = await wsClient.call('add', { a, b });
    return { content: [{ type: 'text', text: String(result) }] };
  }
});
```

#### Python 端暴露函数
```python
async def on_message(ws, message):
    req = json.loads(message)
    if req['func'] == 'add':
        result = add(req['a'], req['b'])
        await ws.send(json.dumps({'result': result}))
```

## 预期收益
- 前端调用 Python 能力更灵活，支持多种业务场景
- 彻底解决 sessionId 兼容性与多轮会话问题
- 便于后续扩展更多跨语言工具、微服务集成

---
如需详细接口设计、代码模板或原型实现，请补充说明。
