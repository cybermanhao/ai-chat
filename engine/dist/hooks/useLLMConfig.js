// 注意：engine/hooks/useLLMConfig.ts 仅为多端纯逻辑定义，web 端请实现自己的 useLLMConfig。
export const useLLMConfig = () => {
    throw new Error('请在 web 端实现 useLLMConfig，勿直接复用 engine/hooks/useLLMConfig');
};
