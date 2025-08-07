# TaskLoop SSC-SDK 使用指南

TaskLoop SDK提供了完整的AI聊天解决方案，支持SSC (server-side-clientputing) 模式部署。

## SSC模式架构

```
前端应用                SSC服务器              AI服务
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ TaskLoop SDK │───▶│  LLM代理      │───▶│ OpenAI等     │
│ 事件驱动    │    │  工具代理     │───▶│ MCP工具服务  │
│ 框架无关    │◀───│  HTTP/SSE API │    │ 第三方API   │
└─────────────┘    └──────────────┘    └─────────────┘
```

**核心优势**：
- **安全性**：API密钥存储在服务端
- **可扩展**：支持多种LLM提供商和工具
- **框架无关**：适用于Vue、React、Angular等
- **实时性**：基于SSE的流式响应

## 环境准备

### 1. SSC服务器配置

```bash
# ssc-server/.env
DEEPSEEK_API_KEY=your-api-key
MCP_SERVER_URL=http://localhost:8000/mcp  # 可选
ALLOWED_ORIGINS=http://localhost:3000     # 跨域配置
PORT=8080
```

### 2. 启动服务

```bash
# 启动SSC服务器
pnpm run dev:ssc-server

# 启动MCP工具服务（可选）
cd mcp-python && python server.py
```

## SDK核心API

### 1. 构建和导入

```bash
# 构建SDK
pnpm run build:sdk
```

```javascript
// ES模块导入
import { createTaskLoop } from './lib/index.js'
```

### 2. 创建实例

```javascript
const taskLoop = createTaskLoop({
  chatId: 'unique-chat-id',
  history: [], // 可选：历史消息数组
  config: {
    // 基础配置
    model: 'deepseek-chat',
    temperature: 0.7,
    sscApiBaseUrl: 'http://localhost:8080', // 必需：SSC服务器地址
    
    // 工具配置（可选）
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: '获取天气信息',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string', description: '城市名称' }
            },
            required: ['city']
          }
        }
      }
    ]
  }
})
```

### 3. 事件订阅

TaskLoop采用事件驱动架构，所有交互通过事件处理：

```javascript
const unsubscribe = taskLoop.subscribe((event) => {
  console.log('事件:', event.type, event)
})

// 清理订阅（组件卸载时）
unsubscribe()
```

### 4. 启动对话

```javascript
// 开始对话
await taskLoop.start('用户输入的消息')

// 中断对话
taskLoop.abortTask()
```

## 事件系统详解

TaskLoop通过事件流提供实时的对话状态和内容更新：

### 核心事件类型

| 事件类型 | 触发时机 | 主要用途 |
|---------|---------|----------|
| `add` | 新消息添加 | 显示消息气泡 |
| `update` | 内容流式更新 | 实时显示生成内容 |
| `status` | 状态变化 | 显示处理状态 |
| `toolcall` | 工具调用开始 | 显示工具执行过程 |
| `toolresult` | 工具执行完成 | 显示工具结果 |
| `done` | 对话轮次完成 | 更新最终状态 |
| `error` | 发生错误 | 错误处理和提示 |

### 事件处理示例

```javascript
taskLoop.subscribe((event) => {
  switch (event.type) {
    case 'add':
      // 新消息：用户消息或助手消息占位符
      // event.message: { id, role, content, timestamp }
      addMessageToUI(event.message)
      break
      
    case 'update':
      // 流式更新：仅包含增量内容
      // event.message: { content_delta, reasoning_delta }
      updateLastMessage(event.message.content_delta)
      break
      
    case 'status':
      // 状态变化：connecting → thinking → generating → tool_calling → completed
      // event: { status, cardStatus }
      updateStatus(event.status)
      break
      
    case 'toolcall':
      // 工具调用：显示正在使用的工具
      // event.toolCall: { id, function: { name, arguments } }
      showToolCall(event.toolCall.function.name)
      break
      
    case 'toolresult':
      // 工具结果：显示工具执行结果
      // event: { toolCallId, result, error }
      showToolResult(event.result)
      break
      
    case 'done':
      // 完成：对话轮次结束
      // event: { role, content, tool_calls, id }
      finalizeMessage(event)
      break
      
    case 'error':
      // 错误：显示错误信息
      // event: { error }
      showError(event.error)
      break
  }
})
```

## 动态工具配置

### 1. 从SSC服务器获取工具

```javascript
// 获取可用工具列表
async function loadTools() {
  const response = await fetch('http://localhost:8080/api/mcp/tools')
  const { tools } = await response.json()
  return tools
}

// 转换为OpenAI工具格式
function convertToOpenAITools(mcpTools) {
  return mcpTools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema
    }
  }))
}

// 使用动态工具创建TaskLoop
const tools = await loadTools()
const taskLoop = createTaskLoop({
  config: {
    tools: convertToOpenAITools(tools),
    // ... 其他配置
  }
})
```

### 2. 工具调用流程

```
1. LLM决定调用工具 → toolcall事件
2. SSC服务器执行工具 → 内部处理
3. 返回工具结果 → toolresult事件  
4. LLM处理结果生成回复 → update/done事件
```

## 框架集成示例

### Vue.js 集成

```javascript
// Vue组件
export default {
  data() {
    return {
      messages: [],
      taskLoop: null,
      unsubscribe: null
    }
  },
  
  async mounted() {
    this.taskLoop = createTaskLoop({
      chatId: 'vue-chat',
      config: { sscApiBaseUrl: 'http://localhost:8080' }
    })
    
    this.unsubscribe = this.taskLoop.subscribe(this.handleEvent)
  },
  
  beforeDestroy() {
    this.unsubscribe?.()
  },
  
  methods: {
    handleEvent(event) {
      // 处理事件更新UI
    },
    
    async sendMessage(text) {
      await this.taskLoop.start(text)
    }
  }
}
```

### React集成

```javascript
import { useEffect, useState, useCallback } from 'react'
import { createTaskLoop } from './lib/index.js'

function ChatComponent() {
  const [messages, setMessages] = useState([])
  const [taskLoop, setTaskLoop] = useState(null)
  
  useEffect(() => {
    const instance = createTaskLoop({
      chatId: 'react-chat',
      config: { sscApiBaseUrl: 'http://localhost:8080' }
    })
    
    const unsubscribe = instance.subscribe(handleEvent)
    setTaskLoop(instance)
    
    return () => unsubscribe()
  }, [])
  
  const handleEvent = useCallback((event) => {
    // 处理事件更新状态
  }, [])
  
  const sendMessage = async (text) => {
    await taskLoop?.start(text)
  }
  
  return (
    // JSX组件
  )
}
```

### Vanilla JavaScript集成

```javascript
// 纯JS实现
class ChatApp {
  constructor(containerId) {
    this.container = document.getElementById(containerId)
    this.messages = []
    this.init()
  }
  
  async init() {
    this.taskLoop = createTaskLoop({
      chatId: 'vanilla-chat',
      config: { sscApiBaseUrl: 'http://localhost:8080' }
    })
    
    this.unsubscribe = this.taskLoop.subscribe(this.handleEvent.bind(this))
    this.setupUI()
  }
  
  handleEvent(event) {
    switch (event.type) {
      case 'add':
        this.addMessage(event.message)
        break
      case 'update':
        this.updateLastMessage(event.message.content_delta)
        break
      // ... 其他事件处理
    }
  }
  
  async sendMessage(text) {
    await this.taskLoop.start(text)
  }
  
  destroy() {
    this.unsubscribe?.()
  }
}
```

## 高级配置

### 1. 历史消息恢复

```javascript
const taskLoop = createTaskLoop({
  chatId: 'existing-chat',
  history: [
    { role: 'user', content: '你好', id: 'msg-1' },
    { role: 'assistant', content: '你好！有什么可以帮助你的吗？', id: 'msg-2' }
  ],
  config: { /* ... */ }
})
```

### 2. 多轮对话支持

```javascript
// 第一轮对话
await taskLoop.start('请帮我查询北京天气')

// 第二轮对话（自动包含历史上下文）
await taskLoop.start('那上海呢？')
```

### 3. 自定义配置

```javascript
const taskLoop = createTaskLoop({
  config: {
    model: 'gpt-4',
    temperature: 0.3,
    parallelToolCalls: false, // 禁用并行工具调用
    tools: [], // 禁用工具调用
    // 其他LLM参数...
  }
})
```

## 错误处理

### 1. 网络错误

```javascript
taskLoop.subscribe((event) => {
  if (event.type === 'error') {
    if (event.error.includes('fetch')) {
      // 网络连接问题
      showNetworkError()
    } else if (event.error.includes('CORS')) {
      // 跨域问题
      showCORSError()
    }
  }
})
```

### 2. 服务端错误

```javascript
// 检查SSC服务器状态
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:8080/health')
    return response.ok
  } catch {
    return false
  }
}
```

### 3. 工具调用错误

```javascript
taskLoop.subscribe((event) => {
  if (event.type === 'toolresult' && event.error) {
    console.error('工具调用失败:', event.error)
    // 显示工具执行失败提示
  }
})
```

## 部署建议

### 1. 生产环境配置

```bash
# 生产环境变量
NODE_ENV=production
PORT=8080
DEEPSEEK_API_KEY=prod-key
ALLOWED_ORIGINS=https://your-domain.com
```

### 2. 安全考虑

- API密钥仅存储在SSC服务器
- 使用HTTPS进行生产部署
- 配置正确的CORS策略
- 实现访问频率限制

### 3. 性能优化

- 启用SSE连接池
- 配置适当的超时时间
- 实现消息历史长度限制
- 使用CDN分发SDK文件

## 故障排查

| 问题 | 症状 | 解决方案 |
|-----|-----|---------|
| CORS错误 | 网络请求被阻止 | 配置`ALLOWED_ORIGINS` |
| 工具不执行 | 有工具调用意图但无`toolcall`事件 | 检查MCP服务器连接 |
| 消息不更新 | `update`事件无效果 | 检查事件处理逻辑 |
| 环境检测失败 | 使用Web模式而非SSC | 确保`sscApiBaseUrl`配置 |
| 连接超时 | 长时间无响应 | 检查网络和服务器状态 |

## API参考

### createTaskLoop(options)

```typescript
interface TaskLoopOptions {
  chatId: string
  history?: Message[]
  config: {
    model: string
    temperature?: number
    sscApiBaseUrl: string  // 必需
    tools?: Tool[]
    parallelToolCalls?: boolean
    [key: string]: any
  }
}
```

### 实例方法

- `subscribe(callback)`: 订阅事件，返回取消订阅函数
- `start(message)`: 开始对话
- `abortTask()`: 中断当前对话

### 事件格式

```typescript
type Event = 
  | { type: 'add', message: Message }
  | { type: 'update', message: { content_delta: string } }
  | { type: 'status', status: string, cardStatus: string }
  | { type: 'toolcall', toolCall: ToolCall }
  | { type: 'toolresult', result: string, error?: string }
  | { type: 'done', role: string, content: string }
  | { type: 'error', error: string }
```

通过这个指南，你可以在任何前端框架中集成TaskLoop SDK，构建功能完整的AI聊天应用。