export interface LLM {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  provider: string;
  isOpenAICompatible: boolean;
  description: string;
  website: string;
  userToken: string;
  userModel: string;
}
