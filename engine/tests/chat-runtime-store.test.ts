import { describe, it, expect } from 'vitest';
import { chatRuntimeStoreDefinition } from '../store/chatRuntimeStore';
import type { RuntimeMessage } from '../types/chat';

function createTestStore() {
  let state: { runtimeMessages: Record<string, RuntimeMessage> } = { runtimeMessages: {} };
  const set = (updater: any) => {
    if (typeof updater === 'function') {
      state = { ...state, ...updater(state) };
    } else {
      state = { ...state, ...updater };
    }
  };
  const get = () => state;
  return { ...chatRuntimeStoreDefinition(set, get), getState: () => state, set };
}

describe('chatRuntimeStore 类型和行为测试', () => {
  it('应能正确设置和获取 runtimeMessages', async () => {
    const store = createTestStore();
    // 用 set 方法初始化 runtimeMessages
    store.set({
      runtimeMessages: {
        msg1: {
          id: 'msg1',
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'stable',
        } as RuntimeMessage
      }
    });
    store.updateMessageContent({
      messageId: 'msg1',
      content: '内容',
      reasoning_content: '推理',
      tool_content: '工具',
      observation_content: '观察',
      thought_content: '思考',
    });
    await new Promise(r => setTimeout(r, 0));
    const msg = store.getState().runtimeMessages['msg1'] as RuntimeMessage;
    expect(msg).toBeDefined();
    if (msg.role === 'assistant') {
      expect(msg.reasoning_content).toBe('推理');
      expect(msg.tool_content).toBe('工具');
      expect(msg.observation_content).toBe('观察');
      expect(msg.thought_content).toBe('思考');
    }
  });

  it('应能正确设置消息状态', async () => {
    const store = createTestStore();
    store.set({
      runtimeMessages: {
        msg1: {
          id: 'msg1',
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          status: 'stable',
        } as RuntimeMessage
      }
    });
    store.setMessageStatus('msg1', 'done');
    await new Promise(r => setTimeout(r, 0));
    const msg = store.getState().runtimeMessages['msg1'] as RuntimeMessage;
    expect(msg.status).toBe('done');
  });
});