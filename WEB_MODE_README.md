# Web模式开发部署指南

Web模式是本项目的标准前端应用，使用React + Redux + Ant Design构建，支持直接调用LLM API和本地MCP服务。

## 🏗️ 架构特点

- **运行环境**: 浏览器
- **LLM调用**: 直接调用各大模型提供商API（OpenAI、DeepSeek等）
- **MCP服务**: 使用本地MCP客户端连接MCP服务器
- **状态管理**: Redux Toolkit + Redux Persist
- **UI框架**: Ant Design + React 19

## 📋 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- 现代浏览器（支持ES2020）

## 🚀 开发环境启动

### 1. 安装依赖
```bash
# 在项目根目录
pnpm install
```

### 2. 启动开发服务器
```bash
# 启动Web开发服务器（包含头像生成）
pnpm run dev:web

# 或者分步执行
pnpm run generate:avatars  # 生成头像
cd web && pnpm dev        # 启动开发服务器
```

### 3. 访问应用
- 开发服务器: http://localhost:3000
- 热重载: 支持代码修改后自动刷新

### 4. 启动MCP服务（可选）
```bash
# Node.js MCP服务器
pnpm run dev:mcp-node     # http://localhost:3001

# Python MCP服务器  
cd mcp-python/example
python http-server.py    # http://localhost:8000
```

## 🏭 生产环境构建

### 1. 构建应用
```bash
# 完整构建（包含头像生成和类型检查）
pnpm run build:web

# 构建产物位置
web/dist/                 # 静态文件输出目录
```

### 2. 预览构建结果
```bash
cd web
pnpm preview            # 启动预览服务器
```

### 3. 部署到服务器
```bash
# 将 web/dist/ 目录内容部署到静态服务器
# 例如：Nginx、Apache、CDN等

# Nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/web/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## ⚙️ 配置说明

### 开发配置
```typescript
// web/vite.config.ts
export default defineConfig({
  server: {
    port: 3000,           // 开发服务器端口
    host: true,          // 允许外部访问
  },
  // 其他Vite配置...
})
```

### 环境变量
```bash
# web/.env.local （可选）
VITE_API_BASE_URL=https://api.your-domain.com
VITE_MCP_SERVER_URL=ws://localhost:3001
```

### LLM配置
在应用设置页面配置：
- **API密钥**: OpenAI、DeepSeek等模型提供商的API Key
- **模型选择**: 选择要使用的具体模型
- **API地址**: 自定义API Base URL（可选）

### MCP服务器配置
```javascript
// 在应用中连接MCP服务器
const mcpServerUrl = 'http://localhost:3001';  // Node.js MCP服务器
// 或
const mcpServerUrl = 'http://localhost:8000';  // Python MCP服务器
```

## 🧪 测试

### 单元测试
```bash
cd web
pnpm test                # 运行测试
pnpm test:coverage      # 运行测试并生成覆盖率报告
pnpm test:ui            # 启动测试UI界面
```

### E2E测试
```bash
# 启动应用后运行
pnpm run dev:web
# 在另一个终端运行E2E测试
pnpm run test:e2e       # 如果配置了E2E测试
```

## 🔧 开发工具

### 代码检查
```bash
cd web
pnpm lint              # ESLint检查
pnpm typecheck         # TypeScript类型检查
```

### 调试工具
- **Redux DevTools**: 浏览器扩展，用于调试Redux状态
- **React DevTools**: 浏览器扩展，用于调试React组件
- **Vite DevTools**: 内置热重载和错误提示

## 📁 目录结构

```
web/
├── public/           # 静态资源
├── src/
│   ├── components/   # React组件
│   ├── pages/       # 页面组件
│   ├── store/       # Redux状态管理
│   ├── services/    # API服务
│   ├── utils/       # 工具函数
│   └── types/       # TypeScript类型定义
├── dist/            # 构建输出（生成）
└── vite.config.ts   # Vite配置
```

## 🚨 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3000

# 更换端口
pnpm run dev:web --port 3001
```

### 2. API密钥配置错误
- 检查LLM配置页面的API Key设置
- 确认API Base URL是否正确
- 查看浏览器控制台的网络请求错误

### 3. MCP连接失败
- 确认MCP服务器是否已启动
- 检查MCP服务器地址和端口
- 查看浏览器控制台的WebSocket连接状态

### 4. 构建失败
```bash
# 清理缓存重试
rm -rf web/node_modules/.vite
rm -rf web/dist
pnpm run build:web
```

## 📚 相关文档

- [Vite文档](https://vitejs.dev/)
- [React文档](https://react.dev/)
- [Redux Toolkit文档](https://redux-toolkit.js.org/)
- [Ant Design文档](https://ant.design/)
- [TypeScript文档](https://www.typescriptlang.org/)