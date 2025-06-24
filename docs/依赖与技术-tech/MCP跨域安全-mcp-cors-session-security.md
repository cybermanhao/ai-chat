# MCP Python 服务端 CORS 与会话/生命周期安全最佳实践

## 1. CORS（跨域）配置

MCP Python 服务端基于 Starlette/FastAPI，推荐如下方式全局配置跨域：

```python
from mcp.server.fastmcp import FastMCP
from starlette.middleware.cors import CORSMiddleware
import uvicorn

mcp = FastMCP("你的服务名")

# ...注册 tool/resource/prompt ...

if __name__ == "__main__":
    app = mcp.streamable_http_app()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # 或 ["*"]，生产建议写明前端域名
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    uvicorn.run(app, host="127.0.0.1", port=8000)
```

- `add_middleware` 是 Starlette 推荐的全局 CORS 配置方式。
- `allow_origins` 建议开发用 `*`，生产写明前端域名。
- `allow_headers` 建议至少包含 `mcp-protocol-version`，如需自定义 header 可用 `*`。
- 这样所有 HTTP 路由自动支持跨域和预检（OPTIONS），无需手动注册 OPTIONS 路由。

## 2. MCP 会话（Session）机制与生命周期

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

- **生命周期阶段**：
  - 初始化（Initialization）：能力协商、协议版本协商、实现信息交换。
  - 操作（Operation）：按协商结果进行正常协议通信。
  - 关闭（Shutdown）：客户端或服务器可随时关闭连接。

- **超时与错误处理**：
  - 所有请求都应有超时机制，防止连接挂起。
  - 超时后应主动取消请求。
  - 常见错误包括协议版本不匹配、能力协商失败、请求超时等。

## 3. 安全最佳实践

### Confused Deputy 问题
- MCP 代理服务器如使用静态 client_id，**必须**在每次为新客户端转发到第三方授权服务器前，确保用户重新同意。
- 不要依赖第三方授权服务器的同意 cookie 跳过机制。

### Token Passthrough（令牌透传）
- MCP 服务器**绝不能**接受未明确颁发给自身的令牌，必须校验 audience、issuer 等关键信息。

### 会话劫持（Session Hijacking）
- MCP 服务器**必须**对所有请求进行授权校验，**不能**仅凭 session ID 进行身份认证。
- session ID 必须使用安全的随机生成方式，避免可预测。
- 推荐将 session ID 与用户唯一标识绑定（如 `<user_id>:<session_id>`），即使 session ID 泄露，攻击者也无法冒充其他用户。
- 可定期轮换、过期 session ID，降低风险。

## 4. 依赖说明

确保已安装：

```sh
pip install starlette fastapi uvicorn
```

## 5. 参考
- [Starlette CORS Middleware 文档](https://www.starlette.io/middleware/#corsmiddleware)
- [OAuth 2.0 安全最佳实践](https://datatracker.ietf.org/doc/html/rfc9700)
- MCP 官方协议文档
- [MCP Python SDK 源码](https://github.com/modelcontextprotocol/modelcontextprotocol)
