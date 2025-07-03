// 差分更新机制的单元测试
import { createStreamingPatch } from '../messageDiff';
import type { EnrichedMessage } from '@engine/types/chat';
import { describe, test, expect } from 'vitest';
// // 测试智能增量更新 - 已简化，不再使用复杂的差分检测
// describe('shouldUpdateStreamContent', () => {
//   test('空内容到有内容应该更新', () => {
//     expect(shouldUpdateStreamContent('', 'Hello')).toBe(true);
//   });

//   test('内容增长应该更新', () => {
//     expect(shouldUpdateStreamContent('Hello', 'Hello world')).toBe(true);
//   });

//   test('相同内容不应该更新', () => {
//     expect(shouldUpdateStreamContent('Hello', 'Hello')).toBe(false);
//   });

//   test('内容完全不同应该更新', () => {
//     expect(shouldUpdateStreamContent('Hello', 'Goodbye')).toBe(true);
//   });

//   test('新内容为空不应该更新', () => {
//     expect(shouldUpdateStreamContent('Hello', '')).toBe(false);
//   });

//   test('内容缩短但不以原内容开头应该更新', () => {
//     expect(shouldUpdateStreamContent('Hello world', 'Hi')).toBe(true);
//   });
// });

// 测试流式补丁创建
describe('createStreamingPatch', () => {
  test('内容增长应该生成补丁', () => {
    const current = { role: 'assistant' as const, content: 'Hello' };
    const updated = { role: 'assistant' as const, content: 'Hello world' };
    
    const patch = createStreamingPatch(current, updated);
    
    expect(patch.hasChanges).toBe(true);
    expect(patch.changes.content).toBe('Hello world');
  });

  test('reasoning_content 增长应该生成补丁', () => {
    const current = { 
      role: 'assistant' as const, 
      content: 'Answer', 
      reasoning_content: 'Think' 
    };
    const updated = { 
      role: 'assistant' as const, 
      content: 'Answer', 
      reasoning_content: 'Thinking more' 
    };
    
    const patch = createStreamingPatch(current, updated);
    
    expect(patch.hasChanges).toBe(true);
    expect((patch.changes as any).reasoning_content).toBe('Thinking more');
    expect(patch.changes.content).toBeUndefined(); // content 没有变化
  });

  test('相同内容不应该生成补丁', () => {
    const current = { role: 'assistant' as const, content: 'Hello' };
    const updated = { role: 'assistant' as const, content: 'Hello' };
    
    const patch = createStreamingPatch(current, updated);
    
    expect(patch.hasChanges).toBe(false);
  });

  test('timestamp 变化应该生成补丁', () => {
    const current = { 
      role: 'assistant' as const, 
      content: 'Hello',
      timestamp: 1000
    };
    const updated = { 
      role: 'assistant' as const, 
      content: 'Hello',
      timestamp: 2000
    };
    
    const patch = createStreamingPatch(current, updated);
    
    expect(patch.hasChanges).toBe(true);
    expect(patch.changes.timestamp).toBe(2000);
    expect(patch.changes.content).toBeUndefined(); // content 没有变化
  });

  test('流式更新中没有 timestamp 不应该更新 timestamp', () => {
    const current = { 
      role: 'assistant' as const, 
      content: 'Hello',
      timestamp: 1000
    };
    const updated = { 
      role: 'assistant' as const, 
      content: 'Hello world'
      // 注意：没有 timestamp，模拟流式更新 chunk
    };
    
    const patch = createStreamingPatch(current, updated);
    
    expect(patch.hasChanges).toBe(true);
    expect(patch.changes.content).toBe('Hello world');
    expect(patch.changes.timestamp).toBeUndefined(); // timestamp 不应该变化
  });
});

// 性能测试
describe('Performance Tests', () => {
  test('大量小幅更新的性能', () => {
    const start = performance.now();
    
    let current: Partial<EnrichedMessage> = { role: 'assistant' as const, content: '' };
    
    // 模拟100次增量更新
    for (let i = 0; i < 100; i++) {
      const updated = { role: 'assistant' as const, content: (current.content || '') + 'a' };
      const patch = createStreamingPatch(current, updated);
      
      if (patch.hasChanges) {
        current = { ...current, ...patch.changes };
      }
    }
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`100次增量更新耗时: ${duration}ms`);
    expect(duration).toBeLessThan(10); // 应该在10ms内完成
    expect(current.content?.length || 0).toBe(100);
  });

  test('无变化情况下的性能', () => {
    const start = performance.now();
    
    const current = { role: 'assistant' as const, content: 'Same content' };
    
    // 模拟100次无变化的更新检查
    for (let i = 0; i < 100; i++) {
      const updated = { role: 'assistant' as const, content: 'Same content' };
      const patch = createStreamingPatch(current, updated);
      
      expect(patch.hasChanges).toBe(false);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    console.log(`100次无变化检查耗时: ${duration}ms`);
    expect(duration).toBeLessThan(5); // 应该在5ms内完成
  });
});

export {};
