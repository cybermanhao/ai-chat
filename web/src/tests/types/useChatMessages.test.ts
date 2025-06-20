// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useChatMessages } from '@/hooks/useChatMessages';
import type { RuntimeMessage } from '@/types/chat';
import { isAssistantMessage, isClientNoticeMessage } from '@/types/chat';

// Mock ChatStorageService to avoid actual storage
vi.mock('@/services/chatStorage', () => ({
  ChatStorageService: class {
    getChatData() { return { messages: [], info: {}, settings: {} }; }
    saveChatData() {}
  }
}));

const chatId = 'test-chat';

describe('useChatMessages Deepseek 字段与行为', () => {
  beforeEach(() => {
    // 清理 localStorage 或其他副作用
    window.localStorage.clear();
  });

  it('应能添加包含 Deepseek 字段的消息', () => {
    const { result } = renderHook(() => useChatMessages(chatId));
    const msg: RuntimeMessage = {
      id: '1',
      role: 'assistant',
      content: 'hi',
      timestamp: Date.now(),
      status: 'generating',
      reasoning_content: '推理',
      tool_content: '工具',
      observation_content: '观察',
      thought_content: '思考'
    };
    act(() => {
      result.current.addMessage(msg);
    });
    const m = result.current.messages[0];
    expect(isAssistantMessage(m)).toBe(true);
    if (isAssistantMessage(m)) {
      expect(m.reasoning_content).toBe('推理');
      expect(m.tool_content).toBe('工具');
      expect(m.observation_content).toBe('观察');
      expect(m.thought_content).toBe('思考');
    }
  });

  it('updateLastMessage 应能正确合并 Deepseek 字段', () => {
    const { result } = renderHook(() => useChatMessages(chatId));
    const msg: RuntimeMessage = {
      id: '2',
      role: 'assistant',
      content: 'hello',
      timestamp: Date.now(),
      status: 'generating',
      reasoning_content: '初始推理'
    };
    act(() => {
      result.current.addMessage(msg);
      result.current.updateLastMessage({ content: 'hello world', reasoning_content: '新推理', tool_content: '新工具' });
    });
    const m = result.current.messages[0];
    expect(isAssistantMessage(m)).toBe(true);
    if (isAssistantMessage(m)) {
      expect(m.content).toBe('hello world');
      expect(m.reasoning_content).toBe('新推理');
      expect(m.tool_content).toBe('新工具');
    }
  });

  it('addClientNotice 应能插入客户端提示消息', () => {
    const { result } = renderHook(() => useChatMessages(chatId));
    act(() => {
      result.current.addClientNotice('错误提示', 'error', 'ERR_TEST');
    });
    const m = result.current.messages[0];
    expect(isClientNoticeMessage(m)).toBe(true);
    if (isClientNoticeMessage(m)) {
      expect(m.noticeType).toBe('error');
      expect(m.errorCode).toBe('ERR_TEST');
    }
  });
});
