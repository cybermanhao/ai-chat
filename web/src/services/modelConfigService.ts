import type { ModelConfig } from '@/types/model';

export interface ServiceResult {
  success: boolean;
  error?: string;
}

export interface UpdateToolParams {
  toolId: string;
  enabled: boolean;
}

class ModelConfigService {
  private baseUrl = '/api/modelConfig';

  async updateTemperature(temperature: number): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/temperature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature }),
      });
      return { success: response.ok, error: response.ok ? undefined : await response.text() };
    } catch (error) {
      console.error('Failed to update temperature:', error);
      return { success: false, error: String(error) };
    }
  }

  async updateContextBalance(contextBalance: number): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/contextBalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextBalance }),
      });
      return { success: response.ok, error: response.ok ? undefined : await response.text() };
    } catch (error) {
      console.error('Failed to update context balance:', error);
      return { success: false, error: String(error) };
    }
  }

  async updateSystemPrompt(systemPrompt: string): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/systemPrompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt }),
      });
      return { success: response.ok, error: response.ok ? undefined : await response.text() };
    } catch (error) {
      console.error('Failed to update system prompt:', error);
      return { success: false, error: String(error) };
    }
  }

  async toggleMultiTools(enabled: boolean): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/multiTools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      return { success: response.ok, error: response.ok ? undefined : await response.text() };
    } catch (error) {
      console.error('Failed to toggle multi-tools:', error);
      return { success: false, error: String(error) };
    }
  }

  async toggleTool(toolId: string, enabled: boolean): Promise<ServiceResult> {
    try {
      const response = await fetch(`${this.baseUrl}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, enabled }),
      });
      return { success: response.ok, error: response.ok ? undefined : await response.text() };
    } catch (error) {
      console.error('Failed to toggle tool:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const modelConfigService = new ModelConfigService();
