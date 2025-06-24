# Weather MCP Streamable HTTP Server (TypeScript)

This server implements an MCP (Model Context Protocol) Streamable HTTP endpoint using Express and the MCP SDK. It provides weather-related tools and can be accessed by MCP-compatible clients.

## Usage

### 1. Install dependencies

```
npm install
```

### 2. Build and run the server

```
npm run weather-server
```

Or run directly with environment variables:

```
PORT=8010 HOST=127.0.0.1 npx ts-node mcp-node/weather-server.ts
```

### 3. Accessing the server

- The MCP endpoint is available at: `http://<HOST>:<PORT>/mcp-weather`
- You can POST/GET to this endpoint using an MCP-compatible client (see the reference example in `docs/示例-examples/mcp-streamable-http`).

### 4. Customizing port and host

- Set the `PORT` and `HOST` environment variables to change the listening address.
- Defaults: `PORT=8010`, `HOST=127.0.0.1`

## Integration Pattern

- The MCP Streamable HTTP transport is created with only a `sessionIdGenerator` (if needed), **not** with `path`, `port`, or `host`.
- The Express app mounts the MCP handler at the desired path (e.g., `/mcp-weather`).
- Example:

```ts
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
await server.connect(transport);
app.use("/mcp-weather", (req, res) => transport.handler(req, res));
```

## Reference
- See `docs/示例-examples/mcp-streamable-http/typescript-example/server/` for a full-featured example.
- MCP Protocol Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http

## Troubleshooting
- Do **not** pass `path`, `port`, or `host` to the MCP transport constructor; use Express for routing and listening.
- If you see TypeScript errors about constructor arguments, check that you are following the above pattern.

# WEATHER_SERVER 脚本写法说明

## 为什么要用 `node --loader ts-node/esm ...` 而不是 `ts-node --esm ...`

### 1. Node.js ESM 与 TypeScript 的兼容性
- 本项目采用了 TypeScript + ESM（即 `type: "module"`），且源码为 `.ts` 文件。
- 直接用 `ts-node --esm` 在部分 Node/ts-node 版本下，无法正确处理 ESM + TypeScript 的组合，尤其在 Windows 下经常报错 `Unknown file extension ".ts"`。
- ts-node 官方推荐在 ESM 项目中用 Node 的 `--loader` 机制：
  ```sh
  node --loader ts-node/esm your-script.ts
  ```
  这样 Node 会用 ts-node 的 ESM loader 动态编译并执行 TypeScript 源码。

### 2. 跨平台兼容性（Windows/macOS/Linux）
- 直接用 `ts-node --esm ...` 在 Windows 下经常报错，且 `--loader` 选项并非所有 ts-node 版本都支持。
- 用 `node --loader ts-node/esm ...` 可保证在所有主流平台和 CI 环境下都能一致运行。

### 3. 未来兼容性
- Node.js 18+ 对 ESM loader 的支持更完善，ts-node 官方也推荐此写法。
- 虽然会有 `ExperimentalWarning`，但不影响功能，且未来 ts-node/Node.js 会持续改进。

## 具体脚本写法
```json
"weather-server": "node --loader ts-node/esm mcp-node/src/weather-server.ts",
"weather-test": "node --loader ts-node/esm mcp-node/src/test-mcp-service.ts"
```
- 这样写可直接运行 TypeScript 源码，无需预编译。
- 适用于开发、调试、自动化测试等场景。

## 参考资料
- [ts-node ESM 官方文档](https://typestrong.org/ts-node/docs/esm/)
- [Node.js ESM loader 官方文档](https://nodejs.org/api/esm.html#loaders)
- 项目内 `docs/typescript-module-config-guide.md`

---
如需生产环境部署，建议用 `tsc` 预编译为 JS 后再用 Node 运行（见 `weather-server:js` 脚本）。

---

## 本次开发/集成过程中的主要难点总结

1. **TypeScript + ESM + Node.js 运行兼容性**
   - 直接用 `ts-node --esm` 在 Windows 下经常报错，提示 `Unknown file extension ".ts"`，导致无法直接运行 TypeScript 源码。
   - 需要采用 `node --loader ts-node/esm ...` 的写法，才能保证 ESM 项目在各平台下都能正常运行。

2. **npm script 路径与跨平台问题**
   - Windows 下路径分隔符、ts-node 解析等与 macOS/Linux 不同，脚本需统一用 POSIX 风格路径，且不能依赖 cross-env。
   - 通过多次调整，最终统一为 `node --loader ts-node/esm mcp-node/src/xxx.ts`，保证所有平台一致。

3. **CORS 跨域支持**
   - 需要在 MCP Server 端手动添加标准 CORS header，确保 web 端页面可跨域访问。
   - 相关配置已在 `weather-server.ts` 中实现。

4. **MCP Server/Client 协议互通与自动化测试**
   - 需用官方 SDK 实现最简 MCP client，测试 listTools、工具调用等功能。
   - 自动化测试脚本需支持一键启动、关闭 server，避免 session 冲突。

5. **web 端动态配置 MCP server 地址**
   - 页面和 store 需支持动态添加/连接 MCP server，端口和路由由 UI/store 控制，完全解耦硬编码。

6. **文档与开发指引**
   - 需在本文件中详细记录脚本写法原因、兼容性说明及开发过程中的主要难点，方便后续维护和团队协作。

---
如有更多问题，建议查阅本项目 docs 目录下相关文档或官方 ts-node/Node.js 指南。
