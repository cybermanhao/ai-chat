// 性能测试：验证差分更新机制的效果
import { createStreamingPatch } from './messageDiff';
import type { EnrichedMessage } from '@engine/types/chat';

/**
 * 运行性能测试
 */
export function runPerformanceTests() {
  console.log('🚀 开始运行差分更新性能测试...');
  
  // 测试 1: 流式内容增长性能
  testStreamingContentGrowth();
  
  // 测试 2: 无变化检测性能
  testNoChangeDetection();
  
  // 测试 3: 大量小幅更新性能
  testManySmallUpdates();
  
  console.log('✅ 性能测试完成!');
}

function testStreamingContentGrowth() {
  console.log('\n📊 测试 1: 流式内容增长性能');
  
  const start = performance.now();
  let current: Partial<EnrichedMessage> = { role: 'assistant' as const, content: '', id: 'test-1' };
  
  // 模拟流式内容增长
  const chunks = [
    'Hello',
    'Hello world',
    'Hello world!',
    'Hello world! How',
    'Hello world! How are',
    'Hello world! How are you',
    'Hello world! How are you today?'
  ];
  
  let updateCount = 0;
  
  for (const chunk of chunks) {
    const updated = { ...current, content: chunk };
    const patch = createStreamingPatch(current, updated);
    
    if (patch.hasChanges) {
      current = { ...current, ...patch.changes };
      updateCount++;
    }
  }
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`  ⏱️  处理 ${chunks.length} 个 chunk 耗时: ${duration.toFixed(2)}ms`);
  console.log(`  🔄 实际更新次数: ${updateCount}/${chunks.length}`);
  console.log(`  📝 最终内容: "${current.content}"`);
}

function testNoChangeDetection() {
  console.log('\n📊 测试 2: 无变化检测性能');
  
  const start = performance.now();
  const message: Partial<EnrichedMessage> = { role: 'assistant' as const, content: 'Same content', id: 'test-2' };
  
  let checkedCount = 0;
  let changeCount = 0;
  
  // 模拟100次相同内容的检查
  for (let i = 0; i < 100; i++) {
    const patch = createStreamingPatch(message, message);
    checkedCount++;
    if (patch.hasChanges) {
      changeCount++;
    }
  }
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`  ⏱️  ${checkedCount} 次无变化检查耗时: ${duration.toFixed(2)}ms`);
  console.log(`  🔄 检测到的变化次数: ${changeCount} (应该为 0)`);
  console.log(`  📈 平均每次检查: ${(duration / checkedCount).toFixed(3)}ms`);
}

function testManySmallUpdates() {
  console.log('\n📊 测试 3: 大量小幅更新性能');
  
  const start = performance.now();
  let current: Partial<EnrichedMessage> = { role: 'assistant' as const, content: '', id: 'test-3' };
  
  let updateCount = 0;
  let totalChanges = 0;
  
  // 模拟100次小幅增长
  for (let i = 0; i < 100; i++) {
    const updated = { ...current, content: current.content + 'a' };
    const patch = createStreamingPatch(current, updated);
    
    if (patch.hasChanges) {
      current = { ...current, ...patch.changes };
      updateCount++;
      totalChanges += Object.keys(patch.changes).length;
    }
  }
  
  const end = performance.now();
  const duration = end - start;
  
  console.log(`  ⏱️  100 次小幅更新耗时: ${duration.toFixed(2)}ms`);
  console.log(`  🔄 实际更新次数: ${updateCount}/100`);
  console.log(`  📊 总变更字段数: ${totalChanges}`);
  console.log(`  📝 最终内容长度: ${current.content?.length || 0} 字符`);
  console.log(`  📈 平均每次更新: ${(duration / updateCount).toFixed(3)}ms`);
}

// 导出测试函数，可在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).runPerformanceTests = runPerformanceTests;
}
