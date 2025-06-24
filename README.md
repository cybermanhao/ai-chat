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

# 安装前端依赖
cd web
pnpm install

# 安装 Python 后端依赖（推荐使用 uv）
cd ../mcp-python
uv venv  # 创建虚拟环境（如未创建）
uv pip install -r requirements.txt

# 安装 Node.js 后端依赖
cd ../mcp-node
pnpm install
```

### 主要开发/构建脚本

```sh
# 启动前端开发服务器（主入口，热更新）
npm run dev:web   # 或 cd web && npm run dev

# 构建前端（生产环境打包）
npm run build:web # 或 cd web && npm run build
```

- 推荐开发时只需关注 `npm run dev:web`（开发） 和 `npm run build:web`（构建）。
- 其它如头像构建（`npm run generate:avatars`）、测试（`npm run test:web`）、引擎构建（`npm run build:engine`）等请见 docs/ 详细说明。
- 你也可以在 web 子目录下直接用 `npm run dev`、`npm run build`、`npm run test` 等。

> 更多命令行脚本和高级用法请见 [docs/avatar-build.md](./docs/avatar-build.md) 及各 package.json 的 scripts 字段。

### 运行 Python/Node 服务

```sh
# 启动 Python 模型服务器（推荐用 uv 运行）
cd mcp-python
uv pip install -r requirements.txt  # 如未安装依赖
uv python main.py

# 启动 Node.js 服务器
cd ../mcp-node
pnpm dev
```

### 其它说明

- 推荐使用 VS Code 编辑器，配合官方 TypeScript/ESLint 插件。
- 如遇依赖或环境问题，请优先检查 Node/Python/pnpm/uv 版本。
- 详细架构、特性、插件开发、贡献指南等请参见 [docs/ 目录文档](./docs/architecture.md)。

---

## 文档索引

- [架构设计与多端说明](./docs/architecture.md)
- [插件开发指南](./docs/plugin-development-guide.md)
- [数据流与存储机制](./docs/chat-flow.md)
- [头像构建与命令行体验](./docs/avatar-build.md)
- [Zustand 状态管理最佳实践](./docs/zustand-advanced-best-practices.md)

如需贡献、了解详细特性、插件系统、跨端支持等，请查阅 docs/ 目录下相关文档。