import { testToolSchema, testToolHandler } from "./test-tool.js";
import { weatherToolSchema, weatherToolHandler } from "./weather-tool.js";
import { mathToolSchema, mathToolHandler } from "./math-tool.js";
import { calculatorToolSchema, calculatorToolHandler } from "./calculator-tool.js";
import { bingSearchSchema, bingSearchHandler } from "./bing-search-tool.js";
import { dateTimeToolSchema, dateTimeToolHandler } from "./datetime-tool.js";
import { textToolSchema, textToolHandler } from "./text-tool.js";

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

/**
 * 获取所有 tools 目录下的工具（schema+handler）
 */
export function getAllBuiltinTools() {
  return [
    {
      name: weatherToolSchema.name,
      description: weatherToolSchema.description,
      inputSchema: weatherToolSchema.inputSchema,
      handler: weatherToolHandler
    },
    {
      name: calculatorToolSchema.name,
      description: calculatorToolSchema.description,
      inputSchema: calculatorToolSchema.inputSchema,
      handler: calculatorToolHandler
    },
    {
      name: mathToolSchema.name,
      description: mathToolSchema.description,
      inputSchema: mathToolSchema.inputSchema,
      handler: mathToolHandler
    },
    {
      name: testToolSchema.name,
      description: testToolSchema.description,
      inputSchema: testToolSchema.inputSchema,
      handler: testToolHandler
    },
    {
      name: bingSearchSchema.name,
      description: bingSearchSchema.description,
      inputSchema: bingSearchSchema.inputSchema,
      handler: bingSearchHandler
    },
    {
      name: dateTimeToolSchema.name,
      description: dateTimeToolSchema.description,
      inputSchema: dateTimeToolSchema.inputSchema,
      handler: dateTimeToolHandler
    },
    {
      name: textToolSchema.name,
      description: textToolSchema.description,
      inputSchema: textToolSchema.inputSchema,
      handler: textToolHandler
    }
  ];
}
