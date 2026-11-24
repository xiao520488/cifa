/**
 * 内置词库的按需加载层。
 *
 * 四本词库合计约 1.8MB 原始 JSON（gzip 约 630KB）——全部塞进入口 chunk 会让首屏
 * 多背 600KB。这里改成 `import()`：启动时只拉当前阶段那一本（约 130–195KB gzip），
 * 换阶段时再拉另一本；Service Worker 的 cache-first 会把拉过的书缓存下来。
 *
 * 对上层（App）的约定：
 * - `preloadBook()` 必须在 `App` 挂载前对「当前阶段」跑完，否则调度引擎会带着空词池
 *   启动，把当天的「新词计划」结算成 0 并写进状态（那个坑修不回来，只能等第二天）。
 * - `cachedBook()` 是同步的，只返回已经加载完成的书；没加载过就返回 null。
 */

import type { LevelKey, Wordbook } from './types.ts';

export type BuiltinLevel = Exclude<LevelKey, 'custom'>;

const LOADERS: Record<BuiltinLevel, () => Promise<{ default: unknown }>> = {
  senior: () => import('../data/senior.json'),
  cet4: () => import('../data/cet4.json'),
  cet6: () => import('../data/cet6.json'),
  kaoyan: () => import('../data/kaoyan.json'),
};

const cache = new Map<BuiltinLevel, Wordbook>();
const inflight = new Map<BuiltinLevel, Promise<Wordbook>>();

export const BUILTIN_LEVELS: BuiltinLevel[] = ['senior', 'cet4', 'cet6', 'kaoyan'];

export function isBuiltinLevel(key: LevelKey): key is BuiltinLevel {
  return key !== 'custom';
}

/** 词库内部去重：每个阶段的词表保持完整，跨阶段重复的词是正常的。 */
function dedupeBook(book: Wordbook): Wordbook {
  const seen = new Set<string>();
  const words = book.words.filter((word) => {
    const key = word.w.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ...book, words };
}

/** 已经加载好的书（同步）；没加载过返回 null。 */
export function cachedBook(key: LevelKey): Wordbook | null {
  if (!isBuiltinLevel(key)) return null;
  return cache.get(key) ?? null;
}

/** 加载一本内置词库（幂等，失败会 reject）。 */
export async function preloadBook(key: LevelKey): Promise<Wordbook | null> {
  if (!isBuiltinLevel(key)) return null;
  const hit = cache.get(key);
  if (hit) return hit;
  const running = inflight.get(key);
  if (running) return running;

  const task = LOADERS[key]().then((module) => {
    const book = dedupeBook(module.default as Wordbook);
    cache.set(key, book);
    inflight.delete(key);
    return book;
  });
  inflight.set(key, task);
  try {
    return await task;
  } catch (error) {
    inflight.delete(key);
    throw error;
  }
}
