# MCP Server 快速启动指南

## 🚀 启动MCP服务器

### 推荐方式（开发模式）
```bash
npm run dev:mcp-node
```

### 其他启动方式
```bash
# 生产模式
npm run start:mcp-node

# 新的模块化开发模式
npm run dev:mcp-modular
```

## ✅ 验证启动成功

启动后应该看到类似输出：
```
[DEBUG] MCP Server starting...
[MCP Server] 配置加载完成
[MCPService] 正在初始化服务...
[MCPFunctionRegistry] 工具注册完成: test, weather
[MCPFunctionRegistry] 资源注册完成: greeting
[MCPFunctionRegistry] 提示词注册完成: translate
[MCPFunctionRegistry] 所有功能注册完成
MCP Server running on http://127.0.0.1:8000/mcp
```

## 🔧 配置（可选）

如需自定义配置：
```bash
# 复制配置文件
cp mcp-node/.env.example mcp-node/.env

# 编辑配置
# MCP_SESSION_TIMEOUT_MS=1800000      # 会话超时（30分钟）
# MCP_CLEANUP_INTERVAL_MS=300000      # 清理间隔（5分钟）
# MCP_PORT=8000                       # 服务器端口
# MCP_HOST=127.0.0.1                  # 服务器地址
```

## 🧪 测试功能

```bash
# 测试功能注册修复（验证不重复注册）
npm run test:mcp-registration

# 测试清理机制
npm run test:mcp-cleanup

# 测试连接生命周期
npm run test:mcp-lifecycle

# 测试断开连接处理
npm run test:mcp-disconnect
```

## 📝 添加新功能

### 1. 添加新工具
1. 创建 `mcp-node/src/tools/my-tool.ts`
2. 在 `mcp-node/src/tools/index.ts` 中导出
3. 在 `mcp-node/src/registry.ts` 中注册

### 2. 添加新资源
1. 创建 `mcp-node/src/resources/my-resource.ts`
2. 在 `mcp-node/src/resources/index.ts` 中导出
3. 在 `mcp-node/src/registry.ts` 中注册

### 3. 添加新提示词
1. 创建 `mcp-node/src/prompts/my-prompt.ts`
2. 在 `mcp-node/src/prompts/index.ts` 中导出
3. 在 `mcp-node/src/registry.ts` 中注册

## 🆘 故障排除

### 端口被占用
```bash
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 或者修改端口
$env:MCP_PORT=8001
npm run dev:mcp-node
```

### 编译错误
```bash
# 清理构建缓存
rm -rf mcp-node/dist
npm run build:mcp-node
```

### 依赖问题
```bash
# 重新安装依赖
rm -rf node_modules
npm install
```

## 📚 相关文档

- **详细重构说明**: `docs/MCP_REFACTORING_COMPLETE.md`
- **清理机制文档**: `docs/MCP_CLEANUP_IMPLEMENTATION.md`
- **会话管理分析**: `docs/MCP_SESSION_FIX.md`
- **StreamableHTTPServerTransport分析**: `docs/StreamableHTTPServerTransport_Analysis.md`

## 🎯 关键特性

- ✅ **模块化架构**: 功能定义与注册分离
- ✅ **自动清理**: 定时清理不活跃连接
- ✅ **类型安全**: 完整的TypeScript支持
- ✅ **易于扩展**: 简单的功能添加流程
- ✅ **向后兼容**: 保持原有API不变
