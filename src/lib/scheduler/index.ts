/**
 * 学习调度模块的公共入口。
 *
 * ```ts
 * import { Scheduler, loadScheduler, saveScheduler } from './lib/scheduler';
 * const scheduler = new Scheduler(loadScheduler());
 * const plan = scheduler.plan();          // 今日批次 / 新词量 / 逾期池
 * const report = scheduler.settle();      // 结算昨天 → 今天的新词量
 * ```
 */

export * from './studyDay.ts';
export * from './types.ts';
export * from './adaptation.ts';
export * from './cards.ts';
export * from './immediate.ts';
export * from './plan.ts';
export * from './engine.ts';
export * from './storage.ts';
export * from './copy.ts';
