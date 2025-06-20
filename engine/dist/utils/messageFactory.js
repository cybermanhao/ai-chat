// 纯函数工厂，兼容多端 store
export function createUserMessage(content, status, extra = {}) {
    return {
        id: extra.id || '',
        timestamp: Date.now(),
        content,
        role: 'user',
        status,
        ...extra,
    };
}
export function createAssistantMessage(content, status, extra = {}) {
    return {
        id: extra.id || '',
        timestamp: Date.now(),
        content,
        role: 'assistant',
        status,
        ...extra,
    };
}
export function createSystemMessage(content, extra = {}) {
    return {
        id: extra.id || '',
        timestamp: Date.now(),
        content,
        role: 'system',
        ...extra,
    };
}
// createMessage 对象工厂，兼容 web 端
export const createMessage = {
    user: (content, status = 'stable') => ({
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
        status
    }),
    assistant: (content = '', status = 'connecting') => ({
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
        status
    }),
    system: (content) => ({
        id: `sys-${Date.now()}`,
        role: 'system',
        content,
        timestamp: Date.now(),
        status: 'stable'
    }),
    clientNotice: (content, noticeType = 'error', errorCode) => ({
        id: `notice-${Date.now()}`,
        role: 'client-notice',
        content,
        timestamp: Date.now(),
        status: 'stable',
        noticeType,
        errorCode
    })
};
