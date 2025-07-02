// 性能监控工具：分析流式更新的性能特征
export class StreamingPerformanceMonitor {
  private static instances = new Map<string, StreamingPerformanceMonitor>();
  private chatId: string;
  private updateCount = 0;
  private lastUpdateTime = 0;
  private updateIntervals: number[] = [];
  private fieldUpdateCounts = new Map<string, number>();
  private startTime = Date.now();

  constructor(chatId: string) {
    this.chatId = chatId;
    this.startTime = Date.now();
  }

  static getInstance(chatId: string): StreamingPerformanceMonitor {
    if (!this.instances.has(chatId)) {
      this.instances.set(chatId, new StreamingPerformanceMonitor(chatId));
    }
    return this.instances.get(chatId)!;
  }

  static cleanup(chatId: string) {
    this.instances.delete(chatId);
  }

  recordUpdate(changedFields: string[]) {
    const now = Date.now();
    this.updateCount++;
    
    if (this.lastUpdateTime > 0) {
      const interval = now - this.lastUpdateTime;
      this.updateIntervals.push(interval);
    }
    
    this.lastUpdateTime = now;
    
    // 记录字段更新频率
    changedFields.forEach(field => {
      const count = this.fieldUpdateCounts.get(field) || 0;
      this.fieldUpdateCounts.set(field, count + 1);
    });
  }

  getStats() {
    const totalTime = Date.now() - this.startTime;
    const avgInterval = this.updateIntervals.length > 0 
      ? this.updateIntervals.reduce((a, b) => a + b, 0) / this.updateIntervals.length 
      : 0;
    
    const minInterval = this.updateIntervals.length > 0 ? Math.min(...this.updateIntervals) : 0;
    const maxInterval = this.updateIntervals.length > 0 ? Math.max(...this.updateIntervals) : 0;
    
    return {
      chatId: this.chatId,
      totalUpdates: this.updateCount,
      totalTime,
      avgUpdateInterval: avgInterval,
      minUpdateInterval: minInterval,
      maxUpdateInterval: maxInterval,
      updatesPerSecond: this.updateCount / (totalTime / 1000),
      fieldUpdateFrequency: Object.fromEntries(this.fieldUpdateCounts),
      recentIntervals: this.updateIntervals.slice(-10) // 最近10次更新的间隔
    };
  }

  logStats() {
    const stats = this.getStats();
    console.log(`[StreamingPerformanceMonitor] ${this.chatId} 性能统计:`, stats);
    
    // 性能警告
    if (stats.avgUpdateInterval < 50) {
      console.warn(`[StreamingPerformanceMonitor] 警告: 更新频率过高 (平均${stats.avgUpdateInterval}ms)`);
    }
    
    if (stats.updatesPerSecond > 20) {
      console.warn(`[StreamingPerformanceMonitor] 警告: 每秒更新次数过多 (${stats.updatesPerSecond.toFixed(1)}次/秒)`);
    }
  }

  reset() {
    this.updateCount = 0;
    this.lastUpdateTime = 0;
    this.updateIntervals = [];
    this.fieldUpdateCounts.clear();
    this.startTime = Date.now();
  }
}
