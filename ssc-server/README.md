# TaskLoop SSC Server

TaskLoop的服务端代理，为客户端SDK提供LLM和MCP服务。

## 快速开始

### 1. 安装依赖

```bash
cd ssc-server
npm install
```

### 2. 配置环境变量

复制配置文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置至少一个LLM提供商的API Key：

```bash
# 必选：至少配置一个LLM提供商
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here

# 可选：其他配置
DEFAULT_LLM_PROVIDER=deepseek
PORT=8080
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. 启动服务器

开发模式：
```bash
npm run dev
```

生产模式：
```bash
npm run build
npm start
```

或从项目根目录：
```bash
# 开发模式
pnpm run dev:ssc-server

# 生产构建
pnpm run build:ssc-server
pnpm run start:ssc-server
```

## API 接口

### LLM 接口

#### POST /api/llm/chat
流式聊天接口，返回 Server-Sent Events (SSE)

**请求体:**
```json
{
  "chatId": "chat-123",
  "messages": [
    {"role": "user", "content": "你好"}
  ],
  "model": "deepseek-chat",
  "temperature": 0.7,
  "tools": [...],
  "parallelToolCalls": true
}
```

**响应格式 (SSE):**
```
data: {"type": "status", "status": "connecting"}
data: {"type": "chunk", "role": "assistant", "content": "你好", "phase": "generating"}
data: {"type": "toolcall", "toolCall": {...}}
data: {"type": "done", "role": "assistant", "content": "你好！有什么可以帮助你的吗？"}
data: [DONE]
```

#### POST /api/llm/abort
中断LLM请求

#### GET /api/llm/models
获取可用模型列表

### MCP 接口

#### POST /api/mcp/call-tool
调用MCP工具

**请求体:**
```json
{
  "serverId": "default",
  "toolName": "query_url", 
  "args": {"natural_language_input": "客户列表"},
  "callId": "call-123"
}
```

#### GET /api/mcp/tools
获取可用工具列表

#### GET /api/mcp/health
MCP服务器健康检查

### 系统接口

#### GET /health
系统健康检查

#### GET /info
获取系统信息和API文档

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 8080 | ❌ |
| `NODE_ENV` | 运行环境 | development | ❌ |
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | - | ✅* |
| `OPENAI_API_KEY` | OpenAI API密钥 | - | ✅* |
| `QWEN_API_KEY` | Qwen API密钥 | - | ✅* |
| `CLAUDE_API_KEY` | Claude API密钥 | - | ✅* |
| `DEFAULT_LLM_PROVIDER` | 默认LLM提供商 | deepseek | ❌ |
| `MCP_SERVER_URL` | MCP服务器地址 | http://localhost:3001 | ❌ |
| `MCP_SERVER_ENABLED` | 启用MCP服务 | true | ❌ |
| `ALLOWED_ORIGINS` | 允许的CORS来源 | http://localhost:3000 | ❌ |
| `MAX_TOKENS` | 最大token数 | 4000 | ❌ |
| `REQUEST_TIMEOUT` | 请求超时(ms) | 30000 | ❌ |

> *：至少需要配置一个LLM提供商的API Key

## 客户端集成

配合 TaskLoop SDK 使用：

```typescript
import { createTaskLoop } from '@your-org/taskloop-sdk';

const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  config: {
    model: 'deepseek-chat',
    temperature: 0.7,
    sscApiBaseUrl: 'http://localhost:8080', // SSC服务器地址
  }
});

taskLoop.subscribe(event => {
  console.log('事件:', event);
});

taskLoop.start('你好，请帮我查询客户列表');
```

## 部署

### Docker 部署

创建 `Dockerfile`：
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 8080

CMD ["npm", "start"]
```

构建和运行：
```bash
docker build -t taskloop-ssc-server .
docker run -p 8080:8080 --env-file .env taskloop-ssc-server
```

### PM2 部署

```bash
npm install -g pm2
pm2 start dist/app.js --name ssc-server
pm2 save
pm2 startup
```

## 监控和日志

### 健康检查
```bash
curl http://localhost:8080/health
```

### 获取系统信息
```bash
curl http://localhost:8080/info
```

### 查看日志
```bash
# 开发模式
npm run dev

# PM2日志
pm2 logs ssc-server
```

## 故障排除

### 常见问题

1. **没有可用的LLM提供商**
   ```
   错误: 没有配置可用的LLM提供商!
   ```
   **解决**: 在 `.env` 文件中配置至少一个API Key

2. **MCP服务器连接失败**
   ```
   MCP服务器响应错误: 500
   ```
   **解决**: 检查MCP服务器是否启动，确认 `MCP_SERVER_URL` 配置正确

3. **CORS错误**
   ```
   Access to fetch blocked by CORS policy
   ```
   **解决**: 在 `ALLOWED_ORIGINS` 中添加客户端地址

4. **端口占用**
   ```
   Error: listen EADDRINUSE: address already in use :::8080
   ```
   **解决**: 修改 `PORT` 环境变量或停止占用端口的进程

### 调试技巧

1. 启用详细日志：
   ```bash
   LOG_LEVEL=debug npm run dev
   ```

2. 检查配置：
   ```bash
   curl http://localhost:8080/info
   ```

3. 测试LLM连接：
   ```bash
   curl http://localhost:8080/api/llm/models
   ```

4. 测试MCP连接：
   ```bash
   curl http://localhost:8080/api/mcp/health
   ```