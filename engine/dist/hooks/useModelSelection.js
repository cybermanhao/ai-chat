// 注意：engine/hooks/useModelSelection.ts 仅为多端纯逻辑定义，web 端请实现自己的 useModelSelection。
export const useModelSelection = () => {
    throw new Error('请在 web 端实现 useModelSelection，勿直接复用 engine/hooks/useModelSelection');
};
