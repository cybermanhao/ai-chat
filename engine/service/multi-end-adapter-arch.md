# 多端适配事件流架构图（Mermaid）

```mermaid
flowchart TD
    UI["UI层\n(React/Redux/组件/业务)"]
    TaskLoop["TaskLoop层\n(事件流/业务glue)"]
    MessageBridge["MessageBridge层\n(统一协议/多端适配)"]
    Web["Web直连<br/>llmService/mcpClient"]
    Electron["Electron-IPC<br/>(主进程llmService/mcpClient)"]
    SSC["SSC-HTTP<br/>(后端Node llmService/mcpClient)"]

    UI <--> |"emitEvent/dispatch(聊天/推理/管理/工具)"| TaskLoop
    TaskLoop <--> |"事件流/协议消息（add/update/toolcall/toolresult/status/done/error/abort）"| MessageBridge
    UI --> |"连接/断开/管理MCP（通过MessageBridge）"| MessageBridge
    MessageBridge -->|"web环境"| Web
    MessageBridge -->|"electron环境"| Electron
    MessageBridge -->|"ssc环境"| SSC
```

> 说明：
> - MessageBridge 层已合并 Adapter/Glue 层，统一负责多端协议分发和环境适配。
> - UI 层与 TaskLoop 双向事件通信，所有业务事件均可订阅和分发。
> - UI 层连接/断开 MCP 也通过 MessageBridge 统一协议分发。
> - TaskLoop 通过 MessageBridge 统一协议分发，与 MCP 管理和多端环境适配。
> - 事件名、payload 结构全端统一，便于维护和扩展。
