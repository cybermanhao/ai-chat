# 过期文档清单

以下文档文件已过期或不再适用于当前的SSC架构，建议在适当时候清理：

## 根目录过期文档



### `测试说明.md`
- **原用途**: 服务器测试说明（包含特定IP地址和端口配置）
- **过期原因**: 内容过于具体化，包含硬编码的IP地址，不适用于通用部署
- **替代方案**: `README.md` 中的部署模式说明和 `TEST_SDK.md` 中的测试指南

## docs/ 目录可能过期的文档

### MCP相关过期文档
- `docs/MCP_REFACTORING_GUIDE.md` - MCP重构指南（已完成重构）
- `docs/MCP_REFACTORING_COMPLETE.md` - MCP重构完成记录（历史记录）
- `docs/MCP_REGISTRATION_FIX.md` - MCP注册修复文档（已修复）
- `docs/MCP_SESSION_FIX.md` - MCP会话修复文档（已修复）
- `docs/MCP_TOOL_CREATION_SUMMARY.md` - MCP工具创建总结（过程记录）
- `docs/MCP_TOOL_REGISTRATION_GUIDE.md` - MCP工具注册指南（与SSC架构重复）

### 架构相关过期文档
- `docs/架构设计-architecture/engine-hooks-migration-summary.md` - Engine hooks迁移总结（历史记录）
- `docs/架构设计-architecture/llm-config-refactor-summary.md` - LLM配置重构总结（历史记录）
- `docs/架构设计-architecture/engine迁移说明-engine-migration-guide.md` - Engine迁移说明（已完成迁移）

### 技术文档重复内容
- `docs/依赖与技术-tech/CORS-README.md` - CORS说明（与其他CORS文档重复）
- `docs/依赖与技术-tech/CORS说明-CORS-README.md` - CORS说明重复文档
- `docs/依赖与技术-tech/crm-navigate.md` - CRM导航说明（与根目录重复）
- `docs/依赖与技术-tech/CRM说明-crm-navigate.md` - CRM说明重复文档

### 示例和资源文档
- `docs/示例-examples/quickstart-resources/` - 快速开始资源（MCP官方示例，可能过时）
- `docs/zustand/` - Zustand文档（第三方库文档，应链接到官方文档）

## 建议操作

### 立即可删除
- 历史记录和过程文档（如重构完成记录、迁移总结等）
- 重复的文档文件
- 硬编码配置的测试说明

### 需要整合
- 多个相似主题的文档应合并为单一权威文档
- CORS、CRM等主题的多个文档应整合

### 需要更新
- 将过期的MCP集成文档更新为SSC架构说明
- 将架构文档更新为当前的TaskLoop + MessageBridge + SSC模式

## 当前权威文档

以下文档应作为当前架构的权威参考：

- `README.md` - 项目主文档
- `CLAUDE.md` - 开发指南
- `ssc-server/README.md` - SSC服务器文档
- `TEST_SDK.md` - SDK测试指南
- `架构图.md` - 架构设计说明

---

*本文档生成时间：2025-08-05*
*建议定期更新此清单以保持文档体系的清洁和一致性*