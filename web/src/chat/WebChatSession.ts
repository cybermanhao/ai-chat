// 单个聊天会话对象，管理消息、流、订阅与状态
// 供 UI 直接交互，已迁移至 web/src/chat
import { ChatSession } from '@engine/chat/ChatSession';
import { type ChatMessage } from '@engine/types/chat';
import type { LLMService } from '@engine/service/llmService';
import { parseLLMStream, consumeLLMStream } from './streamHandler';
import type { StreamChunk } from '@/types/stream';
import { ToolCallAccumulator } from '@engine/utils/toolCallAccumulator';
import { type WebLLMService } from '@/services/llmService';
import { chatStorage } from '@/services/chatStorage';
import { ChatSessionManager } from '@engine/chat/ChatSession';
import { llmService } from '@/services/llmService';
import { ChatMessageManager } from '@engine/utils/ChatMessageManager';
import type { BaseMessageProps } from '@engine/types/message';
import type { MessageStatus } from '@engine/types/chat';
import { buildLLMRequestPayload } from '@/utils/llmConfig';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import type { LLMConfig } from '@engine/types/llm';

interface WebChatSessionArgs {
  llmService: WebLLMService;
  chatId: string;
  initialMessages?: any[];
}

// 类型补充：兼容 userModel
interface LLMConfigWithUserModel extends LLMConfig {
  userModel?: string;
}

export class WebChatSession extends ChatSession {
  public id: string;
  protected messages: ChatMessageManager;
  protected isGenerating = false;
  protected error: string | null = null;
  private listeners: (() => void)[] = [];
  protected llmService: WebLLMService;
  private toolCallAccumulator: ToolCallAccumulator;

  constructor({ llmService, chatId, initialMessages = [] }: WebChatSessionArgs) {
    console.log('[WebChatSession.constructor] llmService:', llmService, 'class:', llmService?.constructor?.name);
    super({ llmService });
    this.llmService = llmService;
    this.id = chatId;
    this.messages = new ChatMessageManager(initialMessages, () => this.save());

    this.toolCallAccumulator = new ToolCallAccumulator({
      onFlush: async (toolName, toolArgs) => {
        console.log('Flushing tool call:', toolName, toolArgs);
        // ... (tool call logic can be filled in later)
      },
    });

    this.loadHistory();
  }

  getMessages() {
    return this.messages.getMessages();
  }

  getIsGenerating() {
    return this.isGenerating;
  }

  getError() {
    return this.error;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  async loadHistory() {
    // const history = await chatStorage.getMessages(this.id);
    // if (history) {
    //   this.messages = history;
    //   this.notify();
    // }
  }

  async save() {
    // await chatStorage.saveMessages(this.id, this.messages);
  }

  /**
   * 发送消息，llmConfig 由外部传入，避免 class 内部调用 hook
   * options: { onStreamStart?: () => void }
   */
  async handleSend(input: string): Promise<void>;
  async handleSend(input: string, llmConfig: LLMConfigWithUserModel, options?: { onStreamStart?: () => void }): Promise<void>;
  async handleSend(input: string, llmConfig?: LLMConfigWithUserModel, options?: { onStreamStart?: () => void }) {
    if (!llmConfig) {
      // 兼容基类调用，直接返回
      return super.handleSend(input);
    }
    this.isGenerating = true;
    console.log('[WebChatSession.handleSend] isGenerating = true');
    this.error = null;
    
    // 使用新的消息管理器创建用户消息
    const userMessage = this.messages.addUserMessage(input, 'stable');
    console.log('[WebChatSession.handleSend] created user message:', userMessage);
    this.notify();
    
    let streamStarted = false;
    try {
      const configWithModel = { ...llmConfig, model: llmConfig.model || (llmConfig as any).userModel };
      const payload = buildLLMRequestPayload(this.messages.filterForLLM(), {
        server: { llmConfig: configWithModel },
        extraOptions: configWithModel,
      });
      const stream = await this.llmService.createChatStream(
        payload.messages as any[],
        { llmConfig: payload }
      );
      const chunkIter = parseLLMStream(stream);
      for await (const chunk of chunkIter) {
        if (!this.isGenerating) return;
        if (!streamStarted) {
          streamStarted = true;
          if (options?.onStreamStart) options.onStreamStart();
        }
        if (chunk.tool_calls) {
          this.toolCallAccumulator.addChunk(chunk.tool_calls);
        }
        if (chunk.content) {
          this.appendAssistantChunk(chunk.content);
        }
      }
      // 生成完成，最后一条消息变 stable 并保存
      console.log('[WebChatSession.handleSend] stream finished, setLastMessageStable');
      this.setLastMessageStable();
      console.log('[WebChatSession.handleSend] save after finish');
      await this.save();
      await this.toolCallAccumulator.flushIfNeeded('tool_calls');
    } catch (e: any) {
      this.error = e.message || 'LLM error';
      // 生成失败，最后一条消息变 stable 并保存
      console.log('[WebChatSession.handleSend] stream error, setLastMessageStable');
      this.setLastMessageStable();
      console.log('[WebChatSession.handleSend] save after error');
      await this.save();
    } finally {
      this.isGenerating = false;
      console.log('[WebChatSession.handleSend] isGenerating = false');
      this.toolCallAccumulator.reset();
      this.notify();
      console.log('[WebChatSession.handleSend] notify called');
    }
  }
  
  override handleStop() {
    this.isGenerating = false;
    console.log('[WebChatSession.handleStop] isGenerating = false');
    this.toolCallAccumulator.reset();
    // 停止生成，最后一条消息变 stable 并保存
    console.log('[WebChatSession.handleStop] setLastMessageStable');
    this.setLastMessageStable();
    console.log('[WebChatSession.handleStop] save after stop');
    this.save();
    this.notify();
    console.log('[WebChatSession.handleStop] notify called');
  }

  protected override appendAssistantChunk(chunk: string) {
    // 调试输出
    const allMessages = this.messages.getMessages();
    let last = allMessages[allMessages.length - 1];
    if (!last || last.role !== 'assistant') {
      // 新建 assistant 消息
      last = this.messages.addAssistantMessage('', 'generating');
      console.log('[WebChatSession.appendAssistantChunk] create new assistant message:', last.id);
    }
    const before = last.content;
    last.updateContent(before + chunk);
    console.log('[WebChatSession.appendAssistantChunk] chunk:', JSON.stringify(chunk),
      '\nmessageId:', last.id,
      '\nrole:', last.role,
      '\nbefore:', JSON.stringify(before),
      '\nafter:', JSON.stringify(last.content));
    this.notify();
  }

  private async consumeStream(stream: ReadableStream<Uint8Array>) {
    const chunkIter = parseLLMStream(stream);
    await consumeLLMStream(chunkIter, async (chunk: StreamChunk) => {
      if (!this.isGenerating) return;
      this.appendAssistantChunk(chunk.content);
      // --- tool_call 处理逻辑迁移 ---
      this.toolCallAccumulator.addChunk((chunk as any).tool_calls);
      // 兼容单次 tool_content（如非分片 function call）
      if (
        chunk.tool_content &&
        typeof chunk.tool_content === 'object' &&
        (chunk.tool_content as any).name
      ) {
        const toolContent = chunk.tool_content as any;
        const toolName = toolContent.name;
        let toolArgs: Record<string, unknown> = {};
        try {
          toolArgs = toolContent.arguments ? JSON.parse(toolContent.arguments) : {};
        } catch {}
        await this.handleToolCall(toolName, toolArgs);
      }
      // 检查 finish_reason，flush tool_calls
      const finishReason = ((chunk as any).choices?.[0]?.finish_reason)
        || ((chunk as any).finish_reason);
      await this.toolCallAccumulator.flushIfNeeded(finishReason);
    });
  }

  // tool_call 实际处理逻辑（可根据业务扩展）
  private async handleToolCall(toolName: string, toolArgs: Record<string, unknown>) {
    // TODO: 实现 tool call 的业务逻辑
    // 例如：this.messages.push({ ... }) 或调用外部服务
    // 这里只做日志输出
    console.log('Tool call:', toolName, toolArgs);
  }

  protected async mockStreamResponse() {
    const id = Date.now().toString() + '-assistant';
    this.messages.addAssistantMessage('', 'generating');
    this.notify();
    for (let i = 0; i < 5; i++) {
      if (!this.isGenerating) break;
      await new Promise(res => setTimeout(res, 400));
      const allMessages = this.messages.getMessages();
      const lastMessage = allMessages[allMessages.length - 1];
      lastMessage.updateContent(lastMessage.content + '流片段' + (i + 1) + ' ');
      this.notify();
    }
  }

  addMessage(props: BaseMessageProps & { status: MessageStatus }) {
    return this.messages.createAssistantMessage(props.content, props.status, props);
  }

  updateMessage(id: string, patch: Partial<BaseMessageProps>) {
    // 这里需要实现根据id更新消息的逻辑
    const allMessages = this.messages.getMessages();
    const message = allMessages.find(m => m.id === id);
    if (message) {
      Object.assign(message, patch);
      this.notify();
    }
  }

  deleteMessage(id: string) {
    // 这里需要实现删除消息的逻辑
    const allMessages = this.messages.getMessages();
    const index = allMessages.findIndex(m => m.id === id);
    if (index !== -1) {
      allMessages.splice(index, 1);
      this.notify();
    }
  }

  clearMessages() {
    this.messages.clearMessages();
  }

  setAllMessagesStable() {
    const msgs = this.messages.getMessages();
    msgs.forEach(msg => {
      if (msg.status && msg.status !== 'stable') {
        msg.status = 'stable';
      }
    });
  }

  setLastMessageStable() {
    const msgs = this.messages.getMessages();
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.status && last.status !== 'stable') {
        last.status = 'stable';
        console.log('[WebChatSession.setLastMessageStable] set last message to stable:', last.id);
      }
    }
  }
}

export class WebChatSessionManager {
  private activeSession: WebChatSession | null = null;

  /**
   * 切换当前活跃会话，自动持久化/加载历史消息
   */
  setActiveSession(id: string) {
    // 切换前：停止生成、所有消息变 stable 并保存
    if (this.activeSession) {
      this.activeSession.handleStop();
      this.activeSession.setAllMessagesStable();
      this.activeSession.save();
    }
    // 加载新会话历史
    const chatData = chatStorage.getChatData(id);
    const initialMessages = chatData?.messages || [];
    this.activeSession = new WebChatSession({ chatId: id, llmService, initialMessages });
  }

  getActiveSession(): WebChatSession | null {
    return this.activeSession;
  }
}
