# ZZ AI Chat

一个现代化的 AI 聊天应用，支持多端部署和SSC（server-side-clientputing）架构，基于TaskLoop引擎和MCP协议，提供灵活的AI对话和工具调用能力。

本项目支持SSC模式客户端SDK，详见下文。

## 架构特点

- **TaskLoop引擎**: 客户端消息流控制和多轮工具调用
- **SSC模式**: 支持服务端计算，客户端SDK通过HTTP/SSE与后端通信
- **MCP协议**: 标准化的工具调用和插件系统
- **多端支持**: Web、Electron、SDK等多种部署方式

## 快速开始

### 环境要求

- Node.js 18+ ([下载](https://nodejs.org/))
- Python 3.10+ ([下载](https://www.python.org/downloads/))
- pnpm 8+ ([安装指南](https://pnpm.io/installation))

请确保以上环境已正确安装。

### 安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd zz-ai-chat

# 安装所有依赖
pnpm install
```

## 部署模式

### 1. Web开发模式

适用于前端开发和调试：

```bash
# 启动Web开发服务器
pnpm run dev:web

# 启动MCP Node.js服务器（可选）
pnpm run start:mcp-node
```

访问 `http://localhost:3000` 开始使用。

### 2. SSC服务端模式

适用于生产环境部署，提供后端API服务：

```bash
# 构建并启动SSC服务器
pnpm run build:ssc-server
pnpm run start:ssc-server
```

SSC服务器提供：
- LLM代理服务 (支持DeepSeek、OpenAI等)
- MCP工具调用代理
- HTTP/SSE流式API

配置环境变量（复制 `ssc-server/.env.example` 到 `ssc-server/.env`）：
```bash
# 必选：至少配置一个LLM提供商
DEEPSEEK_API_KEY=sk-your-key-here
OPENAI_API_KEY=sk-your-key-here

# 可选配置
DEFAULT_LLM_PROVIDER=deepseek
PORT=8080
MCP_SERVER_URL=http://localhost:3001
```

### 3. TaskLoop SDK模式

用于集成到第三方应用：

```bash
# 构建SDK
pnpm run build:sdk

# 测试SDK
pnpm run test:mock-ssc
```

在应用中使用：
```typescript
import { createTaskLoop } from './dist/taskloop-sdk';

const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  config: {
    model: 'deepseek-chat',
    sscApiBaseUrl: 'http://localhost:8080'
  }
});
```

## 开发命令

### 常用开发命令

```bash
# 🚀 开发环境
pnpm run dev:web          # 启动Web前端开发服务器
pnpm run start:mcp-node   # 启动MCP Node.js服务器
pnpm run dev:ssc-server   # 启动SSC服务器开发模式

# 🏗️ 构建
pnpm run build:web        # 构建Web前端
pnpm run build:engine     # 构建TaskLoop引擎
pnpm run build:ssc-server # 构建SSC服务器
pnpm run build:sdk        # 构建TaskLoop SDK

# 🧪 测试
pnpm run test:mock-ssc    # 启动Mock SSC服务器测试
cd web && pnpm test       # 运行前端测试
```

### 端口说明

- **Web开发服务器**: `http://localhost:3000`
- **MCP Node.js 服务器**: `http://localhost:3001`  
- **SSC服务器**: `http://localhost:8080`
- **Mock SSC服务器**: `http://localhost:8080`

## 架构详解

### TaskLoop引擎

TaskLoop是客户端消息流控制的核心引擎，负责：

- **多轮对话管理**: 自动处理用户输入、LLM响应和工具调用的完整流程
- **工具链调度**: 自动检测和执行LLM请求的工具调用，支持多工具链式调用
- **流式处理**: 支持Server-Sent Events (SSE)的实时流式响应
- **跨平台适配**: 通过MessageBridge抽象层适配Web、Electron、SSC等不同环境

### SSC架构

SSC (server-side-clientputing) 模式将AI计算能力部署到服务端：

```
客户端SDK --HTTP/SSE--> SSC服务器 --API--> LLM提供商
                            |
                            +--HTTP--> MCP服务器
```

**优势**:
- 集中化AI能力管理
- 简化客户端部署
- 支持.env配置管理
- 统一的API访问控制

### MCP协议集成

基于Model Context Protocol标准：

- **标准化工具接口**: 统一的工具注册和调用规范
- **插件化架构**: 支持动态加载各种工具和服务
- **会话管理**: 自动处理连接生命周期和错误恢复

## 文档索引

- [SSC服务器文档](./ssc-server/README.md) - SSC服务器部署和配置
- [TaskLoop SDK测试指南](./TEST_SDK.md) - SDK使用和测试
- [项目架构说明](./架构图.md) - 详细架构设计
- [开发指南](./CLAUDE.md) - 开发环境和命令说明

## 快速开始示例

### 启动Web开发环境

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器  
pnpm run dev:web

# 3. （可选）启动MCP服务器
pnpm run start:mcp-node
```

访问 `http://localhost:3000` 开始聊天。

### 部署SSC生产服务

```bash
# 1. 配置环境变量
cp ssc-server/.env.example ssc-server/.env
# 编辑 ssc-server/.env 添加API密钥

# 2. 构建并启动
pnpm run build:ssc-server
pnpm run start:ssc-server
```

### 使用TaskLoop SDK

```bash
# 1. 构建SDK  
pnpm run build:sdk

# 2. 在项目中集成
npm install ./dist/taskloop-sdk.tgz
```

```typescript
import { createTaskLoop } from 'taskloop-sdk';

const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  config: {
    model: 'deepseek-chat',
    sscApiBaseUrl: 'http://your-ssc-server:8080'
  }
});

taskLoop.subscribe(event => {
  console.log('收到事件:', event);
});

taskLoop.start('你好！');
```

## 技术栈

- **前端**: React 19 + TypeScript + Ant Design + Zustand
- **引擎**: TaskLoop (TypeScript) + MessageBridge抽象层
- **后端**: Express + Node.js (SSC服务器)
- **协议**: MCP (Model Context Protocol) + HTTP/SSE
- **构建**: Vite + pnpm workspaces + TypeScript项目引用

## 许可证

Apache License 2.0

## 致谢

本项目的核心架构设计借鉴了多个优秀开源项目的理念，特别感谢相关开源作者在技术和精神上的支持与启发。

# TaskLoop SSC 模式客户端 SDK 使用说明

## 简介

TaskLoop SDK（SSC模式）是专为 server-side-clientputing 场景设计的 LLM 聊天/任务流客户端开发包。无需 API Key，所有模型推理和工具调用均由后端 SSC 服务统一管理，前端只需专注于业务集成和事件处理。

---

## 安装

```bash
npm install @zz-ai-chat/taskloop-sdk
```

---

## 快速开始

### 1. 引入 SDK

```typescript
import { createTaskLoop } from '@zz-ai-chat/taskloop-sdk';
```

### 2. 创建 TaskLoop 实例

```typescript
const taskLoop = createTaskLoop({
  chatId: 'my-chat-id', // 当前会话唯一标识
  config: {
    model: 'deepseek-chat', // 指定后端支持的模型名
    sscApiBaseUrl: 'http://localhost:8080' // SSC后端API地址，默认可省略
    // 其他可选参数见下方“配置说明”
  }
});
```

### 3. 订阅事件

```typescript
taskLoop.subscribe(event => {
  console.log('收到事件:', event);
  // 你可以根据 event.type 处理不同的消息/状态
});
```

### 4. 发送消息

```typescript
taskLoop.start('你好，TaskLoop！');
```

---

## 配置说明

`createTaskLoop` 支持如下配置项：

| 配置项             | 类型         | 说明                                   |
|--------------------|--------------|----------------------------------------|
| model              | string       | 必填，后端支持的模型名称               |
| temperature        | number       | 可选，采样温度                         |
| maxTokens          | number       | 可选，最大生成token数                  |
| tools              | any[]        | 可选，工具插件列表                     |
| parallelToolCalls  | boolean      | 可选，是否并行工具调用                 |
| sscApiBaseUrl      | string       | 可选，SSC后端API地址，默认本地8080端口 |

---

## 事件类型说明

通过 `taskLoop.subscribe` 订阅的事件对象结构如下：

```typescript
interface TaskLoopEvent {
  type: string; // 事件类型
  data: any;    // 事件数据
  [key: string]: any;
}
```

常见事件类型及说明：

| 事件类型      | 说明                                                         | data结构示例 |
|---------------|--------------------------------------------------------------|--------------|
| message       | 收到模型/助手回复消息，或流式分片                             | { role, content, ... } |
| status        | 流程状态变更，如开始、结束、等待工具调用等                    | { status, detail } |
| error         | 发生错误，包含错误信息                                         | { message, code } |
| tool_call     | 工具调用请求下发（如需要前端配合工具执行）                    | { toolName, params } |
| tool_result   | 工具调用结果返回                                              | { toolName, result } |
| progress      | 进度更新（如流式生成、token计数等）                            | { progress, tokens } |
| history       | 历史消息同步/回显                                             | { history: Message[] } |
| done          | 本轮对话/任务流已完成                                         | { finishReason } |

> 你可以根据实际业务只关注关心的事件类型。

---

## 进阶用法

### 1. 自定义历史记录

```typescript
const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  history: [
    { role: 'user', content: '你好' },
    { role: 'assistant', content: '你好，有什么可以帮您？' }
  ],
  config: { model: 'deepseek-chat' }
});
```

### 2. 工具调用与插件

如需集成自定义工具，请参考后端 SSC 服务的工具注册规范，前端只需在 config.tools 中声明即可。

---

## 常见问题

1. **是否需要 API Key？**  
   不需要，SSC模式下所有鉴权和模型调用均由后端统一管理。

2. **如何切换模型？**  
   只需在 config.model 指定后端支持的模型名称。

3. **如何处理多会话？**  
   每个 chatId 唯一对应一个会话，建议用用户ID+业务ID拼接。

4. **如何监听流式消息？**  
   通过 subscribe 订阅事件，event.type === 'message' 时即为新消息。

---

## 版本信息

- SDK版本: 1.0.0
- 构建模式: SSC
- 构建时间: 2024-06-09T00:00:00.000Z（以实际构建时间为准）

---

如需更多帮助，请查阅[项目主页](https://github.com/your-org/zz-ai-chat)或提交[Issue](https://github.com/your-org/zz-ai-chat/issues)。
