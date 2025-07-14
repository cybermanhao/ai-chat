# StreamableHTTPServerTransport 源码解析

## 1. 设计目标
`StreamableHTTPServerTransport` 是 MCP Python SDK 的 HTTP 传输层实现，支持 JSON-RPC 消息的 HTTP POST 处理和 SSE（Server-Sent Events）流式推送，适用于长连接和事件驱动的 AI 服务。

- 支持会话管理（Session）和事件存储（EventStore），可实现断线重连和消息补发。
- 支持 JSON 响应和 SSE 流响应两种模式。
- 兼容 Starlette/FastAPI 的 ASGI 规范。

## 2. 主要成员变量
- `mcp_session_id`：会话标识，支持 ASCII 可见字符。
- `is_json_response_enabled`：是否启用 JSON 响应（否则用 SSE）。
- `_event_store`：事件存储接口，支持消息补发。
- `_request_streams`：每个请求的内存流，便于异步消息处理。
- `_terminated`：会话是否已终止。

## 3. 关键方法解析
### __init__
初始化传输层，校验 session_id 合法性，设置事件存储和流。

### handle_request
ASGI 入口，按 HTTP 方法分发到 POST/GET/DELETE/其它处理。
- POST：处理 JSON-RPC 消息，支持 JSON/SSE 响应。
- GET：建立 SSE 长连接，支持事件补发（断线重连）。
- DELETE：显式终止会话。

### _handle_post_request
- 校验 Accept 和 Content-Type。
- 解析 JSON-RPC 消息体，校验和反序列化。
- 初始化请求流，异步处理消息。
- JSON 响应模式：等待响应消息后返回。
- SSE 模式：通过内存流推送事件。

### _handle_get_request
- 校验 Accept 是否支持 SSE。
- 支持 Last-Event-ID 补发（断线重连）。
- 建立 SSE 流，异步推送事件。

### _handle_delete_request
- 校验 session_id。
- 关闭所有流，标记会话终止。

### _create_error_response/_create_json_response
- 统一错误和 JSON 响应格式，带 session_id。

### _validate_session
- 校验请求头中的 session_id 是否与当前会话一致。

### _clean_up_memory_streams
- 关闭并清理指定请求的内存流，防止资源泄漏。

## 4. FastMCP集成与用法

在 `FastMCP.server.py` 中，`StreamableHTTPSessionManager` 和 `StreamableHTTPServerTransport` 被集成为高层 HTTP 服务能力：

- `FastMCP.streamable_http_app()` 方法会懒加载创建 `StreamableHTTPSessionManager`，并将其作为 Starlette 路由的 ASGI handler。
- 支持 `json_response` 和 `stateless_http` 配置，灵活切换响应模式和会话管理方式。
- 路由挂载到 `settings.streamable_http_path`（如 `/mcp`），可直接对接 MCP 客户端。
- 支持自定义认证中间件和多路由扩展。
- 会话管理器通过 `handle_request` 方法自动分发到底层 `StreamableHTTPServerTransport`，实现高性能流式推送和会话追踪。

## 5. 典型用法
- 作为 Starlette/FastAPI 的 ASGI handler，支持多种 HTTP 方法。
- 支持 AI 服务的流式推送和断线重连。
- 可扩展事件存储，实现消息补发和持久化。
- 在 FastMCP 中只需配置参数即可获得完整的 HTTP/流式能力。

## 6. 总结
`StreamableHTTPServerTransport` 通过内存流和异步事件机制，实现了高性能、可扩展的 HTTP 会话管理和流式推送，适合 AI/LLM 服务的实时交互场景。FastMCP 进一步封装了会话管理和路由集成，极大简化了应用开发。

---
如需更详细的源码注释或具体方法解析，可进一步补充。
