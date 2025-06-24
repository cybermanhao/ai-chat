# MCP 会话与生命周期管理（协议 2025-06-18）

## 1. MCP 会话（Session）机制

MCP “会话”指客户端与服务器之间从初始化开始的一系列逻辑相关交互。对于使用 Streamable HTTP 传输的服务器，推荐如下会话管理方式：

- **会话初始化**：
  - 服务器可在初始化响应（InitializeResult）中通过 `Mcp-Session-Id` HTTP 响应头分配会话 ID。
  - 会话 ID 应全局唯一且加密安全（如安全生成的 UUID、JWT 或加密哈希）。
  - 会话 ID 仅允许可见 ASCII 字符（0x21~0x7E）。

- **客户端行为**：
  - 若服务器返回 `Mcp-Session-Id`，客户端后续所有 HTTP 请求必须在头部携带该 ID：
    ```http
    Mcp-Session-Id: <session-id>
    ```
  - 若服务器要求 session ID，除初始化外未带该头的请求应返回 400 Bad Request。
  - 若服务器终止会话，后续带该 session ID 的请求应返回 404 Not Found。客户端收到 404 后应重新初始化新会话。
  - 客户端不再需要会话时，应发送 HTTP DELETE 到 MCP 端点并带上 session ID，显式终止会话。服务器可用 405 表示不支持客户端主动终止。

## 2. 生命周期（Lifecycle）

MCP 协议定义了严谨的连接生命周期，确保能力协商和状态管理：

- **初始化（Initialization）**：
  - 客户端发送 `initialize` 请求，声明协议版本、能力、实现信息。
  - 服务器响应自身能力、协议版本、实现信息。
  - 客户端收到响应后，发送 `notifications/initialized` 通知，表示准备好进入正常操作。

- **版本协商**：
  - 客户端在 `initialize` 请求中声明支持的协议版本。
  - 服务器如支持则返回相同版本，否则返回自身支持的最新版本。
  - 客户端如不支持服务器返回的版本，应断开连接。
  - HTTP 传输下，所有后续请求都需带 `MCP-Protocol-Version` 头。

- **能力协商**：
  - 客户端和服务器通过 capabilities 字段协商可用功能（如 roots、sampling、prompts、resources、tools、logging 等）。
  - 仅协商成功的能力可在会话中使用。

- **操作阶段（Operation）**：
  - 按协商结果进行正常协议通信。
  - 双方必须遵守协商的协议版本和能力。

- **关闭（Shutdown）**：
  - 客户端或服务器可随时关闭连接。
  - stdio 传输下，客户端关闭输入流，等待服务器退出。
  - HTTP 传输下，关闭 HTTP 连接即为断开。

## 3. 超时与错误处理

- 所有请求都应有超时机制，防止连接挂起。
- 超时后应主动取消请求。
- 可根据进度通知重置超时，但应有最大超时限制。
- 常见错误包括协议版本不匹配、能力协商失败、请求超时等。

**示例初始化请求：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "elicitation": {}
    },
    "clientInfo": {
      "name": "ExampleClient",
      "title": "Example Client Display Name",
      "version": "1.0.0"
    }
  }
}
```

**示例初始化响应：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "logging": {},
      "prompts": { "listChanged": true },
      "resources": { "subscribe": true, "listChanged": true },
      "tools": { "listChanged": true }
    },
    "serverInfo": {
      "name": "ExampleServer",
      "title": "Example Server Display Name",
      "version": "1.0.0"
    },
    "instructions": "Optional instructions for the client"
  }
}
```

**示例 initialized 通知：**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

## 4. 参考
- MCP 官方协议文档
- [MCP Python SDK 源码](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [MCP CORS 与安全最佳实践](./CORS-SECURITY-BEST-PRACTICES.md)
