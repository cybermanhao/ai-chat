import { z } from "zod";

/**
 * Translate 提示词的输入参数类型
 */
export interface TranslatePromptInput {
  message: string;
}

/**
 * Translate 提示词的 Schema 定义
 */
export const translatePromptSchema = {
  title: "translate",
  description: "进行翻译的prompt",
  argsSchema: { message: z.string() }
};

/**
 * Translate 提示词的实现函数
 */
export async function translatePromptHandler({ message }: { message: string }) {
  console.log(`[MCPServer] translate prompt called, message:`, message);
  
  const result = {
    messages: [
      {
        role: "user" as const,
        content: { type: "text" as const, text: `请将下面的话语翻译成中文：\n\n${message}` }
      }
    ]
  };
  
  console.log(`[MCPServer] translate prompt result:`, result);
  return result;
}
