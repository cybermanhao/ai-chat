// engine/chat/ChatSession.ts
// 通用聊天会话业务对象，平台无关，负责消息、流、tool call 处理等
import type { RuntimeMessage } from '../types/chat';
import type { LLMService } from '../service/llmService';
import { ChatMessageManager } from '../managers/MessageManager';
import { handleResponseStream } from '../stream/streamHandler';
import type { StreamChunk } from '../types/chat';

export class ChatSession {
  protected messageManager: ChatMessageManager;
  protected isGenerating = false;
  protected error: string | null = null;
  protected llmService: LLMService | null = null;

  constructor(opts?: { llmService?: LLMService, initialMessages?: RuntimeMessage[] }) {
    console.log('[ChatSession.constructor] llmService:', opts?.llmService, 'class:', opts?.llmService?.constructor?.name);
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

  getIsGenerating() {
    return this.isGenerating;
  }

  getError() {
    return this.error;
  }

  async handleSend(input: string) {
    this.isGenerating = true;
    this.error = null;
    
    const userMessage = ChatMessageManager.createUserMessage(input);
    this.messageManager.addMessage(userMessage);
    
    const assistantMessage = ChatMessageManager.createAssistantMessage('', 'generating');
    this.messageManager.addMessage(assistantMessage);
    
    try {
      if (this.llmService) {
        const messages = this.messageManager.getMessages();
        // TODO: 这里的 model、baseUrl、apiKey、systemPrompt、tools、tool_choice 等参数应由 ChatSession 构造时注入或通过配置获取
        // 这里只做演示，实际应从配置或外部传入
        const model = 'your-model';
        const baseUrl = 'your-base-url';
        const apiKey = 'your-api-key';
        const systemPrompt = '';
        const tools = undefined;
        const tool_choice = undefined;
        await this.llmService.generate({
          model,
          messages,
          baseUrl,
          apiKey,
          systemPrompt,
          tools,
          tool_choice,
        }, {
          onChunk: (chunk) => {
            if (!this.isGenerating) return;
            this.messageManager.updateLastMessage({
              content: chunk.content,
              reasoning_content: chunk.reasoning_content,
              tool_content: typeof chunk.tool_content === 'string' ? chunk.tool_content : undefined,
              observation_content: chunk.observation_content,
              thought_content: chunk.thought_content,
              status: chunk.status || 'generating'
            });
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
          }
        });
      } else {
        await this.mockStreamResponse();
      }
    } catch (e: any) {
      this.error = e.message || 'LLM error';
      this.messageManager.updateLastMessage({ status: 'error' });
    } finally {
      this.isGenerating = false;
    }
  }

  handleStop() {
    this.isGenerating = false;
  }

  protected async mockStreamResponse() {
    const assistantMessage = ChatMessageManager.createAssistantMessage('', 'generating');
    this.messageManager.addMessage(assistantMessage);
    
    for (let i = 0; i < 5; i++) {
      if (!this.isGenerating) break;
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
