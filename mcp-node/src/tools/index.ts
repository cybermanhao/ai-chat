// 工具导出
export * from "./test-tool.js";
export * from "./weather-tool.js";
export * from "./math-tool.js";
export * from "./calculator-tool.js";
export * from "./bing-search-tool.js";
export * from "./datetime-tool.js";
export * from "./text-tool.js";

// 工具列表
export const availableTools = [
  "test",
  "weather", 
  "math",
  "calculator",
  "bing_search",
  "datetime",
  "text_processor"
] as const;

export type AvailableToolName = typeof availableTools[number];
