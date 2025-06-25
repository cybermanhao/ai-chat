// engine/chat/ChatSession.ts
// 通用聊天会话业务对象，平台无关，负责消息、流、tool call 处理等
import type { ChatMessage } from '../types/chat';
import type { LLMService } from '../service/llmService';
import { parseLLMStream, consumeLLMStream } from '../utils/streamHandler';
import type { StreamChunk } from '../types/stream';

export class ChatSession {
  protected messages: ChatMessage[] = [];
  protected isGenerating = false;
  protected error: string | null = null;
  protected llmService: LLMService | null = null;

  constructor(opts?: { llmService?: LLMService }) {
    if (opts?.llmService) this.llmService = opts.llmService;
  }

  getMessages() {
    return this.messages;
  }

  getIsGenerating() {
    return this.isGenerating;
  }

  getError() {
    return this.error;
  }

  async handleSend(input: string) {
    this.isGenerating = true;
    this.error = null;
    this.messages.push({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });
    try {
      if (this.llmService) {
        const stream = await this.llmService.createChatStream(input);
        const chunkIter = parseLLMStream(stream);
        await consumeLLMStream(chunkIter, (chunk: StreamChunk) => {
          if (!this.isGenerating) return;
          this.appendAssistantChunk(chunk.content);
        });
      } else {
        await this.mockStreamResponse();
      }
    } catch (e: any) {
      this.error = e.message || 'LLM error';
    } finally {
      this.isGenerating = false;
    }
  }

  protected appendAssistantChunk(chunk: string) {
    let last = this.messages[this.messages.length - 1];
    if (!last || last.role !== 'assistant') {
      last = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      this.messages.push(last);
    }
    last.content += chunk;
  }

  handleStop() {
    this.isGenerating = false;
  }

  protected async mockStreamResponse() {
    const id = Date.now().toString() + '-assistant';
    this.messages.push({
      id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    });
    for (let i = 0; i < 5; i++) {
      if (!this.isGenerating) break;
      await new Promise(res => setTimeout(res, 400));
      this.messages[this.messages.length - 1].content += '流片段' + (i + 1) + ' ';
    }
  }

  save() {
    // 可由子类实现
  }
}
