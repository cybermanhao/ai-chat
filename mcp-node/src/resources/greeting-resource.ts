import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Greeting 资源的变量类型
 */
export interface GreetingResourceVariables {
  name: string | string[];
}

/**
 * Greeting 资源的模板定义
 */
export const greetingResourceTemplate = new ResourceTemplate("greeting://{name}", { list: undefined });

/**
 * Greeting 资源的元数据
 */
export const greetingResourceMetadata = {
  title: "greeting",
  description: "用于演示的一个资源协议"
};

/**
 * Greeting 资源的处理函数
 */
export async function greetingResourceHandler(
  _uri: URL, 
  variables: { [key: string]: string | string[] }, 
  _extra: any
) {
  console.log(`[MCPServer] greeting resource called, variables:`, variables);
  
  const result = {
    contents: [{ uri: `greeting://${variables.name}`, text: `Hello, ${variables.name}!` }]
  };
  
  console.log(`[MCPServer] greeting resource result:`, result);
  return result;
}
