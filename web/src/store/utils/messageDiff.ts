// 消息差分更新工具
import type { EnrichedMessage } from '@engine/types/chat';

export interface MessageDiff {
  hasChanges: boolean;
  changes: Partial<EnrichedMessage>;
}

/**
 * 计算两个消息对象之间的差异
 * @param current 当前消息对象
 * @param updated 更新后的消息对象
 * @returns 差分结果，只包含发生变化的字段
 */
export function calculateMessageDiff(
  current: Partial<EnrichedMessage>,
  updated: Partial<EnrichedMessage>
): MessageDiff {
  const changes: Partial<EnrichedMessage> = {};
  let hasChanges = false;

  // 检查基础字段
  const baseFields: (keyof EnrichedMessage)[] = [
    'content',
    'state',
    'usage',
    'name'
  ];

  for (const field of baseFields) {
    if (updated[field] !== undefined && current[field] !== updated[field]) {
      (changes as any)[field] = updated[field];
      hasChanges = true;
    }
  }

  // 检查 AssistantMessage 特有字段
  if (current.role === 'assistant' && updated.role === 'assistant') {
    const assistantFields = ['reasoning_content', 'prefix'] as const;
    for (const field of assistantFields) {
      if ((updated as any)[field] !== undefined && (current as any)[field] !== (updated as any)[field]) {
        (changes as any)[field] = (updated as any)[field];
        hasChanges = true;
      }
    }
  }

  return { hasChanges, changes };
}

/**
 * 智能增量更新：只有内容实际增长时才更新
 * 这对于流式生成特别有用，避免重复更新相同内容
 * @param current 当前消息内容
 * @param updated 更新后的消息内容
 * @returns 是否应该更新
 */
export function shouldUpdateStreamContent(current: string, updated: string): boolean {
  // 如果新内容为空，不更新
  if (!updated) return false;
  
  // 如果当前内容为空，直接更新
  if (!current) return true;
  
  // 如果新内容比当前内容长，且包含当前内容，则更新
  if (updated.length > current.length && updated.startsWith(current)) {
    // 调试日志（可在生产环境中禁用）
    // console.log('[shouldUpdateStreamContent] 检测到内容增长:', {
    //   currentLength: current.length,
    //   updatedLength: updated.length,
    //   shouldUpdate: true
    // });
    return true;
  }
  
  // 如果内容完全不同，也更新（处理编辑情况）
  if (updated !== current) {
    // 调试日志（可在生产环境中禁用）
    // console.log('[shouldUpdateStreamContent] 检测到内容变化:', {
    //   currentLength: current.length,
    //   updatedLength: updated.length,
    //   shouldUpdate: true
    // });
    return true;
  }
  
  return false;
}

/**
 * 创建流式更新的差分补丁
 * 专门针对流式生成进行优化
 * @param current 当前消息对象
 * @param updated 流式更新的消息对象
 * @returns 优化的差分补丁
 */
export function createStreamingPatch(
  current: Partial<EnrichedMessage>,
  updated: Partial<EnrichedMessage>
): MessageDiff {
  const changes: Partial<EnrichedMessage> = {};
  let hasChanges = false;

  // 调试日志：记录每次更新尝试涉及的字段
  const debugInfo = {
    currentFields: Object.keys(current),
    updatedFields: Object.keys(updated),
    changedFields: [] as string[]
  };

  // 对于主要内容字段，使用智能更新策略
  const currentContent = current.content || '';
  const updatedContent = updated.content || '';
  
  if (shouldUpdateStreamContent(currentContent, updatedContent)) {
    changes.content = updatedContent;
    hasChanges = true;
    debugInfo.changedFields.push('content');
  }

  // 对于 AssistantMessage 的 reasoning_content，也使用智能更新策略
  // 注意：在流式更新开始时，current 可能是空对象，updated 是 assistant 消息
  if ((current.role === 'assistant' || updated.role === 'assistant') && updated.role === 'assistant') {
    const currentReasoning = (current as any).reasoning_content || '';
    const updatedReasoning = (updated as any).reasoning_content || '';
    
    console.log('[createStreamingPatch] reasoning_content 检查:', {
      currentLength: currentReasoning.length,
      updatedLength: updatedReasoning.length,
      currentRole: current.role,
      updatedRole: updated.role,
      shouldUpdate: shouldUpdateStreamContent(currentReasoning, updatedReasoning)
    });
    
    if (shouldUpdateStreamContent(currentReasoning, updatedReasoning)) {
      (changes as any).reasoning_content = updatedReasoning;
      hasChanges = true;
      debugInfo.changedFields.push('reasoning_content');
      console.log('[createStreamingPatch] reasoning_content 已更新');
    }
  }

  // 对于非流式字段，直接比较（但排除 timestamp，避免性能问题）
  const nonStreamFields: (keyof EnrichedMessage)[] = [
    'state',
    'usage',
    'name'
    // 注意：timestamp 被排除，因为它在流式更新中不应该改变
    // 只有在消息完成时才设置最终的 timestamp
  ];

  for (const field of nonStreamFields) {
    if (updated[field] !== undefined && current[field] !== updated[field]) {
      (changes as any)[field] = updated[field];
      hasChanges = true;
      debugInfo.changedFields.push(field);
    }
  }

  // 特殊处理：只有在流式更新完成时才更新 timestamp
  // 流式过程中的 chunk 不应该包含 timestamp，避免频繁触发更新
  if (updated.timestamp !== undefined && updated.timestamp !== current.timestamp) {
    // 只有当明确提供了不同的 timestamp 时才更新（通常是流式完成时）
    changes.timestamp = updated.timestamp;
    hasChanges = true;
    debugInfo.changedFields.push('timestamp');
  }

  // 调试日志（可在生产环境中禁用）
  if (hasChanges) {
    // console.log('[createStreamingPatch] 差分更新分析:', debugInfo);
    // console.log('[createStreamingPatch] 实际变更:', changes);
  }

  return { hasChanges, changes };
}
