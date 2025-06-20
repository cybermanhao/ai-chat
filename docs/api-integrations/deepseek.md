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
