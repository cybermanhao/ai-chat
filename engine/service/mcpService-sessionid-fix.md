# mcpClient 浏览器 sessionId 自动管理修复方案

## 问题描述
- MCP Python 服务返回 mcp-session-id 响应头，但浏览器不会自动带上。
- 官方 SDK 在 node 环境下可自动管理 session，但浏览器环境下不会自动带上 mcp-session-id。
- 导致前端后续请求丢失会话。

## 修复思路
1. 在 mcpClient 层保存 mcp-session-id（如实例变量或 localStorage）。
2. 在 transport 层或 mcpClient 层拦截每次 HTTP 响应，获取 mcp-session-id 并保存。
3. 在 transport 发起每次请求时，将 mcp-session-id 加入 header。

## 伪代码实现
```typescript
// mcpClient 内部
private sessionId: string | null = null;

// 在连接后，拦截 transport 的 fetch/请求响应
this.transport.onResponse = (resp) => {
  const sid = resp.headers.get('mcp-session-id');
  if (sid) this.sessionId = sid;
};

// 在 transport 发起请求时
const headers = { ...原有headers };
if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
fetch(url, { headers, ... });
```

## 兼容性建议
- 仅在浏览器环境下启用此逻辑。
- 可用 localStorage 持久化 sessionId，防止页面刷新丢失。
- 封装 transport 或 mcpClient 层，保证所有请求都带上 sessionId。

## 备注
- 如 SDK 后续支持自动 sessionId 管理，可移除此补丁。
- 如需自动补丁 mcpClient 代码，可直接参考此方案实现。
