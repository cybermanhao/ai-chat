import type { ClientNoticeMessage } from '../types/chat';
export declare const ErrorCode: {
    readonly NETWORK_ERROR: "ERR_NETWORK";
    readonly TIMEOUT_ERROR: "ERR_TIMEOUT";
    readonly API_ERROR: "ERR_API";
    readonly AUTH_ERROR: "ERR_AUTH";
    readonly MODEL_ERROR: "ERR_MODEL";
    readonly UNKNOWN_ERROR: "ERR_UNKNOWN";
    readonly GENERATION_ABORTED: "ERR_GENERATION_ABORTED";
};
/**
 * 处理LLM API错误并生成客户端提示消息
 * @param error - 捕获的错误对象
 * @returns 格式化的客户端提示消息
 */
export declare function handleLLMError(error: unknown): ClientNoticeMessage;
//# sourceMappingURL=errorHandler.d.ts.map