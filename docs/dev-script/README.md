# 开发脚本与工具（dev-script）

本目录用于存放开发相关的脚本、命令行工具、头像生成、自动化运维等说明文档。

## 目录结构
- [头像构建-avatar-build.md](./头像构建-avatar-build.md)：如何批量生成、管理项目头像资源。
- [avatar-build.md](./avatar-build.md)：头像构建脚本英文说明。
- [avatar-README.md](./avatar-README.md)：头像构建与命令行体验补充说明。
- [README-avatar.md](./README-avatar.md)：头像相关文档入口。
- [quickstart-resources/](../示例-examples/quickstart-resources/)：项目快速上手脚本与示例。

## 推荐开发脚本与自动化

### 1. 一键本地开发环境启动
建议在 scripts/ 目录下维护一键启动脚本，如：
- `run-dev.sh` / `run-dev.ps1`：自动安装依赖、启动 web/mcp-node/engine 服务。

### 2. 头像批量生成
- 使用 `scripts/generate-avatars.js`，可自动生成 web/public/avatar/ 下所有头像图片。
- 支持命令：
  ```sh
  node scripts/generate-avatars.js --count 20 --output web/public/avatar/
  ```
- 可集成到 CI/CD 或 prebuild 流程。

### 3. MCP Python 示例运行
- 提供 `scripts/run-mcp-python-examples.sh` 和 `.cmd`，一键运行 mcp-python/example/ 下的所有示例。

### 4. 其它自动化脚本建议
- 自动清理构建产物、同步依赖、批量重命名文档等。
- 建议所有脚本均写明用法、参数说明，并在本目录补充文档。

---
如有更多开发辅助脚本、自动化工具，欢迎补充至本目录并完善说明。
