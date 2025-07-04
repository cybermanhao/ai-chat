# MCP 工具调用流程测试指南

## 测试目标
验证 TaskLoop 能够正确检测 Deepseek API 返回的工具调用事件，并触发 MCP 工具调用流程。

## 测试数据
基于用户提供的 Deepseek API 返回数据：

```json
// 第一个 chunk - Assistant 开始响应
{"id":"47ddf0a2-4cee-4d08-a338-a6bdb8a60726","object":"chat.completion.chunk","created":1751567181,"model":"deepseek-chat","system_fingerprint":"fp_8802369eaa_prod0623_fp8_kvcache","choices":[{"index":0,"delta":{"role":"assistant","content":""},"logprobs":null,"finish_reason":null}]}

// 第二个 chunk - 工具调用开始
{"id":"47ddf0a2-4cee-4d08-a338-a6bdb8a60726","object":"chat.completion.chunk","created":1751567181,"model":"deepseek-chat","system_fingerprint":"fp_8802369eaa_prod0623_fp8_kvcache","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_0_85f3728d-def8-49d8-88a3-f5d574dadb09","type":"function","function":{"name":"weather","arguments":""}}]},"logprobs":null,"finish_reason":null}]}

// 第三个 chunk - 工具参数流式传输
{"id":"47ddf0a2-4cee-4d08-a338-a6bdb8a60726","object":"chat.completion.chunk","created":1751567181,"model":"deepseek-chat","system_fingerprint":"fp_8802369eaa_prod0623_fp8_kvcache","choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\""}}]},"logprobs":null,"finish_reason":null}]}
```

## 修改内容概述

### 1. llmService.ts 增强
- ✅ 在 `streamLLMChat` 中添加工具调用检测逻辑
- ✅ 使用去重机制避免重复触发同一工具调用
- ✅ 在流式传输过程中和完成后都检查工具调用
- ✅ 只有当 JSON.parse(arguments) 成功时才触发 onToolCall

### 2. 工具调用检测流程
```typescript
// 1. 流式处理中检测工具调用
handleResponseStream(stream, (chunk) => {
  if (chunk.tool_calls && chunk.tool_calls.length > 0 && onToolCall) {
    for (const toolCall of chunk.tool_calls) {
      if (toolCall.function && toolCall.function.name && toolCall.function.arguments) {
        try {
          JSON.parse(toolCall.function.arguments); // 验证参数完整性
          onToolCall(toolCall); // 触发工具调用
        } catch (e) {
          // 参数还在传输中，等待完整
        }
      }
    }
  }
});

// 2. TaskLoop 接收 onToolCall 回调
onToolCall: (toolCall: any) => {
  this.emit({ type: 'toolcall', toolCall, cardStatus: 'tool_calling' });
  needToolCall = true; // 标记需要工具调用
}

// 3. 自动工具链逻辑
if (needToolCall) {
  // 调用 MCP 服务
  const result = await this.mcpService.callTool(toolCall.function.name, args);
  // 插入工具结果到消息流
  // 继续下一轮 LLM 交互
}
```

## 预期行为

1. **工具调用检测**: 当收到包含 `tool_calls` 的 chunk 时，立即检测
2. **参数完整性验证**: 只有当 `arguments` 能成功 JSON.parse 时才触发
3. **去重机制**: 避免同一工具调用被多次触发
4. **事件触发**: 正确触发 `onToolCall` 回调，设置 `needToolCall = true`
5. **自动工具链**: 在当前轮次完成后自动调用 MCP 工具
6. **结果处理**: 工具结果插入消息流，驱动下一轮对话

## 关键日志输出

### 成功场景
```
[streamLLMChat] 工具调用参数流式传输中... weather
[streamLLMChat] 检测到完整工具调用: weather ID: call_0_85f3728d-def8-49d8-88a3-f5d574dadb09
[TaskLoop] 调用工具: weather {location: "北京"}
[TaskLoop] 完成 1 个工具调用，继续下一轮对话
```

### 异常场景
```
[TaskLoop] 需要工具调用但 MCP 服务未注入，跳过工具调用
[TaskLoop] 最后一条消息不包含工具调用，跳过
[TaskLoop] 工具调用参数解析失败: invalid json
```

## 测试步骤

1. **启动服务**: 确保 MCP 服务正确注入到 TaskLoop
2. **发送请求**: 向包含工具的 LLM 发送请求
3. **观察日志**: 检查工具调用检测和触发日志
4. **验证结果**: 确认工具被调用且结果正确返回

## 配置要求

```typescript
// TaskLoop 初始化时注入 MCPService
const taskLoop = new TaskLoop(
  messages, 
  config, 
  mcpService // 必须注入，否则工具调用会跳过
);

// LLM 配置必须包含工具定义
const config = {
  tools: [
    {
      type: "function",
      function: {
        name: "weather",
        description: "获取天气信息",
        parameters: { /* schema */ }
      }
    }
  ]
};
```

## 验证检查清单

- [ ] streamLLMChat 正确检测工具调用
- [ ] onToolCall 回调被正确触发
- [ ] needToolCall 标志被正确设置
- [ ] MCP 工具被自动调用
- [ ] 工具结果插入消息流
- [ ] 多轮对话正常继续
- [ ] 错误情况得到妥善处理

这个修改确保了 TaskLoop 能够响应你提供的 Deepseek API 工具调用数据格式。
