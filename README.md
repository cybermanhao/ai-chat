# ZZ AI Chat

一个现代化的 AI 聊天应用，支持多端、模块化和可扩展，助你探索下一代智能交互体验。

## 快速开始

### 环境要求

- Node.js 18+ ([下载](https://nodejs.org/))
- Python 3.10+ ([下载](https://www.python.org/downloads/))
- pnpm 8+ ([安装指南](https://pnpm.io/installation))
- [uv](https://github.com/astral-sh/uv) (推荐用于 Python 依赖和虚拟环境管理)

请确保以上环境已正确安装。

### 安装依赖

```sh
# 克隆项目
git clone https://github.com/yourusername/zz-ai-chat.git
cd zz-ai-chat

# 安装根目录依赖（包含所有子项目）
pnpm install

# 或者分别安装各子项目依赖
# 安装前端依赖
cd web && pnpm install

# 安装 MCP Node.js 服务依赖
cd ../mcp-node && pnpm install

# 安装 Python 后端依赖（推荐使用 uv）
cd ../mcp-python
uv venv  # 创建虚拟环境（如未创建）
uv pip install -r requirements.txt
```

### 一键启动开发服务器

为了方便开发，我们提供了一键启动脚本：

**Windows 用户:**
```powershell
# 启动 MCP 服务器和 Web 开发服务器（推荐）
.\scripts\web-dev.ps1

# 测试 Windows Terminal 功能
.\scripts\wt.ps1
```

**Linux/macOS 用户:**
```bash
# 启动 MCP 服务器和 Web 开发服务器（图形终端）
./scripts/web-dev.sh

# 启动服务器（后台运行，适合服务器环境）
./scripts/web-dev-simple.sh

# 停止后台服务
./scripts/stop-dev.sh
```

### 主要开发/构建脚本

```sh
# 🚀 开发环境启动
npm run dev:web          # 启动前端开发服务器（主入口，热更新）
npm run start:mcp-node   # 启动 MCP Node.js 服务器
npm run start:mcp-python # 启动 MCP Python 服务器

# 🏗️ 构建相关
npm run build:web        # 构建前端（生产环境打包）
npm run build:engine     # 构建引擎模块
npm run build:mcp-node   # 构建 MCP Node.js 服务

# 🎨 辅助工具
npm run generate:avatars # 生成头像资源
npm run test:web         # 运行前端测试
npm run test:mcp-*       # 运行 MCP 相关测试
```

- 推荐开发时使用一键启动脚本 `web-dev.ps1`（Windows）或 `web-dev.sh`（Linux/macOS）。
- 单独启动可使用 `npm run dev:web`（前端开发） 和 `npm run start:mcp-node`（MCP 服务器）。
- 生产构建使用 `npm run build:web`（前端构建） 和 `npm run build:mcp-node`（MCP 服务构建）。
- 其它如头像构建（`npm run generate:avatars`）、测试（`npm run test:web`）、引擎构建（`npm run build:engine`）等请见 docs/ 详细说明。

> 更多命令行脚本和高级用法请见 [docs/](./docs/) 目录及各 package.json 的 scripts 字段。

### 运行服务器

**推荐方式 - 使用一键启动脚本:**
```bash
# Windows
.\scripts\web-dev.ps1

# Linux/macOS
./scripts/web-dev.sh
```

**手动启动各服务:**
```sh
# 启动 MCP Node.js 服务器
npm run start:mcp-node  # 或 cd mcp-node && pnpm dev

# 启动 MCP Python 服务器（推荐用 uv 运行）
cd mcp-python
uv pip install -r requirements.txt  # 如未安装依赖
uv python main.py

# 启动前端开发服务器
npm run dev:web  # 或 cd web && npm run dev
```

### 其它说明

- 推荐使用 VS Code 编辑器，配合官方 TypeScript/ESLint 插件。
- 如遇依赖或环境问题，请优先检查 Node/Python/pnpm/uv 版本。
- 开发时建议使用提供的一键启动脚本，自动管理服务器生命周期。
- 详细架构、特性、插件开发、贡献指南等请参见 [docs/ 目录文档](./docs/)。

### 端口说明

- **前端开发服务器**: `http://localhost:3000`
- **MCP Node.js 服务器**: `http://localhost:3001`
- **MCP Python 服务器**: `http://localhost:8000`（如果启用）

---

## 文档索引

- [架构设计与多端说明](./docs/architecture.md)
- [MCP 集成指南](./docs/MCP_INTEGRATION_GUIDE.md)
- [MCP 自动重连实现](./docs/MCP_AUTO_RECONNECT_IMPLEMENTATION.md)
- [MCP 调试面板集成](./docs/MCP_DEBUG_PANEL_INTEGRATION.md)
- [插件开发指南](./docs/plugin-development-guide.md)
- [数据流与存储机制](./docs/chat-flow.md)
- [头像构建与命令行体验](./docs/avatar-build.md)

如需贡献、了解详细特性、插件系统、跨端支持等，请查阅 docs/ 目录下相关文档。

---

## MCP 服务器会话管理和自动重连功能

MCP (Model Context Protocol) 服务器现在包含完整的会话管理、自动重连和清理功能。

### 主要特性

- **自动重连**: 应用启动时自动重连上次已连接的 MCP 服务器
- **会话隔离**: 每个客户端获得独立的会话和 transport 实例
- **自动清理**: 定期清理不活跃的连接，防止内存泄漏
- **消息提示**: 统一的 MCP 操作消息提示服务
- **调试面板**: 集成 MCP 测试功能到左侧调试面板
- **可配置超时**: 通过环境变量配置会话超时和清理间隔
- **详细日志**: 完整的连接生命周期日志记录

### 配置选项

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `MCP_SESSION_TIMEOUT_MS` | 1800000 (30分钟) | 会话超时时间 |
| `MCP_CLEANUP_INTERVAL_MS` | 300000 (5分钟) | 清理检查间隔 |
| `MCP_STATUS_REPORT_INTERVAL_MS` | 60000 (1分钟) | 状态报告间隔 |

### 测试脚本

```bash
# 运行自动重连测试
npm run test:mcp-reconnect

# 运行消息提示测试
npm run test:mcp-notification

# 运行清理功能测试
npm run test:mcp-cleanup

# 运行完整生命周期测试
npm run test:mcp-lifecycle

# 运行断连重连测试  
npm run test:mcp-disconnect
```

### PowerShell 测试

```powershell
# 运行清理功能测试
.\test\run-cleanup-test.ps1

# 运行新工具测试
.\test\run-new-tools-test.ps1
```

### 相关文档

- [MCP 集成指南](docs/MCP_INTEGRATION_GUIDE.md)
- [MCP 自动重连实现](docs/MCP_AUTO_RECONNECT_IMPLEMENTATION.md)
- [MCP 调试面板集成](docs/MCP_DEBUG_PANEL_INTEGRATION.md)
- [MCP 会话修复文档](docs/MCP_SESSION_FIX.md)
- [StreamableHTTPServerTransport 分析](docs/StreamableHTTPServerTransport_Analysis.md)
- [清理功能实现文档](docs/MCP_CLEANUP_IMPLEMENTATION.md)

---

## 致谢

本项目的核心机制在架构设计和实现思路上，借鉴了 [openmcp](https://github.com/openmcp) 项目的诸多优秀理念（如事件驱动机制）。特别感谢 [锦恢](https://github.com/LSTM-Kirigaya) 和 [太平羊羊](https://github.com/li1553770945) 两位开源作者，不仅在技术上给予了我指导，也在精神上给予了我极大的鼓励。

>nn 本项目遵循 Apache License 2.0 开源协议，相关代码修改已在本仓库中标注。