// 纯逻辑消息类型与 Deepseek 字段测试，适用于多端 engine
import { describe, it, expect } from 'vitest';
import { isAssistantMessage, isClientNoticeMessage } from '../types/chat';
// 构造消息对象，测试 Deepseek 字段
describe('RuntimeMessage Deepseek 字段与行为', () => {
    it('应能识别包含 Deepseek 字段的 assistant 消息', () => {
        const msg = {
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
        expect(isAssistantMessage(msg)).toBe(true);
        if (isAssistantMessage(msg)) {
            expect(msg.reasoning_content).toBe('推理');
            expect(msg.tool_content).toBe('工具');
            expect(msg.observation_content).toBe('观察');
            expect(msg.thought_content).toBe('思考');
        }
    });
    it('应能合并 Deepseek 字段', () => {
        const msg = {
            id: '2',
            role: 'assistant',
            content: 'hello',
            timestamp: Date.now(),
            status: 'generating',
            reasoning_content: '初始推理'
        };
        // 模拟合并
        const updated = {
            ...msg,
            content: 'hello world',
            reasoning_content: '新推理',
            tool_content: '新工具'
        };
        expect(isAssistantMessage(updated)).toBe(true);
        if (isAssistantMessage(updated)) {
            expect(updated.content).toBe('hello world');
            expect(updated.reasoning_content).toBe('新推理');
            expect(updated.tool_content).toBe('新工具');
        }
    });
    it('应能识别客户端提示消息', () => {
        const msg = {
            id: 'notice-1',
            role: 'client-notice',
            content: '错误提示',
            timestamp: Date.now(),
            noticeType: 'error',
            errorCode: 'ERR_TEST',
            status: 'stable'
        };
        expect(isClientNoticeMessage(msg)).toBe(true);
        if (isClientNoticeMessage(msg)) {
            expect(msg.noticeType).toBe('error');
            expect(msg.errorCode).toBe('ERR_TEST');
        }
    });
});
