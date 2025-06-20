// 类型守卫：判断是否为助手消息
export function isAssistantMessage(msg) {
    return msg.role === 'assistant';
}
// 类型守卫：判断是否为客户端提示消息
export function isClientNoticeMessage(msg) {
    return msg.role === 'client-notice';
}
