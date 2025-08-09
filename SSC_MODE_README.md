# SSC模式开发部署指南

SSC (Server-Side-Client) 模式提供后端代理服务 + 前端SDK的解决方案，适用于需要隐藏API密钥、统一管理LLM和MCP服务的场景。

## 🏗️ 架构特点

- **SSC Server**: Express后端服务，代理LLM和MCP调用
- **TaskLoop SDK**: 前端SDK，通过HTTP/SSE与后端通信
- **第三方应用**: 开发者使用SDK构建自己的前端应用
- **API密钥安全**: 所有密钥存储在后端，前端无法访问

## 📦 组件说明

```
SSC模式架构：
前端应用(Vue/React/Angular) → TaskLoop SDK → SSC Server → LLM/MCP服务
```

## 🚀 SSC Server 开发

### 环境要求
- Node.js >= 18.0.0
- npm/pnpm
- 至少一个LLM API密钥

### 1. 安装和配置
```bash
# 进入SSC服务器目录
cd ssc-server

# 安装依赖
npm install

# 复制环境配置文件
cp .env.example .env

# 编辑环境配置
vim .env
```

### 2. 环境配置
```bash
# ssc-server/.env

# 必需：至少配置一个LLM提供商
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
OPENAI_API_KEY=sk-your-openai-api-key

# 可选配置
DEFAULT_LLM_PROVIDER=deepseek
PORT=8080

# MCP配置（可选）
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_ENABLED=true

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# 日志配置
LOG_LEVEL=info
```

### 3. 启动开发服务器
```bash
# 开发模式（自动重启）
pnpm run dev:ssc-server
# 或
cd ssc-server && npm run dev

# 生产模式
pnpm run start:ssc-server
# 或
cd ssc-server && npm start
```

### 4. 验证服务器
```bash
# 健康检查
curl http://localhost:8080/health

# API端点测试
curl http://localhost:8080/api/llm/models
curl http://localhost:8080/api/mcp/tools
```

## 🏭 SSC Server 生产部署

### 1. 构建服务器
```bash
# 构建TypeScript代码
pnpm run build:ssc-server
# 或
cd ssc-server && npm run build
```

### 2. 生产环境配置
```bash
# 生产环境变量
NODE_ENV=production
PORT=8080

# 数据库（如果使用）
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# 安全配置
JWT_SECRET=your-secret-key
ALLOWED_ORIGINS=https://your-domain.com
```

### 3. 使用PM2部署
```bash
# 安装PM2
npm install -g pm2

# 启动服务
cd ssc-server
pm2 start dist/app.js --name "ssc-server"

# 设置开机自启
pm2 startup
pm2 save
```

### 4. 使用Docker部署
```dockerfile
# ssc-server/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY .env ./

EXPOSE 8080
CMD ["npm", "start"]
```

```bash
# 构建和运行
docker build -t taskloop-ssc-server .
docker run -p 8080:8080 --env-file .env taskloop-ssc-server
```

## 📱 TaskLoop SDK 开发

### 1. 构建SDK
```bash
# 构建SSC模式SDK
pnpm run build:sdk

# SDK输出位置
dist/sdk/                 # 可发布的SDK包
vue2-ssc-demo/src/lib/   # 示例项目使用的副本
```

### 2. 发布SDK
```bash
# 进入SDK目录
cd dist/sdk

# 发布到npm
npm publish

# 或者本地安装测试
npm pack
npm install ./zz-ai-chat-taskloop-sdk-1.0.0.tgz
```

### 3. 测试SDK
```bash
# 启动模拟SSC服务器
pnpm run test:mock-ssc

# 打开SDK测试页面
open test/sdk-test.html
```

## 👨‍💻 第三方开发者使用指南

### 1. 安装SDK
```bash
npm install @zz-ai-chat/taskloop-sdk
# 或
yarn add @zz-ai-chat/taskloop-sdk
```

### 2. 基础使用
```typescript
import { createTaskLoop } from '@zz-ai-chat/taskloop-sdk';

const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  config: {
    model: 'deepseek-chat',
    temperature: 0.7,
    sscApiBaseUrl: 'http://localhost:8080' // SSC服务器地址
  }
});

// 订阅事件
const unsubscribe = taskLoop.subscribe(event => {
  console.log('事件:', event.type, event);
});

// 开始对话
await taskLoop.start('你好！');

// 清理
unsubscribe();
```

### 3. 框架集成示例
```bash
# Vue.js示例
cd vue2-ssc-demo
npm install
npm run dev

# React示例（可参考主项目web目录）
# Angular示例（待补充）
```

## 🧪 开发测试

### 1. 单元测试
```bash
# SSC Server测试
cd ssc-server
npm test

# SDK测试
pnpm run test:sdk
```

### 2. 集成测试
```bash
# 启动完整环境
pnpm run dev:ssc-server    # 终端1: SSC服务器
pnpm run dev:mcp-node      # 终端2: MCP服务器
cd vue2-ssc-demo && npm run dev  # 终端3: 示例应用
```

### 3. API测试
```bash
# 使用curl测试API
curl -X POST http://localhost:8080/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello"}],
    "chatId": "test-123"
  }'

# 使用Postman或其他工具测试
```

## 📁 目录结构

```
ssc-server/
├── src/
│   ├── app.ts           # 主应用入口
│   ├── config/          # 配置管理
│   ├── routes/          # API路由
│   │   ├── llm.ts      # LLM代理路由
│   │   └── mcp.ts      # MCP代理路由
│   └── services/        # 业务服务
│       ├── llmProxy.ts  # LLM代理服务
│       └── mcpProxy.ts  # MCP代理服务
├── dist/                # 构建输出
├── .env                 # 环境配置
└── package.json

dist/sdk/                # TaskLoop SDK
├── index.js             # SDK入口
├── package.json         # SDK包配置
└── README.md            # SDK使用说明
```

## 🔧 高级配置

### 1. 负载均衡
```bash
# 使用PM2集群模式
pm2 start dist/app.js -i max --name "ssc-server-cluster"
```

### 2. 反向代理（Nginx）
```nginx
upstream ssc_backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;  # 多实例
}

server {
    listen 80;
    server_name api.your-domain.com;
    
    location /api/ {
        proxy_pass http://ssc_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. 监控和日志
```bash
# 使用winston日志
npm install winston

# 使用prometheus监控
npm install prom-client
```

## 🚨 常见问题

### 1. CORS错误
- 检查 `ALLOWED_ORIGINS` 环境变量
- 确认前端域名在允许列表中

### 2. API密钥无效
- 验证 `.env` 文件中的API密钥
- 检查对应LLM服务商的配额和限制

### 3. MCP连接失败
- 确认MCP服务器已启动
- 检查 `MCP_SERVER_URL` 配置

### 4. SDK版本不兼容
```bash
# 重新构建SDK
pnpm run build:sdk

# 更新示例项目
cd vue2-ssc-demo
cp -r ../dist/sdk/* src/lib/
```

## 📚 相关文档

- [Express.js文档](https://expressjs.com/)
- [TaskLoop SDK使用指南](../vue2-ssc-demo/TEST_SDK.md)
- [MCP协议文档](https://modelcontextprotocol.io/)
- [SSE (Server-Sent Events)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)