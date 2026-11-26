/**
 * 进度导出 / 导入（最小可用版，2026-11-26）。
 *
 * 只做两件事：把 `cijian.scheduler.v1`（学习卡片/队列/错词本/统计）加上 `cijian.v1` 的
 * profile（外观与阶段）拼成一个 JSON 下载；反过来读回本地存储。
 *
 * 两条硬约束：
 * 1. **导入是破坏性的**——必须先完整 parse + 校验通过，再一次性写，写失败要回滚；
 *    绝不写一半留个坏状态。
 * 2. 校验失败**一个字节都不写**。
 *
 * 刻意不做：云同步、自动备份、多设备合并、增量、加密。
 */

export const BACKUP_VERSION = 1;
export const BACKUP_APP = 'cijian';
export const SCHEDULER_KEY = 'cijian.scheduler.v1';
export const STORE_KEY = 'cijian.v1';

/** 只要求 localStorage 的最小子集，方便用内存实现做单测。 */
export interface BackupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  /** 可选：回滚时用来把原本不存在的键删掉（localStorage 有） */
  removeItem?(key: string): void;
}

export interface BackupPayload {
  /** 备份格式版本；只有 1 能被导入（custom 是可选字段，所以不 bump） */
  version: number;
  /** 固定 'cijian'，防止把别的 JSON 当备份导进来 */
  app: string;
  exportedAt: string;
  /** 只带 profile（外观 / 阶段 / 每批词数），不带 session 等临时状态 */
  profile: Record<string, unknown> | null;
  /**
   * 自定义词库（`cijian.v1` 里的 `custom`，与 profile 同键不同字段）。
   * v1 早期备份没有这个字段；读取时缺失按 null 处理（导入时保留本机现有词库，不删）。
   */
  custom: Record<string, unknown> | null;
  /** cijian.scheduler.v1 的原始对象 */
  scheduler: Record<string, unknown>;
}

export type BackupResult = { ok: true; data: BackupPayload } | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRecord(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** 本地日期，用于文件名：cijian-backup-2026-11-26.json */
function stamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function backupFileName(now = new Date()): string {
  return `cijian-backup-${stamp(now)}.json`;
}

/**
 * 生成备份对象。没有学习数据（连 `cijian.scheduler.v1` 都没有）时抛错——
 * 空备份没有意义，还容易让用户以为「备份过了」。
 */
export function buildBackup(storage: BackupStorage, now = new Date()): BackupPayload {
  const scheduler = parseRecord(storage.getItem(SCHEDULER_KEY));
  if (!scheduler) throw new Error('这台设备还没有可导出的学习数据');
  const store = parseRecord(storage.getItem(STORE_KEY));
  const profile = store && isRecord(store.profile) ? store.profile : null;
  const custom = store && isRecord(store.custom) ? store.custom : null;
  return {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: now.toISOString(),
    profile,
    custom,
    scheduler,
  };
}

/** 导出成文件内容（带缩进，方便用户自己看一眼）。 */
export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2) + '\n';
}

/** 顶层必填字段：缺一个就拒绝，宁可让人重导一次，也不写半截。 */
const REQUIRED_SCHEDULER_FIELDS = ['cards', 'unlearned', 'days', 'mistakes', 'immediate', 'userDailyGoal'] as const;

/**
 * 校验备份文本。**不产生任何写入**，全过才返回 data。
 * 失败原因都是给用户看的人话。
 */
export function validateBackupText(text: string): BackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: '这不是有效的 JSON 文件' };
  }
  if (!isRecord(parsed)) return { ok: false, reason: '备份内容不是一个对象' };
  if (parsed.version !== BACKUP_VERSION) {
    return { ok: false, reason: `备份版本不支持（需要 version ${BACKUP_VERSION}）` };
  }
  if (parsed.app !== BACKUP_APP) return { ok: false, reason: '这不是词笺的备份文件' };

  const scheduler = parsed.scheduler;
  if (!isRecord(scheduler)) return { ok: false, reason: '备份里没有学习数据' };
  for (const field of REQUIRED_SCHEDULER_FIELDS) {
    if (scheduler[field] === undefined || scheduler[field] === null) {
      return { ok: false, reason: `备份里的学习数据不完整（缺少 ${field}）` };
    }
  }
  if (!isRecord(scheduler.cards)) return { ok: false, reason: '备份里的卡片数据不是对象' };
  if (!Array.isArray(scheduler.unlearned)) return { ok: false, reason: '备份里的未学词池不是数组' };
  if (!isRecord(scheduler.days)) return { ok: false, reason: '备份里的学习记录不是对象' };
  if (!isRecord(scheduler.mistakes)) return { ok: false, reason: '备份里的错词本不是对象' };
  if (!isRecord(scheduler.immediate)) return { ok: false, reason: '备份里的即时复习状态不是对象' };
  if (typeof scheduler.userDailyGoal !== 'number' || !Number.isFinite(scheduler.userDailyGoal)) {
    return { ok: false, reason: '备份里的每日目标不是数字' };
  }

  // 空进度不拦（新用户也可能导出），但至少要有 cards 或 unlearned 之一
  const cardCount = Object.keys(scheduler.cards).length;
  const poolCount = (scheduler.unlearned as unknown[]).length;
  if (cardCount === 0 && poolCount === 0) return { ok: false, reason: '备份里没有词（卡片和未学词池都是空的）' };

  let profile: Record<string, unknown> | null = null;
  if (parsed.profile !== undefined && parsed.profile !== null) {
    if (!isRecord(parsed.profile)) return { ok: false, reason: '备份里的外观设置不是对象' };
    profile = parsed.profile;
  }

  let custom: Record<string, unknown> | null = null;
  if (parsed.custom !== undefined && parsed.custom !== null) {
    const checked = validateCustom(parsed.custom);
    if (!checked.ok) return { ok: false, reason: checked.reason };
    custom = checked.value;
  }

  return {
    ok: true,
    data: {
      version: BACKUP_VERSION,
      app: BACKUP_APP,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
      profile,
      custom,
      scheduler,
    },
  };
}

/**
 * 自定义词库的结构校验（与 `lib/storage.ts` 的 sanitizeCustom 同一口径）：
 * 坏结构整份拒绝，不做半份修复——导入是破坏性操作，宁可让人重导一次。
 */
function validateCustom(value: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; reason: string } {
  if (!isRecord(value)) return { ok: false, reason: '备份里的自定义词库不是对象' };
  const words = value.words;
  if (!Array.isArray(words)) return { ok: false, reason: '备份里的自定义词库缺少词表' };
  if (words.length === 0) return { ok: false, reason: '备份里的自定义词库是空的' };
  for (const item of words) {
    if (!isRecord(item)) return { ok: false, reason: '备份里的自定义词库有坏词条' };
    if (typeof item.w !== 'string' || !item.w) return { ok: false, reason: '备份里的自定义词库有词条缺单词' };
    if (typeof item.ph !== 'string') return { ok: false, reason: '备份里的自定义词库有词条缺音标字段' };
    if (!Array.isArray(item.m) || item.m.length === 0) return { ok: false, reason: '备份里的自定义词库有词条缺释义' };
    if (!item.m.every((sense) => typeof sense === 'string' && sense.length > 0)) {
      return { ok: false, reason: '备份里的自定义词库有释义不是文字' };
    }
  }
  return { ok: true, value };
}

export interface BackupSummary {
  cards: number;
  unlearned: number;
  mistakes: number;
  /** 备份里自定义词库的词数（0 = 没带词库） */
  customWords: number;
}

/* ---------------------------------------------------------------- 导入时的落盘闸门 */

/**
 * 导入后要刷新页面，而应用在 `pagehide` 会把**内存里的旧状态**写回 localStorage，
 * 正好盖掉刚导入的数据（E2E 实测：导入完 groups 又变回旧值）。
 * 所以导入前打一个一次性标记，`useScheduler` 看到它就不落盘，新页面启动时清掉。
 */
export const IMPORT_FLAG_KEY = 'cijian.importing';

export function markImporting(storage: Storage = localStorage): void {
  try {
    storage.setItem(IMPORT_FLAG_KEY, '1');
  } catch {
    /* 隐私模式：标记写不进去就只能靠刷新足够快，不影响主流程 */
  }
}

export function isImporting(storage: Storage = localStorage): boolean {
  try {
    return storage.getItem(IMPORT_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearImporting(storage: Storage = localStorage): void {
  try {
    storage.removeItem(IMPORT_FLAG_KEY);
  } catch {
    /* 忽略 */
  }
}

/** 导前给人看的摘要（二次确认里显示，让用户知道会覆盖成什么样）。 */
export function summarizeBackup(payload: BackupPayload): BackupSummary {
  const scheduler = payload.scheduler;
  const customWords = payload.custom && Array.isArray(payload.custom.words) ? payload.custom.words.length : 0;
  return {
    cards: isRecord(scheduler.cards) ? Object.keys(scheduler.cards).length : 0,
    unlearned: Array.isArray(scheduler.unlearned) ? scheduler.unlearned.length : 0,
    mistakes: isRecord(scheduler.mistakes) ? Object.keys(scheduler.mistakes).length : 0,
    customWords,
  };
}

/**
 * 写入备份。**先算好两个键的最终字符串，再写；任一写失败就回滚到写之前**。
 *
 * profile 只合并已知的 6 个字段；备份里的 `stage: 'custom'` 在本机没有自定义词库时忽略，
 * 否则导入完会停在一个空词库上。
 */
export function applyBackup(payload: BackupPayload, storage: BackupStorage): void {
  const schedulerText = JSON.stringify(payload.scheduler);
  const beforeStore = storage.getItem(STORE_KEY);

  const store = parseRecord(beforeStore) ?? { v: 1 };
  const merged: Record<string, unknown> = { ...store };
  if (payload.profile) {
    const currentProfile = isRecord(store.profile) ? store.profile : {};
    const incoming = payload.profile;
    const nextProfile: Record<string, unknown> = { ...currentProfile };
    for (const field of ['name', 'batchSize', 'meaningMode', 'theme', 'skin'] as const) {
      if (incoming[field] !== undefined) nextProfile[field] = incoming[field];
    }
    const hasCustom = payload.custom !== null || (store.custom !== null && store.custom !== undefined);
    const incomingStage = incoming.stage;
    if (typeof incomingStage === 'string' && (incomingStage !== 'custom' || hasCustom)) {
      nextProfile.stage = incomingStage;
    }
    merged.profile = nextProfile;
  }

  // 自定义词库的导入语义（写死）：
  // - 备份有、本机没有 → 写入
  // - 本机有、备份没有 → 保留本机，不删
  // - 两边都有 → 用备份覆盖
  if (payload.custom) merged.custom = payload.custom;

  const storeText = JSON.stringify(merged);
  const beforeScheduler = storage.getItem(SCHEDULER_KEY);
  try {
    storage.setItem(SCHEDULER_KEY, schedulerText);
    storage.setItem(STORE_KEY, storeText);
  } catch (error) {
    // 回滚：两个键都恢复成写之前的样子（原本不存在的键删掉）
    const rollback = (key: string, value: string | null) => {
      if (value === null) {
        if (storage.removeItem) storage.removeItem(key);
        else storage.setItem(key, '');
      } else {
        storage.setItem(key, value);
      }
    };
    try {
      rollback(SCHEDULER_KEY, beforeScheduler);
      rollback(STORE_KEY, beforeStore);
    } catch {
      /* 回滚也失败：让错误照常抛出去，交给上层提示 */
    }
    throw error instanceof Error ? error : new Error('写入备份失败');
  }
}
