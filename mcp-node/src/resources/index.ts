// 资源导出
export * from "./greeting-resource.js";

// 资源列表
export const availableResources = [
  "greeting"
] as const;

export type AvailableResourceName = typeof availableResources[number];
