# MCP Node 跨平台开发与 CORS 踩坑总结

本项目在集成 MCP Server/Client、web 跨端调试、自动化测试等过程中，遇到了多项与 npm script 路径、TypeScript/ESM 运行、CORS 跨域相关的兼容性难题。现总结如下，供团队参考。

## 1. npm script 路径与 TypeScript/ESM 跨平台兼容性

- **问题现象**：
  - 直接用 `ts-node --esm mcp-node/src/weather-server.ts` 在 Windows 下经常报错 `Unknown file extension ".ts"`，而 macOS/Linux 下有时可用。
  - `ts-node` 的 `--esm` 选项在不同 Node/ts-node 版本下行为不一，且 Windows 下 loader 机制支持有限。
  - 路径分隔符、环境变量等在 Windows 与类 Unix 系统下表现不同，`cross-env` 方案已弃用。

- **最佳实践**：
  - 统一采用 `node --loader ts-node/esm mcp-node/src/xxx.ts` 方式运行 TypeScript 源码，保证 ESM 项目在所有主流平台和 CI 环境下都能一致运行。
  - npm script 路径全部用 POSIX 风格（正斜杠），避免平台差异。
  - 生产环境建议用 `tsc` 预编译为 JS 后再用 Node 运行。

- **参考脚本**：
  ```json
  "weather-server": "node --loader ts-node/esm mcp-node/src/weather-server.ts",
  "weather-test": "node --loader ts-node/esm mcp-node/src/test-mcp-service.ts"
  ```

- **官方资料**：
  - [ts-node ESM 官方文档](https://typestrong.org/ts-node/docs/esm/)
  - [Node.js ESM loader 官方文档](https://nodejs.org/api/esm.html#loaders)

## 2. CORS 跨域支持

- **问题现象**：
  - MCP Server 需支持 web 端页面、自动化测试等多端跨域访问。
  - 若未正确设置 CORS header，浏览器端请求会被拦截，无法正常通信。

- **最佳实践**：
  - 在 MCP Server（如 `weather-server.ts`）中手动添加标准 CORS header：
    ```js
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    ```
  - 支持 OPTIONS 预检请求，确保所有主流浏览器和前端框架可用。
  - 详细 CORS 配置与安全建议见：
    - `docs/依赖与技术-tech/CORS-README.md`
    - `docs/依赖与技术-tech/CORS安全最佳实践-CORS-SECURITY-BEST-PRACTICES.md`
    - `docs/依赖与技术-tech/MCP跨域安全-mcp-cors-session-security.md`

## 3. 其他相关难点

- MCP Server/Client 协议互通需严格遵循官方 SDK 用法，Express 路由与 MCP handler 解耦。
- 自动化测试需支持一键启动/关闭 server，避免 session 冲突。
- web 端页面/store 支持动态配置 MCP server 地址，完全解耦端口与路由硬编码。

---
如遇到相关问题，建议优先查阅本文件及上述 docs 目录下相关文档。
