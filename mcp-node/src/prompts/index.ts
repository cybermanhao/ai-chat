// 提示词导出
export * from "./translate-prompt.js";

// 提示词列表
export const availablePrompts = [
  "translate"
] as const;

export type AvailablePromptName = typeof availablePrompts[number];
