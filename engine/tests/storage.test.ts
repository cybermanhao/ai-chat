import { describe, it, expect, beforeEach } from 'vitest';
import { memoryStorage, getStorage, defaultStorage, StorageLike } from '../utils/storage';

const TEST_KEY = 'test-key';
const TEST_VALUE = 'test-value';

describe('memoryStorage', () => {
  beforeEach(() => {
    memoryStorage.removeItem(TEST_KEY);
  });

  it('should set and get item', () => {
    memoryStorage.setItem(TEST_KEY, TEST_VALUE);
    expect(memoryStorage.getItem(TEST_KEY)).toBe(TEST_VALUE);
  });

  it('should remove item', () => {
    memoryStorage.setItem(TEST_KEY, TEST_VALUE);
    memoryStorage.removeItem(TEST_KEY);
    expect(memoryStorage.getItem(TEST_KEY)).toBeNull();
  });
});

describe('getStorage', () => {
  it('should return memoryStorage in non-browser env', () => {
    // 模拟 node 环境
    expect(getStorage()).toBe(memoryStorage);
  });
});

describe('defaultStorage', () => {
  it('should be memoryStorage', () => {
    expect(defaultStorage).toBe(memoryStorage);
  });
});
