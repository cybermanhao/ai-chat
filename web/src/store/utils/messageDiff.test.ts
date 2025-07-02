// 测试差分更新机制
import { createStreamingPatch, shouldUpdateStreamContent } from '../utils/messageDiff';
import type { EnrichedMessage } from '@engine/types/chat';

// 简单的测试用例
const testCases = [
  {
    name: '初始内容为空，添加新内容',
    current: { content: '' } as Partial<EnrichedMessage>,
    updated: { content: 'Hello' } as Partial<EnrichedMessage>,
    expectedHasChanges: true,
    expectedContent: 'Hello'
  },
  {
    name: '内容增长（流式追加）',
    current: { content: 'Hello' } as Partial<EnrichedMessage>,
    updated: { content: 'Hello world' } as Partial<EnrichedMessage>,
    expectedHasChanges: true,
    expectedContent: 'Hello world'
  },
  {
    name: '内容相同，无变化',
    current: { content: 'Hello world' } as Partial<EnrichedMessage>,
    updated: { content: 'Hello world' } as Partial<EnrichedMessage>,
    expectedHasChanges: false
  },
  {
    name: '添加 reasoning_content',
    current: { content: 'Hello', role: 'assistant' } as Partial<EnrichedMessage>,
    updated: { content: 'Hello', reasoning_content: 'Thinking...', role: 'assistant' } as Partial<EnrichedMessage>,
    expectedHasChanges: true,
    expectedReasoning: 'Thinking...'
  },
  {
    name: 'reasoning_content 增长',
    current: { content: 'Hello', reasoning_content: 'Thinking', role: 'assistant' } as Partial<EnrichedMessage>,
    updated: { content: 'Hello', reasoning_content: 'Thinking about this...', role: 'assistant' } as Partial<EnrichedMessage>,
    expectedHasChanges: true,
    expectedReasoning: 'Thinking about this...'
  }
];

// 运行测试
function runTests() {
  console.log('🧪 开始测试差分更新机制...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  testCases.forEach((testCase, index) => {
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    
    const result = createStreamingPatch(testCase.current, testCase.updated);
    
    // 检查是否有变化
    const hasChangesCorrect = result.hasChanges === testCase.expectedHasChanges;
    if (!hasChangesCorrect) {
      console.log(`  ❌ hasChanges 不符合预期: 期望 ${testCase.expectedHasChanges}, 实际 ${result.hasChanges}`);
      return;
    }
    
    // 检查内容变化
    if (testCase.expectedContent !== undefined) {
      const contentCorrect = result.changes.content === testCase.expectedContent;
      if (!contentCorrect) {
        console.log(`  ❌ content 不符合预期: 期望 "${testCase.expectedContent}", 实际 "${result.changes.content}"`);
        return;
      }
    }
    
    // 检查 reasoning_content 变化
    if (testCase.expectedReasoning !== undefined) {
      const reasoningCorrect = (result.changes as any).reasoning_content === testCase.expectedReasoning;
      if (!reasoningCorrect) {
        console.log(`  ❌ reasoning_content 不符合预期: 期望 "${testCase.expectedReasoning}", 实际 "${(result.changes as any).reasoning_content}"`);
        return;
      }
    }
    
    console.log(`  ✅ 通过`);
    passedTests++;
  });
  
  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！差分更新机制工作正常');
  } else {
    console.log('⚠️ 部分测试失败，请检查差分更新逻辑');
  }
  
  // 测试 shouldUpdateStreamContent 函数
  console.log('\n🧪 测试 shouldUpdateStreamContent 函数...');
  const streamTests = [
    { current: '', updated: 'Hello', expected: true, name: '空内容到有内容' },
    { current: 'Hello', updated: 'Hello world', expected: true, name: '内容增长' },
    { current: 'Hello world', updated: 'Hello world', expected: false, name: '内容相同' },
    { current: 'Hello', updated: '', expected: false, name: '新内容为空' },
    { current: 'Hello', updated: 'Hi', expected: true, name: '内容完全不同' }
  ];
  
  let streamPassedTests = 0;
  streamTests.forEach((test) => {
    const result = shouldUpdateStreamContent(test.current, test.updated);
    if (result === test.expected) {
      console.log(`  ✅ ${test.name}: 通过`);
      streamPassedTests++;
    } else {
      console.log(`  ❌ ${test.name}: 期望 ${test.expected}, 实际 ${result}`);
    }
  });
  
  console.log(`\n📊 shouldUpdateStreamContent 测试结果: ${streamPassedTests}/${streamTests.length} 通过`);
}

// 导出测试函数供开发者调用
export { runTests };

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
  // Node.js 环境
  runTests();
}
