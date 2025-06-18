import OpenAI from 'openai';

import type { OpenAIEndpoint, ChatCompletionOptions, ChatCompletionResponse } from '@/types/openai';

export class OpenAIService {
  private client: OpenAI | null = null;
  private endpoint: OpenAIEndpoint | null = null;

  constructor() {}

  public initialize(endpoint: OpenAIEndpoint) {
    this.endpoint = endpoint;
    this.client = new OpenAI({
      apiKey: endpoint.apiKey,
      baseURL: endpoint.baseURL || 'https://api.openai.com/v1',
      maxRetries: 3,
    });
  }

  public async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    if (!this.client || !this.endpoint) {
      throw new Error('OpenAI client not initialized. Call initialize() first.');
    }

    try {      const model = options.model || this.endpoint.models[0].id;
      const completion = await this.client.chat.completions.create({
        model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? this.endpoint.models.find(m => m.id === model)?.maxTokens ?? 4096,
        top_p: options.top_p ?? 0.9,
        frequency_penalty: options.frequency_penalty ?? 0.2,
      });

      return {
        id: completion.id,
        choices: completion.choices.map(choice => ({
          message: {
            role: choice.message.role,
            content: choice.message.content || '',
          },
          finish_reason: choice.finish_reason,
          index: choice.index,
        })),
        usage: completion.usage ? {
          prompt_tokens: completion.usage.prompt_tokens,
          completion_tokens: completion.usage.completion_tokens,
          total_tokens: completion.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this.client !== null && this.endpoint !== null;
  }

  public getEndpoint(): OpenAIEndpoint | null {
    return this.endpoint;
  }

  public disconnect() {
    this.client = null;
    this.endpoint = null;
  }
}
