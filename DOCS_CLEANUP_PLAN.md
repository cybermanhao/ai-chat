# 文档清理计划

## 🗑️ 建议删除的过期文档

### 临时开发文档
- `MessageBridge-V2-TODO.md` - 已完成
- `deprecated-docs.md` - 已标记过期
- `mcp-node-python-bridge-demo.md` - 演示文档
- `mcp-node-python-bridge-requirements.md` - 需求文档

### AI开发历史文档 (aidocs/)
```
aidocs/000001_redux-multi-platform-best-practice.md
aidocs/000002_web-chat-call-path-analysis.md  
aidocs/000003_web_hooks_redux_migration.md
aidocs/000004_engine_hooks_refactor.md
aidocs/000005_插件系统禁用说明.md
aidocs/000006_插件系统禁用总结.md
aidocs/000008_llmclient-stream-glue-memory.md
```
建议：整个`aidocs/`目录可删除

### 重复的MCP文档 (docs/)
```
docs/MCP_AUTO_RECONNECT_IMPLEMENTATION.md
docs/MCP_DEBUG_PANEL_INTEGRATION.md
docs/MCP_INTEGRATION_GUIDE.md
docs/MCP_QUICK_START.md
docs/MCP_REFACTORING_COMPLETE.md
docs/MCP_REFACTORING_GUIDE.md
docs/MCP_REGISTRATION_FIX.md
docs/MCP_SESSION_FIX.md
docs/MCP_TOOL_CREATION_GUIDE.md
docs/MCP_TOOL_CREATION_SUMMARY.md
docs/MCP_TOOL_REGISTRATION_GUIDE.md
docs/TOOL_MANAGER_MODAL_UPGRADE.md
```
建议：保留一个综合的MCP文档，删除其他重复文档

### 过期示例和测试文件
```
examples/bundler-examples/
examples/openai-node/ (第三方库完整复制)
electron/main-test.js
electron/test-messagebridge.js
web/src/test-messagebridge.js
web/src/test-real-llm.html
```

## 📄 需要整合的文档

### 模式特定文档
将以下文档整合到统一的部署指南：
- `WEB_MODE_README.md`
- `SSC_MODE_README.md`  
- `ELECTRON_MODE_README.md`

### 架构文档重复内容
整合`docs/架构设计-architecture/`下的重复内容

### 示例文档
整合`docs/示例-examples/`下的有效示例

## ✅ 建议保留的核心文档

### 项目根文档
- `README.md` - 项目主文档
- `CLAUDE.md` - Claude Code指令
- `PROJECT_STATUS.md` - 项目状态总结（新建）

### 核心技术文档  
- `MessageBridge-V2-架构文档.md` - 核心架构
- `SSC-SDK调用说明.md` - SDK使用
- `docs/API集成-api-integrations/` - API文档
- `docs/依赖与技术-tech/` - 技术说明

### 开发文档
- 各模块的package.json和tsconfig.json
- 核心代码中的注释文档

## 🔄 文档重构建议

### 1. 创建统一的部署指南
将三个模式的README合并为：`DEPLOYMENT_GUIDE.md`

### 2. 精简MCP文档
创建：`MCP_INTEGRATION_COMPLETE.md` 替代所有MCP相关文档

### 3. 整理示例代码
创建：`examples/README.md` 说明有效示例，删除过期示例

### 4. 统一架构文档
整合架构文档到：`ARCHITECTURE.md`

## 📋 执行计划

1. **备份重要内容**：提取有价值的信息到新文档
2. **删除过期文档**：移除临时和重复文档  
3. **创建新文档**：按上述建议创建整合文档
4. **更新索引**：更新主README的文档索引

完成后，项目文档将更加清晰和易于维护。