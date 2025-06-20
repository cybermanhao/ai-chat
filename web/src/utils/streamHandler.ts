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
  let isFirstChunk = true;
  let hasStartedAnswering = false;

  try {
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

      if (isFirstChunk) {
        onThinking('');  // 初始状态
        isFirstChunk = false;
      }

      if (delta.reasoning_content) {
        fullReasoningResponse += delta.reasoning_content;
        onThinking(fullReasoningResponse);  // 思考状态
      }

      if (delta.content) {
        if (!hasStartedAnswering) {
          hasStartedAnswering = true;
        }
        fullResponse += delta.content;
        onAnswering(fullResponse, fullReasoningResponse);  // 回答状态
      }
    }

    // 完成状态
    if (fullResponse || fullReasoningResponse) {
      onComplete(fullResponse, fullReasoningResponse);
    }
  } catch (error) {
    console.error('Error processing stream:', error);
    // 确保即使在错误情况下也能保存已经接收到的内容
    if (fullResponse || fullReasoningResponse) {
      onComplete(fullResponse, fullReasoningResponse);
    }
    throw error;
  }
};