// web/src/utils/storage.ts
// 兼容 engine/utils/storage 的导出

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

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

// 兼容原有 persistData/loadPersistedData
export function persistData<T = any>(key: string, data: T, _storage?: StorageLike) {
  (getStorage()).setItem(key, JSON.stringify(data));
}

export function loadPersistedData<T = any>(key: string, _defaultValue?: T, _storage?: StorageLike): T {
  const raw = getStorage().getItem(key);
  if (!raw) return _defaultValue as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return _defaultValue as T;
  }
}

export type Storage = StorageLike;
