// 通用存储抽象，适用于多端同构
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// 修正 memoryStorage 类型实现，避免 _data 属性类型报错
const memoryData: Record<string, string> = {};
export const memoryStorage: StorageLike = {
  getItem(key) { return memoryData[key] || null; },
  setItem(key, value) { memoryData[key] = value; },
  removeItem(key) { delete memoryData[key]; },
};

export function getStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return memoryStorage;
}

export const defaultStorage = memoryStorage;
