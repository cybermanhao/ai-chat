# MCP Python 服务端 CORS（跨域）配置与安全最佳实践

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

## 2. 常见问题

- **405 Method Not Allowed (OPTIONS)**：只要用 `add_middleware(CORSMiddleware, ...)`，Starlette 会自动处理所有 OPTIONS 预检请求。
- **400 Bad Request: Missing session ID**：MCP 协议要求前端请求带 `mcp-session-id` header。用官方 SDK 会自动管理，手写 HTTP 客户端需手动实现 session id 复用。
- **middleware 参数不可用**：FastMCP 的 `streamable_http_app()` 不支持 `middleware` 参数，只能用 `add_middleware`。

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
- MCP 官方文档与源码
