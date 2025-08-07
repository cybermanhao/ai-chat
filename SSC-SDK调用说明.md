# TaskLoop SSC模式SDK事件注册与流转机制说明

## 什么是SSC模式？

SSC（Server-Side Client）模式：前端不直接访问LLM API，通过SSC后端统一转发LLM和MCP请求，对客户端隐藏所有AI接口。

- **ssc-sdk**：前端SDK，提供标准化通信和事件流转，所有LLM/MCP请求由server-side-client转发
- **ssc-server**：后端服务，负责LLM推理、工具执行、会话管理等

---

本说明文档面向SSC模式SDK客户端开发者，梳理SDK事件注册、事件类型、流转流程及与Redux等状态管理的集成建议。

---

## 1. 事件注册方式

SDK核心事件通过 `TaskLoop.subscribe` 注册，支持多订阅者，事件为流式推送。推荐每个会话(chatId)注册独立监听。

```typescript
const taskLoop = createTaskLoop({ ... });
const unsubscribe = taskLoop.subscribe(event => {
  switch(event.type) {
    case 'add':
      // 新增消息
      break;
    case 'update':
      // 增量内容
      break;
    case 'toolcall':
      // 工具调用
      break;
    case 'toolresult':
      // 工具结果
      break;
    case 'done':
    case 'error':
      // 结束或错误，自动注销
      unsubscribe();
      break;
    // ...
  }
});
// 需要时可调用 unsubscribe() 取消监听
```

---

## 2. 事件类型与结构

### 核心类型定义

```typescript
// 事件类型定义
export type TaskLoopEvent =
  | { type: 'add'; message: EnrichedMessage; cardStatus?: IMessageCardStatus }
  | { type: 'update'; message: IncrementalMessage; cardStatus?: IMessageCardStatus }
  | { type: 'toolcall'; toolCall: ToolCall; cardStatus?: IMessageCardStatus }
  | { type: 'toolresult'; toolCallId: string; result: string; error?: string; cardStatus?: IMessageCardStatus }
  | { type: 'status'; taskId: string; status: string; cardStatus?: IMessageCardStatus }
  | { type: 'error'; taskId: string; error: string; cardStatus?: IMessageCardStatus }
  | { type: 'done'; taskId: string; result: any; cardStatus?: IMessageCardStatus };

// 增量消息更新类型
export interface IncrementalMessage {
  role?: string;
  content?: string;
  reasoning_content?: string;
  tool_calls?: any[];
  content_delta?: string;
  reasoning_delta?: string;
}

// 消息类型
export interface EnrichedMessage extends ChatMessage {
  id: string;
  timestamp: number;
  state?: MessageState;
  name?: string;
  usage?: any;
}

export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage | ClientNoticeMessage;
```

### 事件对象结构

事件对象结构如下：

```typescript
interface TaskLoopEvent {
  type: string; // 事件类型
  data?: any;
  message?: any;
  cardStatus?: string;
  toolCall?: any;
  toolCallId?: string;
  result?: any;
  error?: any;
  [key: string]: any;
}
```

常见事件类型：

| 事件类型    | 说明                       | 典型字段                |
|-------------|----------------------------|-------------------------|
| add         | 新增消息（助手/模型回复）   | message, cardStatus     |
| update      | 消息增量更新（流式内容）    | message                 |
| status      | 状态变更                   | cardStatus              |
| toolcall    | 工具调用请求下发           | toolCall                |
| toolresult  | 工具调用结果返回           | toolCallId, result, error |
| done        | 本轮对话/任务流已完成       |                         |
| error       | 发生错误                   | error                   |

---

## 3. 典型事件流转流程

以一次完整对话为例：

1. 用户调用 `taskLoop.start('你好')` 发送消息。
2. SDK 触发 `add` 事件，推送助手回复（可多次，流式）。
3. 若涉及工具调用，触发 `toolcall` 事件，前端可据此执行工具。
4. 工具执行完毕后，前端通过SDK接口回传结果，SDK触发 `toolresult` 事件。
5. 回复流式结束，触发 `done` 事件。
6. 若出错，随时可能触发 `error` 事件。

---

## 4. 事件与Redux集成建议

- 推荐在Redux中为每个chatId维护消息、状态、工具调用等子树。
- 在中间件（如streamManagerMiddleware）中注册TaskLoop事件监听，将事件分发为Redux action。
- 典型映射关系：
  - `add` → addMessage
  - `update` → patchLastAssistantMessage
  - `status` → setMessageCardStatus
  - `toolcall` → setToolCallState
  - `toolresult` → updateToolCallState
  - `done` → setIsGenerating(false)、setMessageCardStatus('stable')
  - `error` → setError
- 事件监听需在会话开始时注册，done/error后可自动注销。

---

## 5. 事件处理最佳实践

- 只处理关心的事件类型，避免全量分支判断。
- 工具调用事件需结合业务安全校验。
- 增量内容需与现有消息内容拼接。
- 及时清理无用的TaskLoop实例和事件监听，防止内存泄漏。

---

## 8. mcp连接：直接使用 messageBridge

SDK 默认导出 messageBridge 实例，适合需要自定义 MCP 服务连接、断开、事件监听等高级场景。

```typescript
import { messageBridge } from '@zz-ai-chat/taskloop-sdk';

// 连接 MCP 服务
messageBridge.connectMCP(serverId, url);
messageBridge.on('done', payload => {
  // 连接成功回调
});
messageBridge.on('error', payload => {
  // 连接失败回调
});

// 断开 MCP 服务
messageBridge.disconnectMCP(serverId);
```

> 说明：
> messageBridge 主要用于 TaskLoop 事件的统一处理。理论上，MCP 服务器的 connect/disconnect 操作并不属于 TaskLoop 的事件范畴，但为了统一前端的事件处理机制，也将其集成在 messageBridge 中，便于开发者通过同一接口管理所有相关事件。

---

如需更详细的事件字段说明或集成范例，请结合实际SDK类型定义和业务需求补充。 

---

## 7. 完整使用示例

### 基础用法

```typescript
import { createTaskLoop, type TaskLoopEvent, type EnrichedMessage } from '@zz-ai-chat/taskloop-sdk';

// 创建TaskLoop实例
const taskLoop = createTaskLoop({
  chatId: 'my-chat-id',
  config: {
    model: 'deepseek-chat',
    temperature: 0.7,
    sscApiBaseUrl: 'http://localhost:8080'
  },
  history: [
    {
      id: 'msg-1',
      role: 'user',
      content: '你好',
      timestamp: Date.now()
    }
  ]
});

// 注册事件监听
const unsubscribe = taskLoop.subscribe((event: TaskLoopEvent) => {
  switch(event.type) {
    case 'add':
      console.log('新增消息:', event.message);
      break;
    case 'update':
      console.log('增量更新:', event.message);
      break;
    case 'toolcall':
      console.log('工具调用:', event.toolCall);
      break;
    case 'toolresult':
      console.log('工具结果:', event.result);
      break;
    case 'done':
      console.log('对话完成');
      unsubscribe();
      break;
    case 'error':
      console.error('发生错误:', event.error);
      unsubscribe();
      break;
  }
});

// 发送消息
await taskLoop.start('请帮我分析一下这个数据');
```

### 高级用法：类型安全的事件处理

```typescript
import { 
  createTaskLoop, 
  type TaskLoopEvent, 
  type EnrichedMessage,
  type IncrementalMessage 
} from '@zz-ai-chat/taskloop-sdk';

const taskLoop = createTaskLoop({
  chatId: 'advanced-chat',
  config: { model: 'deepseek-chat' }
});

taskLoop.subscribe((event: TaskLoopEvent) => {
  // 类型安全的事件处理
  if (event.type === 'add') {
    const message: EnrichedMessage = event.message;
    console.log(`新增${message.role}消息:`, message.content);
  } else if (event.type === 'update') {
    const update: IncrementalMessage = event.message;
    if (update.content_delta) {
      console.log('内容增量:', update.content_delta);
    }
  }
});
```

### 与Redux集成示例

```typescript
// Redux中间件中的事件处理
const taskLoopMiddleware = (storeAPI: any) => next => async action => {
  if (sendMessage.match(action)) {
    const { chatId, input } = action.payload;
    const taskLoop = createTaskLoop({ chatId, config: { model: 'deepseek-chat' } });
    
    taskLoop.subscribe((event: TaskLoopEvent) => {
      switch(event.type) {
        case 'add':
          storeAPI.dispatch(addMessage({ chatId, message: event.message }));
          break;
        case 'update':
          storeAPI.dispatch(patchLastAssistantMessage({ chatId, patch: event.message }));
          break;
        case 'done':
          storeAPI.dispatch(setIsGenerating({ chatId, value: false }));
          break;
      }
    });
    
    await taskLoop.start(input);
  }
  return next(action);
};
``` 