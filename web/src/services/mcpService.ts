export interface MCPResponse<T = unknown> {
  data: T
  error?: string
}

class MCPService {
  private baseUrl: string = ''

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url
  }

  private async fetch<T>(resource: string, init?: RequestInit): Promise<MCPResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${resource}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // 获取可用mcp工具列表
  async listTools(): Promise<MCPResponse<Array<{ name: string; description: string }>>> {
    return this.fetch<Array<{ name: string; description: string }>>('/list-tools')
  }

  // 调用问候API
  async getGreeting(name: string): Promise<MCPResponse<string>> {
    return this.fetch<string>(`/greeting/${encodeURIComponent(name)}`)
  }

  // 调用翻译API
  async translate(text: string): Promise<MCPResponse<string>> {
    return this.fetch<string>('/translate', {
      method: 'POST',
      body: JSON.stringify({ message: text }),
    })
  }

  // 调用天气API
  async getWeather(cityCode: number): Promise<MCPResponse<string>> {
    return this.fetch<string>('/weather', {
      method: 'POST',
      body: JSON.stringify({ city_code: cityCode }),
    })
  }
}

export const mcpService = new MCPService()
