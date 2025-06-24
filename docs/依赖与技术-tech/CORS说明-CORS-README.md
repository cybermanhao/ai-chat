# MCP Python 服务端 CORS（跨域）配置说明

本说明适用于 MCP (Model Context Protocol) Python 服务端，介绍如何为 HTTP/SSE/Streamable-HTTP 等多协议服务端正确配置 CORS（跨域资源共享），以支持 Web 前端安全访问。

## 1. 推荐用法：middleware 参数一站式配置

以 FastMCP/Starlette/FastAPI 为例，推荐直接通过 `middleware` 参数传递 CORS 配置，无需手动注册 OPTIONS 路由或 add_middleware。

```python
from fastmcp import FastMCP
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import uvicorn

mcp = FastMCP("Demo 服务端")

# ...注册 tool/resource/prompt ...

if __name__ == "__main__":
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000"],  # 或 ["*"]
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
    ]
    http_app = mcp.http_app(
        transport="streamable-http",
        middleware=middleware
    )
    uvicorn.run(http_app, host="127.0.0.1", port=8000)
```

- `allow_origins` 建议填写你的前端实际地址，开发可用 `*`。
- `allow_headers` 建议至少包含 `mcp-protocol-version`，如需自定义 header 可加 `*`。
- 这样配置后，所有 HTTP 路由自动支持跨域和预检（OPTIONS），无需手动兜底。

## 2. 兼容 Starlette/FastAPI 低阶用法

如需为部分路由单独配置 CORS，可参考 Starlette 路由级 CORS 包装：

```python
def cors_middleware(handler, allow_methods, allow_origins=["*"], allow_headers=["mcp-protocol-version"]):
    return CORSMiddleware(
        app=request_response(handler),
        allow_origins=allow_origins,
        allow_methods=allow_methods,
        allow_headers=allow_headers
    )

# 在 Route 定义时包裹 endpoint
Route(
    "/token",
    endpoint=cors_middleware(token_handler, ["POST", "OPTIONS"], allow_origins=["http://localhost:3000"]),
    methods=["POST", "OPTIONS"]
)
```

## 3. 常见问题

- **405/跨域失败**：务必保证 CORS 中间件在所有 HTTP 路由前生效，且 OPTIONS 请求能被正确响应。
- **依赖缺失**：需安装 `starlette`、`uvicorn`、`fastapi` 等依赖。

```shell
pip install starlette uvicorn fastapi
```

- **安全建议**：生产环境请严格限定 allow_origins，避免使用 `*`。

## 4. 参考
- [Starlette CORS Middleware 文档](https://www.starlette.io/middleware/#corsmiddleware)
- [FastAPI CORS 官方文档](https://fastapi.tiangolo.com/tutorial/cors/)
- MCP Python 示例代码：`example/http-server-streamable.py`
- 认证相关源码：`mcp/server/auth/routes.py` 的 cors_middleware 实现

如有特殊协议或自定义需求，可参考源码灵活扩展。
