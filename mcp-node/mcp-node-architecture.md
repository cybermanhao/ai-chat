---
id: mcp-node-architecture
---
```mermaid
%% MCP Node 文件模块关系图
flowchart TD
    config["config.ts / config.js"] -->|加载配置| mcpService["mcp-service.ts"]
    mcpService -->|管理会话| sessionManager["session-manager.ts"]
    mcpService -->|管理MCP服务器| mcpServerManager["mcp-server-manager.ts"]
    mcpService -->|HTTP路由| httpServer["http-server.ts"]
    mcpService -->|加载Transport| streamableHttp["@modelcontextprotocol/sdk/server/streamableHttp.js"]
    mcpServerManager -->|工具管理| toolManager["tool-manager.ts"]
    mcpServerManager -->|服务器信息| serverInfo["server-info.ts"]
    sessionManager -->|会话数据| sessionData["SessionData接口"]
    httpServer -->|Express集成| express["express"]
    subgraph MCP-Node-src
        config
        mcpService
        sessionManager
        mcpServerManager
        toolManager
        serverInfo
        httpServer
        sessionData
        streamableHttp
        express
    end
```

# MCP-Node 文件模块架构说明

- **config.ts / config.js**：配置加载与管理。
- **mcp-service.ts**：服务主入口，协调各模块。
- **session-manager.ts**：会话生命周期管理。
- **mcp-server-manager.ts**：MCP服务器实例与工具管理。
- **tool-manager.ts**：工具注册与调用。
- **server-info.ts**：服务器元信息。
- **http-server.ts**：Express集成与路由。
- **SessionData接口**：单个会话的数据结构。
- **@modelcontextprotocol/sdk/server/streamableHttp.js**：底层Transport实现。
- **express**：HTTP服务框架。

> 该图展示了 mcp-node/src 目录下主要 TypeScript 文件的依赖与协作关系，便于理解整体架构和模块职责。
