# [BUG] MCP Python SDK sessionId not maintained in browser with TypeScript SDK client

# Issue: MCP Python SDK as Server, TypeScript SDK as Client – Node.js works, browser session management fails

## Description

When using the official MCP Python SDK (`fastmcp`) as the server and the TypeScript SDK as the client, session management (`mcp-session-id`) works correctly in Node.js, but fails in browser environments. This results in repeated "Missing session ID" errors or lost sessions for every request.

## Environment

- **Server:** MCP Python SDK (`fastmcp`), `streamable_http_app`, Starlette/uvicorn
- **Client:** TypeScript SDK (`@modelcontextprotocol/sdk`), `StreamableHTTPClientTransport`
- **Node.js:** Session management works out of the box
- **Browser (React/Vitest):** Session cannot be maintained
- **All code is reverted to official logic, no monkey patching or custom fetch**

## Key Code Snippets

**Server (`http-server-streamable.py`):**
```python
app = mcp.streamable_http_app()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
uvicorn.run(app, host="127.0.0.1", port=8000)
```

**Client (`mcpService.ts`):**
```typescript
// MCPService (browser and Node.js):
const transport = new StreamableHTTPClientTransport(new URL(this.url));
await mcp.connect(transport);
// In browser, MCPService does not automatically manage sessionId between requests.
// The first response from the server includes Mcp-Session-Id, but MCPService does not persist or inject it for subsequent requests.
// In Node.js, sessionId is managed via cookies and works as expected.
```

**Test Case (`mcp-streamable-browser.test.ts`):**
```typescript
import { describe, it, expect } from 'vitest';
import { MCPService } from '../../../engine/service/mcpService';

describe('MCPService streamable http tool list', () => {
  it('should fetch tool list from MCP Python server', async () => {
    const mcp = new MCPService('http://127.0.0.1:8000/mcp', 'STREAMABLE_HTTP');
    const result = await Promise.race([
      mcp.listTools(),
      new Promise<{ data: null; error: string }>(resolve => setTimeout(() => resolve({ data: null, error: 'timeout' }), 5000))
    ]);
    const { data, error } = result as { data: any; error: any };
    console.log('Tool list:', data, error);
    console.log('SessionId:', mcp['transport']?.sessionId);
  });
});
```

**Test Output:**
```text
Tool list: [ ... ] undefined
SessionId: a9911fbfa8fa4eb78dad791b2dddfc33
```

## Steps to Reproduce

1. Start MCP Python server with the CORS config above (expose_headers tried, but does not help).
2. The SDK makes two requests: the first response from the server includes a valid `Mcp-Session-Id` header, but the client does not send the sessionId in the header for the second request, causing session management to fail.
3. Same code in Node.js maintains sessionId correctly.

## Expected Behavior

- Browser environment should maintain session just like Node.js, with `mcp-session-id` correctly read and reused, so all requests are in the same session.

## Additional Notes

- CORS `expose_headers` is correctly configured; browser can see the header in devtools, but JS cannot read it or sessionId is not effective.
- All code is reverted to official logic, no custom handling.
- There may be a difference in sessionId handling between SDKs or server implementations.

## Request

- Please confirm if there is a bug in the TypeScript SDK sessionId handling for browsers, or a compatibility issue in the Python SDK server.
- Please provide best practices or a fix for browser session management.

## Log Output

Browser test output:
```text
[MCPService] 检查连接状态: 未连接
[MCPService] 尚未连接，尝试建立连接...
[MCPService] 开始连接服务器... URL: http://127.0.0.1:8000/mcp, 连接类型: STREAMABLE_HTTP
[MCPService] 已创建新的 MCP 客户端, 名称: mcp-client, 版本: 1.0.0
[MCPService] 使用 StreamableHTTP 传输, URL: http://127.0.0.1:8000/mcp
[MCPService] 开始建立连接...
[MCPService] 连接成功!
[MCPService] 开始获取工具列表...
[MCPService] 原始工具列表响应: { tools: [ ... ] }
[MCPService] 处理后的工具列表: [ ... ]
Tool list: [ ... ] undefined
```
