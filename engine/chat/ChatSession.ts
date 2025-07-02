// engine/chat/ChatSession.ts
// @ts-nocheck
// 废弃
// 通用聊天会话业务对象，平台无关，负责消息、流、tool call 处理等
import type { RuntimeMessage } from '../types/chat';
import type { LLMService } from '../service/llmService';
import { ChatMessageManager } from '../managers/MessageManager';
import type { StreamChunk } from '../types/chat';

export class ChatSession {
  protected messageManager: ChatMessageManager;
  protected llmService: LLMService | null = null;

  constructor(opts?: { llmService?: LLMService, initialMessages?: RuntimeMessage[] }) {
    // ChatSession 只做快照和业务 glue，不做 UI/流程状态
    if (opts?.llmService) this.llmService = opts.llmService;
    this.messageManager = new ChatMessageManager(opts?.initialMessages || []);
  }

  getMessages() {
    return this.messageManager.getMessages();
  }

  addMessage(msg: RuntimeMessage) {
    this.messageManager.addMessage(msg);
  }

  updateLastMessage(patch: Partial<RuntimeMessage>) {
    this.messageManager.updateLastMessage(patch);
  }

  clearMessages() {
    this.messageManager.clearMessages();
  }

  // 业务 glue：外部 glue 层负责流程/渲染状态
  async handleSend(input: string, params: {
    model: string;
    baseUrl: string;
    apiKey: string;
    systemPrompt?: string;
    tools?: any[];
    tool_choice?: any;
    onChunk?: (chunk: any) => void;
    onDone?: (result: any) => void;
    onError?: (err: any) => void;
    signal?: AbortSignal;
  }) {
    const userMessage = ChatMessageManager.createUserMessage(input);
    this.messageManager.addMessage(userMessage);
    const assistantMessage = ChatMessageManager.createAssistantMessage('', 'generating');
    this.messageManager.addMessage(assistantMessage);
    try {
      if (this.llmService) {
        const messages = this.messageManager.getMessages();
        await this.llmService.generate({
          model: params.model,
          messages,
          baseUrl: params.baseUrl,
          apiKey: params.apiKey,
          systemPrompt: params.systemPrompt,
          tools: params.tools,
          tool_choice: params.tool_choice,
        }, {
          onChunk: (chunk) => {
            this.messageManager.updateLastMessage({
              content: chunk.content,
              reasoning_content: chunk.reasoning_content,
              tool_content: typeof chunk.tool_content === 'string' ? chunk.tool_content : undefined,
              observation_content: chunk.observation_content,
              thought_content: chunk.thought_content,
              status: chunk.status || 'generating'
            });
            params.onChunk?.(chunk);
          },
          onDone: (result) => {
            this.messageManager.updateLastMessage({
              content: result.content,
              reasoning_content: result.reasoning_content,
              tool_content: typeof result.tool_content === 'string' ? result.tool_content : undefined,
              observation_content: result.observation_content,
              thought_content: result.thought_content,
              status: 'stable'
            });
            params.onDone?.(result);
          },
          onError: (err) => {
            this.messageManager.updateLastMessage({ status: 'error' });
            params.onError?.(err);
          },
          signal: params.signal
        });
      } else {
        await this.mockStreamResponse();
      }
    } catch (e: any) {
      this.messageManager.updateLastMessage({ status: 'error' });
      params.onError?.(e);
    }
  }

  // 任务中断由 glue 层控制
  handleStop() {
    // 由 glue 层/AbortController 控制
  }

  protected async mockStreamResponse() {
    const assistantMessage = ChatMessageManager.createAssistantMessage('', 'generating');
    this.messageManager.addMessage(assistantMessage);
    for (let i = 0; i < 5; i++) {
      await new Promise(res => setTimeout(res, 400));
      const currentContent = this.messageManager.getMessages().slice(-1)[0]?.content || '';
      this.messageManager.updateLastMessage({
        content: currentContent + '流片段' + (i + 1) + ' '
      });
    }
    this.messageManager.updateLastMessage({ status: 'stable' });
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
    const session = new ChatSession({});
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
    this.createSession(id);
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
