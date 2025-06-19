interface StreamChunk {
  data?: string;
}

interface StreamResponse {
  choices?: Array<{
    finish_reason?: string;
    delta?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
  usage?: unknown;
}

export const handleResponseStream = async (
  stream: AsyncIterable<StreamChunk>,
  onThinking: (content: string) => void,
  onAnswering: (content: string, reasoning: string) => void,
  onComplete: (content: string, reasoning: string) => void
) => {
  let fullResponse = '';
  let fullReasoningResponse = '';

  for await (const chunk of stream) {
    if (!chunk.data) continue;
    
    let data: StreamResponse;
    try {
      data = JSON.parse(chunk.data);
      if (data.choices?.[0]?.finish_reason === 'stop' && data.usage) {
        break;
      }
    } catch {
      if (chunk.data !== '[DONE]') {
        console.warn('Failed to parse chunk:', chunk.data);
      }
      continue;
    }

    const delta = data.choices?.[0]?.delta;
    if (!delta) continue;

    if (delta.reasoning_content) {
      fullReasoningResponse += delta.reasoning_content;
      onThinking(fullReasoningResponse);
    }

    if (delta.content) {
      fullResponse += delta.content;
      onAnswering(fullResponse, fullReasoningResponse);
    }
  }

  onComplete(fullResponse, fullReasoningResponse);
};
