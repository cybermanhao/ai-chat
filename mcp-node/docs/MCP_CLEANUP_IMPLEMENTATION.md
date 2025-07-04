# MCP Server Session Cleanup Implementation

## 概述

已完成对 MCP Server 的定时清理机制实现，解决了长期运行中可能出现的内存泄漏和会话累积问题。

## 实现特性

### 1. 自动清理机制
- **定时清理**: 每 5 分钟检查一次不活跃的 transport 连接
- **超时设置**: 默认 30 分钟无活动后自动清理会话
- **优雅关闭**: 在移除前尝试正确关闭 transport 连接

### 2. 活动跟踪
- **活动时间**: 记录每个 transport 的最后活动时间
- **自动更新**: 在每次请求处理时自动更新活动时间
- **精确跟踪**: 使用时间戳进行精确的活动时间记录

### 3. 配置管理
- **环境变量**: 支持通过环境变量配置所有超时和间隔设置
- **默认配置**: 提供合理的默认值
- **灵活配置**: 可根据部署环境调整参数

## 配置选项

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `MCP_SESSION_TIMEOUT_MS` | 1800000 (30分钟) | 会话超时时间 |
| `MCP_CLEANUP_INTERVAL_MS` | 300000 (5分钟) | 清理检查间隔 |
| `MCP_STATUS_REPORT_INTERVAL_MS` | 60000 (1分钟) | 状态报告间隔 |
| `MCP_PORT` | 8000 | 服务器端口 |
| `MCP_HOST` | 127.0.0.1 | 服务器地址 |
| `MCP_PATH` | /mcp | MCP 端点路径 |

## 使用方式

### 1. 默认配置运行
```bash
npm start
```

### 2. 环境变量配置
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置
# 设置更短的超时时间用于开发/调试
MCP_SESSION_TIMEOUT_MS=300000  # 5分钟
MCP_CLEANUP_INTERVAL_MS=60000  # 1分钟

# 运行服务器
npm start
```

### 3. PowerShell 临时配置
```powershell
$env:MCP_SESSION_TIMEOUT_MS=300000
$env:MCP_CLEANUP_INTERVAL_MS=60000
npm start
```

## 日志输出

服务器会定期输出以下信息：

### 启动日志
```
[MCP Server] 配置加载完成: {
  sessionTimeoutMinutes: 30,
  cleanupIntervalMinutes: 5,
  statusReportIntervalMinutes: 1,
  endpoint: 'http://127.0.0.1:8000/mcp'
}
```

### 定期状态报告
```
[MCP Server] 活跃transport数量: 3
[MCP Server] 当前活跃sessions:
  - session-1-1703123456789: 2 分钟前活跃
  - session-2-1703123567890: 5 分钟前活跃
  - session-3-1703123678901: 15 分钟前活跃
```

### 清理操作日志
```
[MCP Server] 清理不活跃的transport, session: session-2-1703123567890, 最后活跃时间: 2023-12-21T08:30:00.000Z
[MCP Server] 清理完成: 移除了 1 个不活跃的transport
```

## 技术实现细节

### 1. 数据结构
```typescript
// Transport 实例管理
const transports = new Map<string, any>();

// 活动时间跟踪
const transportLastActivity = new Map<string, number>();
```

### 2. 活动时间更新
- POST 请求处理时更新（新建和重用 transport）
- GET 请求处理时更新（SSE 连接维持）
- 使用 `Date.now()` 记录精确时间戳

### 3. 清理逻辑
```typescript
const cleanupStaleTransports = () => {
  const now = Date.now();
  for (const [sessionId, lastActivity] of transportLastActivity.entries()) {
    if (now - lastActivity > config.sessionTimeoutMs) {
      // 执行清理操作
    }
  }
};
```

### 4. 错误处理
- 安全的 transport 关闭（捕获关闭异常）
- 确保映射表一致性（同时清理两个 Map）
- 详细的错误日志记录

## 监控建议

### 1. 生产环境监控
- 监控活跃 transport 数量趋势
- 关注清理操作的频率和数量
- 观察内存使用情况

### 2. 告警设置
- 活跃 transport 数量异常增长
- 清理操作失败率过高
- 内存使用持续增长

### 3. 日志分析
- 定期分析会话生命周期
- 识别异常断开连接模式
- 优化超时设置

## 性能考虑

### 1. 内存效率
- 及时清理无用对象
- 避免内存泄漏
- 控制并发连接数

### 2. 清理效率
- 合理的检查间隔设置
- 批量清理操作
- 最小化清理开销

### 3. 配置优化
- 根据实际使用模式调整超时时间
- 平衡清理频率和性能开销
- 考虑业务特点设置参数

## 故障排除

### 1. 常见问题
- **Transport 无法正常关闭**: 检查 transport 实现是否支持 `close()` 方法
- **清理不及时**: 调整 `MCP_CLEANUP_INTERVAL_MS` 设置
- **误清理活跃连接**: 检查活动时间更新逻辑

### 2. 调试技巧
- 启用详细日志记录
- 使用较短的超时时间进行测试
- 监控内存使用情况

### 3. 性能调优
- 根据负载调整清理间隔
- 监控清理操作的执行时间
- 优化会话管理策略

## 未来增强

### 可能的改进方向
1. **健康检查**: 添加 transport 连接健康检查
2. **指标收集**: 集成 Prometheus 等监控系统
3. **动态配置**: 支持运行时配置更新
4. **集群支持**: 支持多实例部署的会话管理
5. **优雅关机**: 实现服务器优雅关机时的连接清理
