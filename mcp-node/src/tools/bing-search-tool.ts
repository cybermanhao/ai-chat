/**
 * Bing 搜索工具 - 使用标准 JSON Schema 格式
 */

/**
 * Bing 搜索工具的输入参数类型
 */
export interface BingSearchInput {
  query: string;
  count?: number;
  market?: string;
}

/**
 * Bing 搜索工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const bingSearchSchema = {
  name: "bing_search",
  description: "使用 Bing 搜索引擎搜索网络内容",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        description: "搜索查询"
      },
      count: {
        type: "number",
        minimum: 1,
        maximum: 50,
        default: 10,
        description: "搜索结果数量"
      },
      market: {
        type: "string",
        default: "zh-CN",
        description: "搜索市场/语言"
      }
    },
    required: ["query"]
  }
};

/**
 * Bing 搜索工具的实现函数
 */
export async function bingSearchHandler({ query, count = 10, market = "zh-CN" }: BingSearchInput) {
  console.log(`[MCPServer] bing search tool called, query: "${query}", count: ${count}, market: ${market}`);
  
  try {
    // 注意：这里需要 Bing Search API 密钥
    // 在实际使用中，应该从环境变量获取 API 密钥
    const apiKey = process.env.BING_SEARCH_API_KEY;
    
    if (!apiKey) {
      return {
        content: [
          { 
            type: "text" as const, 
            text: "❌ 错误：未配置 Bing Search API 密钥。请设置环境变量 BING_SEARCH_API_KEY。\n\n" +
                  "获取方式：\n" +
                  "1. 访问 https://portal.azure.com/\n" +
                  "2. 创建 Bing Search v7 资源\n" +
                  "3. 获取 API 密钥\n" +
                  "4. 设置环境变量：BING_SEARCH_API_KEY=your_api_key"
          }
        ]
      };
    }
    
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${count}&mkt=${market}`;
    
    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Bing API 请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.webPages || !data.webPages.value || data.webPages.value.length === 0) {
      return {
        content: [
          { 
            type: "text" as const, 
            text: `🔍 搜索查询："${query}"\n\n❌ 未找到相关结果。`
          }
        ]
      };
    }
    
    // 格式化搜索结果
    const results = data.webPages.value.slice(0, count).map((item: any, index: number) => {
      return `${index + 1}. **${item.name}**\n   ${item.snippet}\n   🔗 ${item.url}\n`;
    }).join('\n');
    
    const totalResults = data.webPages.totalEstimatedMatches || 0;
    
    const resultText = `🔍 Bing 搜索结果："${query}"\n` +
                      `📊 找到约 ${totalResults.toLocaleString()} 个结果，显示前 ${Math.min(count, data.webPages.value.length)} 个：\n\n` +
                      results;
    
    const response_obj = {
      content: [
        { 
          type: "text" as const, 
          text: resultText
        }
      ]
    };
    
    console.log(`[MCPServer] bing search completed, found ${data.webPages.value.length} results`);
    return response_obj;
    
  } catch (error) {
    console.error(`[MCPServer] bing search error:`, error);
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: `❌ Bing 搜索失败：${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}
