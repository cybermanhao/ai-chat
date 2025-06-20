// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
let currentStream = null;
export class LLMService {
    getDangerouslyAllowBrowser() {
        // 可被 web 端重载
        return false;
    }
    createClient(config) {
        return new OpenAI({
            baseURL: config.baseUrl,
            apiKey: config.apiKey || '',
            dangerouslyAllowBrowser: this.getDangerouslyAllowBrowser()
        });
    }
    formatMessages(messages) {
        const result = [];
        for (const msg of messages) {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            const baseMessage = {
                content,
                ...(msg.name && { name: msg.name })
            };
            let formattedMessage;
            switch (msg.role) {
                case 'system':
                    formattedMessage = { ...baseMessage, role: 'system' };
                    break;
                case 'user':
                    formattedMessage = { ...baseMessage, role: 'user' };
                    break;
                case 'assistant':
                    if ('tool_calls' in msg) {
                        formattedMessage = { ...baseMessage, role: 'assistant', tool_calls: msg.tool_calls };
                    }
                    else {
                        formattedMessage = { ...baseMessage, role: 'assistant' };
                    }
                    break;
                case 'tool':
                    if ('tool_call_id' in msg) {
                        formattedMessage = { ...baseMessage, role: 'tool', tool_call_id: msg.tool_call_id };
                    }
                    else {
                        throw new Error('Tool messages must have tool_call_id');
                    }
                    break;
                default:
                    throw new Error(`Unsupported message role: ${msg.role}`);
            }
            result.push(formattedMessage);
        }
        return result;
    }
    async generate(messages, modelConfig, llmConfig, signal) {
        const client = this.createClient(llmConfig);
        const params = {
            model: llmConfig.model,
            messages: this.formatMessages(messages),
            temperature: modelConfig.temperature,
            max_tokens: modelConfig.maxTokens,
            stream: true,
            ...(llmConfig.tools && { tools: llmConfig.tools }),
            ...(llmConfig.parallelToolCalls && { tool_choice: 'auto' })
        };
        const abortController = new AbortController();
        currentStream = abortController;
        try {
            const timeoutId = setTimeout(() => {
                if (abortController && !abortController.signal.aborted) {
                    abortController.abort('timeout');
                }
            }, 10000);
            const response = await client.chat.completions.create(params, {
                signal: signal || abortController.signal
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            if (error instanceof Error) {
                const enhancedError = new Error(this.getErrorMessage(error));
                enhancedError.name = error.name;
                enhancedError.code = this.getErrorCode(error);
                throw enhancedError;
            }
            throw error;
        }
    }
    getErrorMessage(error) {
        const message = error.message;
        if (error.name === 'AbortError')
            return '请求已被取消';
        if (message.includes('timeout'))
            return '请求超时，服务器响应时间过长';
        if (message.includes('network') || message.includes('ENOTFOUND'))
            return '网络连接错误，请检查您的网络状态';
        if (message.includes('401'))
            return 'API密钥无效或已过期，请检查您的API密钥设置';
        if (message.includes('403'))
            return '没有访问权限，请检查您的API密钥权限';
        if (message.includes('429'))
            return '请求频率过高，请稍后再试';
        return `生成出错: ${message}`;
    }
    getErrorCode(error) {
        if (error.name === 'AbortError')
            return 'ERR_GENERATION_ABORTED';
        const message = error.message.toLowerCase();
        if (message.includes('timeout'))
            return 'ERR_TIMEOUT';
        if (message.includes('network') || message.includes('enotfound'))
            return 'ERR_NETWORK';
        if (message.includes('401') || message.includes('unauthorized'))
            return 'ERR_AUTH';
        if (message.includes('429') || message.includes('rate limit'))
            return 'ERR_RATE_LIMIT';
        if (message.includes('model'))
            return 'ERR_MODEL';
        return 'ERR_API';
    }
    abortCurrentStream() {
        if (currentStream) {
            currentStream.abort();
            currentStream = null;
        }
    }
}
export const getCurrentStream = () => currentStream;
