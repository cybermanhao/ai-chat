import { describe, it, expect } from 'vitest';
import { useChatRuntimeStore } from '../../store/chatRuntimeStore';

describe('chatRuntimeStore 类型和行为测试', () => {
  it('应能正确设置和获取 runtimeMessages', async () => {
    const store = useChatRuntimeStore.getState();
    // 先插入一条初始消息
    store.runtimeMessages['msg1'] = {
      id: 'msg1',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'stable',
    };
    // updateMessageContent 现在需要对象参数
    store.updateMessageContent({
      messageId: 'msg1',
      content: '内容',
      reasoning_content: '推理',
      tool_content: '工具',
      observation_content: '观察',
      thought_content: '思考',
    });
    await new Promise(r => setTimeout(r, 0));
    const msg = useChatRuntimeStore.getState().runtimeMessages['msg1'];
    // 类型守卫，确保安全访问
    expect(msg).toBeDefined();
    if (msg.role === 'assistant') {
      expect(msg.reasoning_content).toBe('推理');
      expect(msg.tool_content).toBe('工具');
      expect(msg.observation_content).toBe('观察');
      expect(msg.thought_content).toBe('思考');
    }
  });

  it('应能正确设置消息状态', async () => {
    const store = useChatRuntimeStore.getState();
    // 先插入一条初始消息
    store.runtimeMessages['msg1'] = {
      id: 'msg1',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'stable',
    };
    store.setMessageStatus('msg1', 'done');
    await new Promise(r => setTimeout(r, 0));
    const msg = useChatRuntimeStore.getState().runtimeMessages['msg1'];
    expect(msg.status).toBe('done');
  });
});
