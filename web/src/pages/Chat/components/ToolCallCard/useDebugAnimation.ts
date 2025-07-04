import React from 'react';

// ============================================================================
// 调试模式动画状态管理器 (仅用于Debug页面测试)
// 注意：在真实应用中，这些状态应该由 task-loop 统一管理
// ============================================================================

export interface DebugAnimationState {
  status: 'calling' | 'success' | 'error';
  content: string;
  isCollapsed: boolean;
  animationActive: boolean;
  startTime: number;
  showCompletionFlash: boolean;
  // 新增：防止重复动画标记
  animationCompleted: boolean;
}

// ============================================================================
// 全局状态管理：使用稳定的key策略避免状态丢失
// ============================================================================
const debugAnimationStates = new Map<string, DebugAnimationState>();

// 辅助函数：生成稳定的状态key
const getStableStateKey = (id: string, content: string): string => {
  // 使用消息ID + 内容hash作为稳定的key，避免因组件重新渲染导致状态丢失
  const contentHash = content.substring(0, 50); // 简单的内容指纹
  return `${id}_${contentHash}`;
};

export interface DebugAnimationConfig {
  autoStatusChange?: {
    delay: number; // 延迟时间（毫秒）
    finalStatus: 'success' | 'error';
    finalContent: string;
  };
  animationPhase?: number; // 动画相位偏移（0-1）
  useBackgroundPulse?: boolean; // 是否使用背景脉冲而不是底边脉冲
}

export interface UseDebugAnimationProps {
  id: string;
  status: 'calling' | 'success' | 'error';
  content: string;
  collapsed: boolean;
  config: DebugAnimationConfig;
}

export interface UseDebugAnimationReturn {
  currentStatus: 'calling' | 'success' | 'error';
  currentContent: string;
  isCollapsed: boolean;
  animationActive: boolean;
  showCompletionFlash: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  updateState: () => void;
  // 新增：强制停止动画功能
  forceStopAnimation: () => void;
}

// ============================================================================
// 调试模式状态管理 Hook
// ============================================================================
export const useDebugAnimation = ({
  id,
  status,
  content,
  collapsed,
  config
}: UseDebugAnimationProps): UseDebugAnimationReturn => {
  const [currentStatus, setCurrentStatus] = React.useState<'calling' | 'success' | 'error'>(status);
  const [currentContent, setCurrentContent] = React.useState(content);
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);
  const [animationActive, setAnimationActive] = React.useState(status === 'calling');
  const [showCompletionFlash, setShowCompletionFlash] = React.useState(false);

  // 用于管理定时器的引用
  const flashTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const pulseTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const autoStatusTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // 清理所有定时器的函数
  const clearAllTimers = React.useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = null;
    }
    if (autoStatusTimerRef.current) {
      clearTimeout(autoStatusTimerRef.current);
      autoStatusTimerRef.current = null;
    }
  }, []);

  // 组件卸载时清理定时器
  React.useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // 初始化或获取持久化状态
  React.useEffect(() => {
    const stableKey = getStableStateKey(id, content);
    const savedState = debugAnimationStates.get(stableKey);
    if (savedState) {
      setCurrentStatus(savedState.status);
      setCurrentContent(savedState.content);
      setIsCollapsed(savedState.isCollapsed);
      setAnimationActive(savedState.animationActive);
      setShowCompletionFlash(savedState.showCompletionFlash);
    } else {
      const initialState: DebugAnimationState = {
        status,
        content,
        isCollapsed: collapsed,
        animationActive: status === 'calling',
        startTime: Date.now(),
        showCompletionFlash: false,
        animationCompleted: status !== 'calling' // 如果初始状态不是calling，标记为已完成
      };
      debugAnimationStates.set(stableKey, initialState);
    }
  }, [id, status, content, collapsed]);

  // 监听外部状态变化，确保动画状态同步
  // 注意：在调试模式下，如果有自动状态变化配置，则不同步外部状态
  React.useEffect(() => {
    // 如果配置了自动状态变化，则不同步外部状态，避免冲突
    if (config.autoStatusChange) {
      return;
    }
    
    if (status !== currentStatus) {
      setCurrentStatus(status);
    }
    if (content !== currentContent) {
      setCurrentContent(content);
    }
    if (collapsed !== isCollapsed) {
      setIsCollapsed(collapsed);
    }
  }, [status, content, collapsed, currentStatus, currentContent, isCollapsed, config.autoStatusChange]);

  // 更新全局状态
  const updateState = React.useCallback(() => {
    const stableKey = getStableStateKey(id, content);
    const existingState = debugAnimationStates.get(stableKey);
    debugAnimationStates.set(stableKey, {
      status: currentStatus,
      content: currentContent,
      isCollapsed,
      animationActive,
      startTime: existingState?.startTime || Date.now(),
      showCompletionFlash,
      animationCompleted: existingState?.animationCompleted || false
    });
  }, [id, content, currentStatus, currentContent, isCollapsed, animationActive, showCompletionFlash]);

  // 创建一个自定义的 setIsCollapsed 函数，同时更新 React 状态和全局状态
  const setIsCollapsedWithUpdate = React.useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    const stableKey = getStableStateKey(id, content);
    const existingState = debugAnimationStates.get(stableKey);
    if (existingState) {
      debugAnimationStates.set(stableKey, {
        ...existingState,
        isCollapsed: collapsed
      });
    }
  }, [id, content]);

  // 动画控制逻辑
  // TODO: 修复完成动画触发逻辑可能存在的问题
  // 问题：setShowCompletionFlash(true)被调用，但动画不显示
  // 可能原因：1. 状态更新时机问题 2. 组件重渲染导致动画重置 3. CSS选择器不匹配
  React.useEffect(() => {
    const stableKey = getStableStateKey(id, content);
    const savedState = debugAnimationStates.get(stableKey);
    const prevStatus = savedState?.status;
    
    console.log(`[useDebugAnimation] 状态变化: ${id}`, {
      prevStatus,
      currentStatus,
      animationCompleted: savedState?.animationCompleted,
      useBackgroundPulse: config.useBackgroundPulse
    });
    
    // 清理之前的定时器
    clearAllTimers();
    
    if (currentStatus === 'calling') {
      setAnimationActive(true);
      setShowCompletionFlash(false);
      // 重置动画完成标记，允许新的动画序列
      if (savedState) {
        const resetState = { ...savedState, animationCompleted: false };
        debugAnimationStates.set(stableKey, resetState);
      }
    } else if (currentStatus === 'success' || currentStatus === 'error') {
      // 防止重复触发完成动画
      if (savedState?.animationCompleted) {
        console.log(`[useDebugAnimation] 动画已完成，跳过: ${id}`);
        setAnimationActive(false);
        setShowCompletionFlash(false);
        updateState();
        return;
      }
      
      // 如果从 calling 状态变为完成状态，先显示完成动画
      if (prevStatus === 'calling') {
        console.log(`[useDebugAnimation] 开始完成动画: ${id}`);
        setShowCompletionFlash(true);
        // 标记动画已完成，防止重复触发
        const updatedState = { ...savedState, animationCompleted: true };
        debugAnimationStates.set(stableKey, updatedState as DebugAnimationState);
        
        // 对于背景脉冲模式，更快地停止动画
        if (config.useBackgroundPulse) {
          // 背景脉冲模式：完成动画后立即停止脉冲
          flashTimerRef.current = setTimeout(() => {
            console.log(`[useDebugAnimation] 背景脉冲模式完成闪烁结束，立即停止: ${id}`);
            setShowCompletionFlash(false);
            setAnimationActive(false);
            updateState();
          }, 600);
        } else {
          // 底边脉冲模式：完成动画后还有收尾脉冲
          flashTimerRef.current = setTimeout(() => {
            console.log(`[useDebugAnimation] 底边脉冲模式完成闪烁结束，开始收尾脉冲: ${id}`);
            setShowCompletionFlash(false);
            // 延迟关闭脉冲动画，完成最后一个脉冲
            pulseTimerRef.current = setTimeout(() => {
              console.log(`[useDebugAnimation] 所有动画结束: ${id}`);
              setAnimationActive(false);
              updateState();
            }, 1000);
          }, 600);
        }
      } else {
        // 直接设置为完成状态，立即停止所有动画
        console.log(`[useDebugAnimation] 直接停止动画: ${id}`);
        setAnimationActive(false);
        setShowCompletionFlash(false);
        // 标记动画已完成
        if (savedState) {
          const completedState = { ...savedState, animationCompleted: true };
          debugAnimationStates.set(stableKey, completedState);
        }
      }
    }
    updateState();
  }, [currentStatus, id, content, config.useBackgroundPulse, updateState, clearAllTimers]);

  // 自动状态变化逻辑
  React.useEffect(() => {
    const stableKey = getStableStateKey(id, content);
    const savedState = debugAnimationStates.get(stableKey);
    if (config.autoStatusChange && status === 'calling' && savedState && !savedState.animationCompleted) {
      // 检查是否已经开始了状态变化计时器
      const elapsedTime = Date.now() - savedState.startTime;
      const remainingTime = Math.max(0, config.autoStatusChange.delay - elapsedTime);
      
      autoStatusTimerRef.current = setTimeout(() => {
        setCurrentStatus(config.autoStatusChange!.finalStatus);
        setCurrentContent(config.autoStatusChange!.finalContent);
        updateState();
      }, remainingTime);

      return () => {
        if (autoStatusTimerRef.current) {
          clearTimeout(autoStatusTimerRef.current);
          autoStatusTimerRef.current = null;
        }
      };
    }
  }, [config.autoStatusChange, status, id, content, updateState]);

  // 强制停止动画功能
  const forceStopAnimation = React.useCallback(() => {
    const stableKey = getStableStateKey(id, content);
    const savedState = debugAnimationStates.get(stableKey);
    
    console.log(`[useDebugAnimation] 强制停止动画: ${id}`, {
      currentStatus,
      animationActive,
      showCompletionFlash
    });
    
    // 清理所有定时器
    clearAllTimers();
    
    // 立即停止所有动画状态
    setAnimationActive(false);
    setShowCompletionFlash(false);
    
    // 标记动画已完成
    if (savedState) {
      const stoppedState = { 
        ...savedState, 
        animationCompleted: true,
        animationActive: false,
        showCompletionFlash: false
      };
      debugAnimationStates.set(stableKey, stoppedState);
    }
    
    updateState();
  }, [id, content, currentStatus, animationActive, showCompletionFlash, updateState, clearAllTimers]);

  return {
    currentStatus,
    currentContent,
    isCollapsed,
    animationActive,
    showCompletionFlash,
    setIsCollapsed: setIsCollapsedWithUpdate,
    updateState,
    forceStopAnimation
  };
};
