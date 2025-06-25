# LLM 流式数据处理与代码结构规划

## 1. 目标与背景
本项目涉及多种 LLM（大模型）流式输出的解析、消费与消息管理，需兼容多协议（如 OpenAI/DeepSeek）、多端（Node/浏览器），并支持插件化 tool_call 处理。为提升类型安全、解耦性和可维护性，需梳理并统一流处理相关的核心逻辑和代码结构。

## 2. 流处理标准流程

### 2.1 流解析 parse
- 负责将原始流（如 fetch Response、ReadableStream、Node Readable）解析为结构化的 StreamChunk。
- 只做协议解析，不涉及业务处理。
- 典型函数：`parseLLMStream(stream): AsyncIterable<StreamChunk>`

### 2.2 chunk 消费 consume
- 负责消费每个 chunk，进行消息内容更新、tool_call 分片累加、flush、tool_content 解析、回调等。
- 只做流式业务处理，不直接操作 UI/状态。
- 典型函数：`consumeLLMStream(chunkIter, handler: (chunk) => Promise<void>)`

### 2.3 tool_call 分片累加与 flush
- 负责将多分片的 tool_call arguments 累加，finish_reason 到达时 flush 并回调。
- 应抽象为独立的 ToolCallAccumulator 工具类/函数，避免在 handler 里重复实现。

### 2.4 消息类型转换/工厂
- 负责 chunk → RuntimeMessage/ChatMessage 的类型安全转换。
- 统一用 messageConverters.ts 管理。

### 2.5 业务回调/扩展点
- 例如 handleToolCall、updateMessage、onFinish 等，供业务层注入。

## 3. 跨平台流处理说明
- Node 环境用 Readable Stream，浏览器用 Web Streams API（ReadableStream）。
- 推荐统一用 async iterator (`for await...of`) 消费流，入口适配流类型即可。
- 这样 parse/consume/converter 方案可同时适配 Node 和浏览器。

## 4. 代码结构建议

```
engine/types/stream.ts           # 流相关类型定义
engine/utils/streamParser.ts     # parseLLMStream: 流 → chunk
engine/utils/streamConsumer.ts   # consumeLLMStream: chunk → 业务处理
engine/utils/toolCallAccumulator.ts # ToolCallAccumulator: tool_call 分片累加/flush
engine/utils/messageConverters.ts   # 消息类型转换
```

- WebChatSession、webLLMStreamHandler 只负责注入回调和业务处理，不再实现底层流/分片逻辑。
- 所有流相关类型、接口、工具函数集中管理，提升架构清晰度和复用性。

## 5. 扩展点
- 支持多 LLM/多协议（parse/consume 可插拔）。
- 支持 tool_call 插件化（ToolCallAccumulator 可扩展）。
- 支持流式消息/工具调用的统一回调和状态管理。

## 6. 参考实现
- 详见 engine/utils/webLLMStreamHandler.ts 现有实现，建议将 tool_call 分片累加/flush 逻辑抽取为独立工具。
- 统一 parse/consume/converter 入口，便于维护和扩展。

---
本规范文档用于指导流式数据处理相关代码的重构与新功能开发。
