// 消息差分更新工具 - 简化版本
// 不再使用复杂的差分检测，直接累加更新所有提供的字段
// 每个 chunk 都可以筛选出需要更新的属性，直接在 reasoning_content 等字段上累加
import type { EnrichedMessage } from '@engine/types/chat';

export interface MessageDiff {
  hasChanges: boolean;
  changes: Partial<EnrichedMessage>;
}

// /**
//  * 计算两个消息对象之间的差异
//  * @param current 当前消息对象
//  * @param updated 更新后的消息对象
//  * @returns 差分结果，只包含发生变化的字段
//  */
// export function calculateMessageDiff(
//   current: Partial<EnrichedMessage>,
//   updated: Partial<EnrichedMessage>
// ): MessageDiff {
//   const changes: Partial<EnrichedMessage> = {};
//   let hasChanges = false;

//   // 检查基础字段
//   const baseFields: (keyof EnrichedMessage)[] = [
//     'content',
//     'state',
//     'usage',
//     'name'
//   ];

//   for (const field of baseFields) {
//     if (updated[field] !== undefined && current[field] !== updated[field]) {
//       (changes as any)[field] = updated[field];
//       hasChanges = true;
//     }
//   }

//   // 检查 AssistantMessage 特有字段
//   if (current.role === 'assistant' && updated.role === 'assistant') {
//     const assistantFields = ['reasoning_content', 'prefix'] as const;
//     for (const field of assistantFields) {
//       if ((updated as any)[field] !== undefined && (current as any)[field] !== (updated as any)[field]) {
//         (changes as any)[field] = (updated as any)[field];
//         hasChanges = true;
//       }
//     }
//   }

//   return { hasChanges, changes };
// }

// /**
//  * 智能增量更新：只有内容实际增长时才更新
//  * 这对于流式生成特别有用，避免重复更新相同内容
//  * @param current 当前消息内容
//  * @param updated 更新后的消息内容
//  * @returns 是否应该更新
//  */
// export function shouldUpdateStreamContent(current: string, updated: string): boolean {
//   // 如果新内容为空，不更新
//   if (!updated) return false;
//   
//   // 如果当前内容为空，直接更新
//   if (!current) return true;
//   
//   // 如果新内容比当前内容长，且包含当前内容，则更新
//   if (updated.length > current.length && updated.startsWith(current)) {
//     // 调试日志（可在生产环境中禁用）
//     // console.log('[shouldUpdateStreamContent] 检测到内容增长:', {
//     //   currentLength: current.length,
//     //   updatedLength: updated.length,
//     //   shouldUpdate: true
//     // });
//     return true;
//   }
//   
//   // 如果内容完全不同，也更新（处理编辑情况）
//   if (updated !== current) {
//     // 调试日志（可在生产环境中禁用）
//     // console.log('[shouldUpdateStreamContent] 检测到内容变化:', {
//     //   currentLength: current.length,
//     //   updatedLength: updated.length,
//     //   shouldUpdate: true
//     // });
//     return true;
//   }
//   
//   return false;
// }

/**
 * 简化的流式更新补丁创建
 * 直接累加更新，不做复杂的差分检测
 * @param current 当前消息对象
 * @param updated 流式更新的消息对象
 * @returns 简单的补丁，包含所有新提供的字段
 */
export function createStreamingPatch(
  current: Partial<EnrichedMessage>,
  updated: Partial<EnrichedMessage>
): MessageDiff {
  const changes: Partial<EnrichedMessage> = {};
  let hasChanges = false;

  // 基本字段直接检查更新
  const basicFields: (keyof EnrichedMessage)[] = [
    'content',
    'state',
    'usage',
    'name'
  ];

  for (const field of basicFields) {
    if (updated[field] !== undefined && updated[field] !== current[field]) {
      (changes as any)[field] = updated[field];
      hasChanges = true;
    }
  }

  // 特殊处理 reasoning_content（assistant 消息特有字段）
  if (updated.role === 'assistant' || current.role === 'assistant') {
    const currentReasoning = (current as any).reasoning_content;
    const updatedReasoning = (updated as any).reasoning_content;
    
    if (updatedReasoning !== undefined && updatedReasoning !== currentReasoning) {
      (changes as any).reasoning_content = updatedReasoning;
      hasChanges = true;
    }
  }

  // timestamp 只在明确提供且不同时更新
  if (updated.timestamp !== undefined && updated.timestamp !== current.timestamp) {
    changes.timestamp = updated.timestamp;
    hasChanges = true;
  }

  return { hasChanges, changes };
}
