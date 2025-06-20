// 注意：engine/hooks/useModelConfig.ts 仅为多端纯逻辑定义，web 端请实现自己的 useModelConfig。
export const useModelConfig = () => {
    throw new Error('请在 web 端实现 useModelConfig，勿直接复用 engine/hooks/useModelConfig');
};
