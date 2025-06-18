// 定义基础存储接口
export interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

// LocalStorage 实现
export class LocalStorage implements Storage {
  getItem(key: string): string | null {
    return localStorage.getItem(key)
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value)
  }

  removeItem(key: string): void {
    localStorage.removeItem(key)
  }
}

// 默认使用 localStorage
export const defaultStorage = new LocalStorage()

// 通用的持久化助手函数
export function persistData<T>(key: string, data: T, storage: Storage = defaultStorage): void {
  storage.setItem(key, JSON.stringify(data))
}

export function loadPersistedData<T>(key: string, defaultValue: T, storage: Storage = defaultStorage): T {
  const stored = storage.getItem(key)
  if (!stored) return defaultValue
  try {
    return JSON.parse(stored) as T
  } catch {
    return defaultValue
  }
}
