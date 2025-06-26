// engine/chat/ChatSession.ts
// 通用聊天会话业务对象，平台无关，负责消息、流、tool call 处理等
import type { ChatMessage } from '../types/chat';
import type { LLMService } from '../service/llmService';
import { parseLLMStream, consumeLLMStream } from '../utils/streamHandler';
import type { StreamChunk } from '../types/stream';
import { MessageManager, Message, MessageProps } from '../types/message';

export class ChatSession {
  protected messages: MessageManager;
  protected isGenerating = false;
  protected error: string | null = null;
  protected llmService: LLMService | null = null;

  constructor(opts?: { llmService?: LLMService, initialMessages?: MessageProps[] }) {
    console.log('[ChatSession.constructor] llmService:', opts?.llmService, 'class:', opts?.llmService?.constructor?.name);
    if (opts?.llmService) this.llmService = opts.llmService;
    this.messages = new MessageManager(opts?.initialMessages || []);
  }

  getMessages() {
    return this.messages.getAllMessages();
  }

  addMessage(props: MessageProps) {
    return this.messages.createMessage(props);
  }

  updateMessage(id: string, patch: Partial<MessageProps>) {
    this.messages.updateMessage(id, patch);
  }

  deleteMessage(id: string) {
    this.messages.deleteMessage(id);
  }

  clearMessages() {
    this.messages.clearMessages();
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
    this.messages.createMessage({
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });
    try {
      if (this.llmService) {
        const stream = await this.llmService.createChatStream(this.messages.getAllMessages());
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
    const allMessages = this.messages.getAllMessages();
    let last = allMessages[allMessages.length - 1];
    if (!last || last.role !== 'assistant') {
      // 构造 MessageProps
      const newMsgProps: MessageProps = {
        id: Date.now().toString() + '-assistant',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };
      last = this.messages.createMessage(newMsgProps);
    }
    last.updateContent(last.content + chunk);
  }

  handleStop() {
    this.isGenerating = false;
  }

  protected async mockStreamResponse() {
    const id = Date.now().toString() + '-assistant';
    const msg = this.messages.createMessage({
      id,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    });
    for (let i = 0; i < 5; i++) {
      if (!this.isGenerating) break;
      await new Promise(res => setTimeout(res, 400));
      msg.updateContent(msg.content + '流片段' + (i + 1) + ' ');
    }
  }

  save() {
    // 可由子类实现
  }
}

export class ChatSessionManager {
  protected sessionMap = new Map<string, ChatSession>();
  protected activeId: string | null = null;

  createSession(id: string): ChatSession {
    if (this.sessionMap.has(id)) {
      return this.sessionMap.get(id)!;
    }
    const session = new ChatSession({}); // 依赖注入可由子类扩展
    this.sessionMap.set(id, session);
    return session;
  }

  getSession(id: string): ChatSession | undefined {
    return this.sessionMap.get(id);
  }

  getActiveSession(): ChatSession | undefined {
    if (!this.activeId) return undefined;
    return this.sessionMap.get(this.activeId);
  }

  setActiveSession(id: string): void {
    this.activeId = id;
    this.createSession(id); // 确保已创建
  }

  deleteSession(id: string): void {
    this.sessionMap.delete(id);
    if (this.activeId === id) {
      this.activeId = null;
    }
  }

  getAllSessions(): ChatSession[] {
    return Array.from(this.sessionMap.values());
  }
}
