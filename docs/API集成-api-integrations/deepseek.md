# Deepseek API Integration

## Overview

[Deepseek API](https://api-docs.deepseek.com/zh-cn/api/create-chat-completion) provides chat completion functionality with streaming support and additional content fields for more detailed responses.

## API Response Format

### Message Structure
```typescript
interface DeepseekMessage {
  content: string;
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
  role: 'user' | 'assistant' | 'system';
}
```

### Streaming Response Chunk
Each streaming chunk contains:
- `content`: The main response content
- `reasoning_content`: Reasoning process (optional)
- `tool_content`: Tool usage details (optional)
- `observation_content`: Observations from tool usage (optional)
- `thought_content`: Thought process (optional)

### Additional Parameters
- `safe_mode`: Enable content filtering
- `random_seed`: Control response randomness
- `system_fingerprint`: Model version identifier

## Tool Calling（Function Calling 工具调用）

Deepseek API 支持 function calling（工具调用），可通过 tools 字段传递函数描述，允许模型在对话中自动调用你定义的函数。

Deepseek API supports function calling, allowing you to pass a list of functions via the `tools` field. The model can automatically call your defined functions during a conversation.

### tools 字段结构 / Structure

- `tools`: 一个 function 对象数组，每个 function 需包含 name、description、parameters（JSON Schema 格式）。
- `tool_choice`: 控制模型是否/如何调用工具，可选值有 none、auto、required 或指定具体函数。

- `tools`: An array of function objects. Each function must include `name`, `description`, and `parameters` (in JSON Schema format).
- `tool_choice`: Controls whether/how the model calls tools. Options: `none`, `auto`, `required`, or specify a function by name.

#### 示例 / Example

```json
{
  "model": "deepseek-chat",
  "messages": [{ "role": "user", "content": "帮我查下明天天气" }],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "获取指定城市的天气 (Get weather for a city)",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string", "description": "城市名称 (City name)" }
          },
          "required": ["city"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

- 当 tool_choice 为 auto 时，模型可自主决定是否调用工具。
- You can set `tool_choice` to `auto` to let the model decide whether to call a tool.
- 你也可以通过 tool_choice 指定必须调用某个函数。
- You can also specify a function name to force the model to call a specific tool.

### 响应格式 / Response Format

- 如果模型决定调用工具，返回的 message 中 role 为 "tool"，content 为调用参数。
- If the model decides to call a tool, the returned message will have `role: "tool"` and the `content` will contain the function call arguments.
- 你需根据返回内容自行实现工具逻辑，并将结果以 assistant 消息继续补全对话。
- You need to implement the tool logic yourself and continue the conversation with an assistant message containing the tool result.

### 参考 / Reference

- [OpenAI Function Calling 兼容 / Compatible](https://platform.openai.com/docs/guides/function-calling)
- tools 最多支持 128 个 function，参数需符合 JSON Schema。
- Up to 128 functions are supported. Parameters must conform to JSON Schema.

## Usage Example

```typescript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'Hello' }],
    stream: true,
    max_tokens: 100,
    temperature: 0.7
  })
});

// Handle streaming response
for await (const chunk of streamResponse(response)) {
  console.log(chunk.content);
  console.log(chunk.reasoning_content);
  console.log(chunk.tool_content);
  console.log(chunk.observation_content);
  console.log(chunk.thought_content);
}
```

## Implementation Notes

1. Always validate the presence of additional content fields as they are optional
2. Handle safe_mode and random_seed parameters according to user preferences
3. Monitor system_fingerprint for version changes

## Error Handling

Common error codes:
- 401: Invalid API key
- 429: Rate limit exceeded
- 500: Server error

## Testing

See `tests/api/deepseek.test.ts` for test cases covering:
- Type validation
- Streaming functionality
- Additional content fields
- Error scenarios
