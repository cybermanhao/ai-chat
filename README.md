# ZZ AI Chat

一个现代化的 AI 聊天应用，支持多端部署和SSC（server-side-clientputing）架构，基于TaskLoop引擎和MCP协议，提供灵活的AI对话和工具调用能力。

## 🚀 快速开始

### 环境要求

- Node.js 18+ ([下载](https://nodejs.org/))
- Python 3.10+ ([下载](https://www.python.org/downloads/))
- pnpm 8+ ([安装指南](https://pnpm.io/installation))

### 安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd zz-ai-chat

# 安装所有依赖
pnpm install
```

### Web模式 - 开发环境（推荐开始）

```bash
# 启动Web开发服务器（包含头像生成）
pnpm run dev:web

# 可选：启动MCP Node.js服务器（支持工具调用）
pnpm run start:mcp-node
```

访问 `http://localhost:3000` 开始使用。

### Web模式 - 生产构建

```bash
# 完整构建（包含头像生成和类型检查）
pnpm run build:web

# 预览构建结果
cd web && pnpm preview

# 构建产物位置：web/dist/
```

## 📋 部署模式

本项目支持三种部署模式，每种模式有详细的使用指南：

### 🌐 Web模式
**推荐用于：** 前端开发、浏览器部署
- React + Vite + Ant Design
- 直接调用LLM API
- 本地MCP服务集成

📖 **详细指南：** [WEB_MODE_README.md](./WEB_MODE_README.md)

### 🖥️ Electron模式
**推荐用于：** 桌面应用、离线使用
- 跨平台桌面应用
- 系统托盘、通知等桌面特性
- IPC安全通信

📖 **详细指南：** [ELECTRON_MODE_README.md](./ELECTRON_MODE_README.md)

### 🔧 SSC模式
**推荐用于：** 生产部署、第三方集成
- 后端代理服务 + 前端SDK
- API密钥安全管理
- 第三方开发者友好

📖 **详细指南：** [SSC_MODE_README.md](./SSC_MODE_README.md)

## 🏗️ 架构特点

- **TaskLoop引擎**: 客户端消息流控制和多轮工具调用
- **SSC模式**: 支持服务端计算，客户端SDK通过HTTP/SSE与后端通信
- **MCP协议**: 标准化的工具调用和插件系统
- **多端支持**: Web、Electron、SDK等多种部署方式

## ⚙️ 常用命令

### Web模式开发命令

```bash
# 开发环境
pnpm run dev:web          # 启动Web开发服务器（包含头像生成）
pnpm run start:mcp-node   # 启动MCP Node.js服务器

# 构建和测试
pnpm run build:web        # 构建Web应用（包含类型检查）
cd web && pnpm test       # 运行前端测试
cd web && pnpm lint       # ESLint检查
cd web && pnpm typecheck  # TypeScript类型检查
```

### 其他模式命令

```bash
# SSC模式
pnpm run dev:ssc-server   # 启动SSC服务器开发模式
pnpm run build:ssc-server # 构建SSC服务器
pnpm run start:ssc-server # 启动SSC服务器生产模式

# Electron模式
pnpm run dev:all          # 同时启动Web和Electron
pnpm run build:electron   # 构建Electron应用

# SDK构建
pnpm run build:sdk        # 构建TaskLoop SDK
pnpm run test:mock-ssc    # 测试Mock SSC服务器
```

### 端口说明

- **Web开发服务器**: `http://localhost:3000`
- **MCP Node.js服务器**: `http://localhost:3001`  
- **SSC服务器**: `http://localhost:8080`

## 📚 文档和资源

### 详细开发指南

- 📖 [开发环境配置 (CLAUDE.md)](./CLAUDE.md) - 完整的开发命令和项目结构说明  
- 📖 [项目状态总结 (PROJECT_STATUS.md)](./PROJECT_STATUS.md) - 完整功能模块和技术架构
- 📖 [TaskLoop SDK使用指南 (TEST_SDK.md)](./TEST_SDK.md) - SDK集成和使用示例
- 📖 [MessageBridge架构 (MessageBridge-V2-架构文档.md)](./MessageBridge-V2-架构文档.md) - 核心协议适配层

### 项目架构

- **TaskLoop引擎**: 客户端消息流控制的核心，处理多轮对话和工具调用链
- **MessageBridge**: 跨平台协议适配层，统一Web/Electron/SSC通信接口
- **MCP协议**: 基于Model Context Protocol的标准化工具调用系统

### 技术栈

- **前端**: React 19 + Redux Toolkit + Ant Design + Vite
- **桌面**: Electron + IPC通信
- **后端**: Express + TypeScript + SSE流式响应
- **工具**: MCP协议 + Node.js/Python服务器

## 🚨 常见问题

### Web开发问题

```bash
# 端口被占用
pnpm run dev:web --port 3001

# 构建失败，清理缓存
rm -rf web/node_modules/.vite web/dist
pnpm run build:web
```

### MCP连接问题

- 确认MCP服务器已启动：`pnpm run start:mcp-node`
- 检查浏览器控制台WebSocket连接状态
- 验证MCP服务器地址和端口配置

### 类型错误

```bash
# 运行类型检查
cd web && pnpm typecheck

# 运行代码检查
cd web && pnpm lint
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

Apache License 2.0

