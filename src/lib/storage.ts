import type { Profile, StageProgress, Store, Word } from './types';

export const STORAGE_KEY = 'cijian.v1';

export const DEFAULT_PROFILE: Profile = {
  name: '',
  stage: 'cet4',
  batchSize: 5,
  meaningMode: 'auto',
  theme: 'system',
  skin: 'paper',
};

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function emptyStageProgress(): StageProgress {
  return { batchIndex: 0, seen: [], day: todayKey() };
}

export function defaultStore(): Store {
  return {
    v: 1,
    profile: { ...DEFAULT_PROFILE },
    progress: {},
    session: { hideMeaning: false, hideWord: false },
    custom: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 只接受结构完整的自定义词库，坏数据直接丢弃。 */
function sanitizeCustom(value: unknown): Store['custom'] {
  if (!isRecord(value) || !Array.isArray(value.words)) return null;
  const words = value.words.filter((item): item is Word => {
    if (!isRecord(item)) return false;
    if (typeof item.w !== 'string' || !item.w) return false;
    if (typeof item.ph !== 'string') return false;
    if (!Array.isArray(item.m) || item.m.length === 0) return false;
    return item.m.every((sense) => typeof sense === 'string' && sense.length > 0);
  });
  if (words.length === 0) return null;
  return {
    lvl: 'custom',
    label: typeof value.label === 'string' && value.label ? value.label.slice(0, 24) : '我的词库',
    words,
  };
}

const BATCH_SIZES = [5, 8, 10, 15, 20];
const STAGES = ['senior', 'cet4', 'cet6', 'kaoyan', 'custom'];
const MEANING_MODES = ['auto', 'main', 'all'];
const THEMES = ['system', 'light', 'dark'];
const SKINS = ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'desk', 'vinyl'];

/** 读取并清洗本地数据：任何损坏字段都回退到默认值，绝不让 App 白屏。 */
export function loadStore(): Store {
  const base = defaultStore();
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return base;
  }
  if (!raw) return base;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return base;
  }
  if (!isRecord(parsed)) return base;

  const profile = isRecord(parsed.profile) ? parsed.profile : {};
  const p: Profile = {
    name: typeof profile.name === 'string' ? profile.name.slice(0, 24) : base.profile.name,
    stage: STAGES.includes(String(profile.stage)) ? (profile.stage as Profile['stage']) : base.profile.stage,
    batchSize: BATCH_SIZES.includes(Number(profile.batchSize)) ? Number(profile.batchSize) : base.profile.batchSize,
    meaningMode: MEANING_MODES.includes(String(profile.meaningMode))
      ? (profile.meaningMode as Profile['meaningMode'])
      : base.profile.meaningMode,
    theme: THEMES.includes(String(profile.theme)) ? (profile.theme as Profile['theme']) : base.profile.theme,
    skin: SKINS.includes(String(profile.skin)) ? (profile.skin as Profile['skin']) : base.profile.skin,
  };

  const progress: Record<string, StageProgress> = {};
  if (isRecord(parsed.progress)) {
    for (const [key, value] of Object.entries(parsed.progress)) {
      if (!STAGES.includes(key) || !isRecord(value)) continue;
      const seen = Array.isArray(value.seen)
        ? value.seen.filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0)
        : [];
      progress[key] = {
        batchIndex: typeof value.batchIndex === 'number' && value.batchIndex >= 0 ? Math.floor(value.batchIndex) : 0,
        seen: [...new Set(seen)],
        day: typeof value.day === 'string' ? value.day : todayKey(),
      };
    }
  }

  const session = isRecord(parsed.session) ? parsed.session : {};
  const custom = sanitizeCustom(parsed.custom);

  return {
    v: 1,
    profile: p,
    progress,
    session: {
      hideMeaning: session.hideMeaning === true,
      hideWord: session.hideWord === true,
    },
    custom,
  };
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* 存储写满或隐私模式：静默降级，不打断学习 */
  }
}

export function getStageProgress(store: Store, stage: string): StageProgress {
  return store.progress[stage] ?? emptyStageProgress();
}
