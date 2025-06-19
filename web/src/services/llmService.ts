import { XStream } from '@ant-design/x';
import { OpenAI } from 'openai';

export type ChatCompletionCreateParams = OpenAI.Chat.Completions.ChatCompletionCreateParams;
export type ChatCompletionToolMessageParam = OpenAI.Chat.ChatCompletionToolMessageParam;
export type ChatCompletionContentPartText = OpenAI.Chat.Completions.ChatCompletionContentPartText;

// 使用 typeof 来获取正确的 XStream 类型
let _currentStream: ReturnType<typeof XStream> | null = null;

export interface LLMRequestParams {
  baseURL: string;
  apiKey: string;
  model: string;
  messages: Array<{
    role: string;
    content: string | Array<{ type: 'text'; text: string; }>;
    tool_call_id?: string;
  }>;
  temperature?: number;
  tools?: ChatCompletionCreateParams['tools'];
  parallelToolCalls?: boolean;
}

export class LLMService {
  private getApiPath(baseURL: string): string {
    return `${baseURL}/chat/completions`;
  }

  private formatMessages(messages: LLMRequestParams['messages']) {
    return messages.map(msg => ({
      ...msg,
      content: Array.isArray(msg.content)
        ? msg.content
        : (msg.content || ''),
    }));
  }

  private getAuthHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  }

  async createChatCompletion(params: LLMRequestParams) {
    const {
      baseURL,
      apiKey,
      model,
      messages,
      temperature = 0.7,
      tools = [],
      parallelToolCalls = false,
    } = params;

    const response = await fetch(this.getApiPath(baseURL), {
      method: 'POST',
      headers: this.getAuthHeaders(apiKey),
      body: JSON.stringify({
        model,
        messages: this.formatMessages(messages),
        temperature,
        tools: tools.length > 0 ? tools : undefined,
        parallel_tool_calls: tools.length > 0 ? parallelToolCalls : undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stream = XStream({
      readableStream: response.body as ReadableStream,
    });

    _currentStream = stream;
    return stream;
  }

  abortCurrentStream() {
    if (_currentStream) {
      _currentStream = null;
    }
  }

  getCurrentStream() {
    return _currentStream;
  }
}

export const llmService = new LLMService();
export const getCurrentStream = () => _currentStream;
