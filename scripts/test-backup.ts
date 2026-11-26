/**
 * 进度备份（导出 / 导入）单测（`node scripts/test-backup.ts`）。
 *
 * 重点不是「能导出」，而是**导入的原子性与拒绝口径**：
 * - 校验失败一个字节都不写；
 * - 写入中途失败要回滚到写之前。
 * 全部用内存 storage，不碰浏览器 localStorage。
 */

import {
  BACKUP_APP,
  BACKUP_VERSION,
  SCHEDULER_KEY,
  STORE_KEY,
  applyBackup,
  backupFileName,
  buildBackup,
  serializeBackup,
  summarizeBackup,
  validateBackupText,
  type BackupStorage,
} from '../src/lib/backup.ts';

let failures = 0;
function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) console.log(`✓ ${name}`);
  else {
    failures += 1;
    console.log(`✗ ${name}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}
function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });
}

/** 内存 storage；`failOn` 指定第几次 setItem 抛错（1 起算），用来测回滚。 */
function memoryStorage(initial: Record<string, string> = {}, failOn = 0): BackupStorage & { data: Record<string, string>; writes: number } {
  const data = { ...initial };
  let writes = 0;
  return {
    data,
    get writes() {
      return writes;
    },
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      writes += 1;
      if (failOn > 0 && writes === failOn) throw new Error('模拟写满');
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  } as BackupStorage & { data: Record<string, string>; writes: number };
}

const scheduler = {
  cards: { alpha: { word: 'alpha', phase: 'short', interval: 1, due: '2026-11-27', lapses: 0 } },
  unlearned: ['beta', 'gamma'],
  days: { '2026-11-26': { dueSnapshot: [], doneToday: [] } },
  mistakes: { alpha: { word: 'alpha', count: 2, lastDay: '2026-11-26', source: 'review' } },
  immediate: { pendingCount: 0, pendingWords: [], active: null, stats: { groups: 0, cards: 0, loops: 0, skipped: 0 }, lastAvgLoops: null },
  userDailyGoal: 20,
  maxLimit: 25,
};
const store = {
  v: 1,
  profile: { name: '小夏', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'dark', skin: 'bento' },
  progress: { cet4: { batchIndex: 0, seen: [], day: '2026-11-26' } },
  session: { hideMeaning: false, hideWord: false },
  custom: null,
};

// 1. 导出：版本、来源、profile
{
  const storage = memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) });
  const payload = buildBackup(storage, new Date(2026, 10, 26, 9, 0, 0));
  eq('导出带 version', payload.version, BACKUP_VERSION);
  eq('导出带 app 标记', payload.app, BACKUP_APP);
  eq('导出带 profile', payload.profile?.name, '小夏');
  eq('导出带调度数据', payload.scheduler.userDailyGoal, 20);
  eq('导出不含 session（临时状态）', 'session' in (payload.profile ?? {}), false);
  eq('导出时间可序列化', typeof payload.exportedAt, 'string');
}

// 2. 没有学习数据时拒绝导出
{
  let message = '';
  try {
    buildBackup(memoryStorage());
  } catch (error) {
    message = error instanceof Error ? error.message : '';
  }
  eq('没有数据时导出报错', message, '这台设备还没有可导出的学习数据');
}

// 3. 文件名
eq('文件名带日期', backupFileName(new Date(2026, 10, 26)), 'cijian-backup-2026-11-26.json');

// 4. 序列化 → 校验 往返
{
  const storage = memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) });
  const text = serializeBackup(buildBackup(storage));
  const result = validateBackupText(text);
  check('合法备份通过校验', result.ok === true);
  if (result.ok) {
    eq('往返后调度数据一致', result.data.scheduler, scheduler);
    eq('往返后 profile 一致', result.data.profile?.skin, 'bento');
    eq('摘要卡片数', summarizeBackup(result.data), { cards: 1, unlearned: 2, mistakes: 1, customWords: 0 });
  }
}

// 5. 各种坏文件都要拒绝，且原因说人话
function reasonOf(text: string): string {
  const result = validateBackupText(text);
  return result.ok ? 'OK（不该通过）' : result.reason;
}
eq('坏 JSON', reasonOf('{oops'), '这不是有效的 JSON 文件');
eq('不是对象', reasonOf('[]'), '备份内容不是一个对象');
eq('版本不对', reasonOf(JSON.stringify({ ...JSON.parse(serializeBackup(buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler) })))), version: 2 })), '备份版本不支持（需要 version 1）');
eq('不是词笺的备份', reasonOf(JSON.stringify({ version: 1, app: 'other', scheduler })), '这不是词笺的备份文件');

function withoutField(field: string): string {
  const copy: Record<string, unknown> = { ...scheduler };
  delete copy[field];
  return JSON.stringify({ version: 1, app: 'cijian', scheduler: copy });
}
eq('缺字段', reasonOf(withoutField('mistakes')), '备份里的学习数据不完整（缺少 mistakes）');
eq('cards 不是对象', reasonOf(JSON.stringify({ version: 1, app: 'cijian', scheduler: { ...scheduler, cards: [] } })), '备份里的卡片数据不是对象');
eq('unlearned 不是数组', reasonOf(JSON.stringify({ version: 1, app: 'cijian', scheduler: { ...scheduler, unlearned: {} } })), '备份里的未学词池不是数组');
eq('目标不是数字', reasonOf(JSON.stringify({ version: 1, app: 'cijian', scheduler: { ...scheduler, userDailyGoal: '20' } })), '备份里的每日目标不是数字');
eq('空进度', reasonOf(JSON.stringify({ version: 1, app: 'cijian', scheduler: { ...scheduler, cards: {}, unlearned: [] } })), '备份里没有词（卡片和未学词池都是空的）');
eq('profile 不是对象', reasonOf(JSON.stringify({ version: 1, app: 'cijian', scheduler, profile: 'x' })), '备份里的外观设置不是对象');

// 6. 校验失败 → 一个字节都不写
{
  const storage = memoryStorage({ [SCHEDULER_KEY]: 'OLD-SCHEDULER', [STORE_KEY]: 'OLD-STORE' });
  const result = validateBackupText('{"version":9}');
  check('这份文件确实被拒绝', result.ok === false);
  eq('拒绝时不写调度键', storage.data[SCHEDULER_KEY], 'OLD-SCHEDULER');
  eq('拒绝时不写偏好键', storage.data[STORE_KEY], 'OLD-STORE');
  eq('拒绝时零写入', storage.writes, 0);
}

// 7. 正常导入：两个键都写，profile 只合并已知字段
{
  const storage = memoryStorage({
    [SCHEDULER_KEY]: JSON.stringify({ cards: {}, unlearned: ['keep'], days: {}, mistakes: {}, immediate: {}, userDailyGoal: 20 }),
    [STORE_KEY]: JSON.stringify({ ...store, profile: { ...store.profile, name: '旧名字', stage: 'senior' }, keepMe: 1 }),
  });
  const result = validateBackupText(serializeBackup(buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) }))));
  if (!result.ok) throw new Error('夹具本身不合法');
  applyBackup(result.data, storage);
  eq('调度键被替换', JSON.parse(storage.data[SCHEDULER_KEY]).userDailyGoal, 20);
  const merged = JSON.parse(storage.data[STORE_KEY]);
  eq('profile 被替换', merged.profile.name, '小夏');
  eq('未知顶层字段保留', merged.keepMe, 1);
  eq('stage 随备份走（本机有该阶段）', merged.profile.stage, 'cet4');
}

// 8. 备份的 stage=custom，本机没有自定义词库 → 忽略这一项
{
  const storage = memoryStorage({ [STORE_KEY]: JSON.stringify({ ...store, profile: { ...store.profile, stage: 'cet4' }, custom: null }) });
  const customStore = { ...store, profile: { ...store.profile, stage: 'custom' } };
  const result = validateBackupText(serializeBackup(buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(customStore) }))));
  if (!result.ok) throw new Error('夹具本身不合法');
  applyBackup(result.data, storage);
  eq('没有自定义词库时不导入 custom 阶段', JSON.parse(storage.data[STORE_KEY]).profile.stage, 'cet4');
}

// 9. 写入中途失败 → 回滚，且抛出
{
  const initial = { [SCHEDULER_KEY]: 'OLD-S', [STORE_KEY]: 'OLD-P' };
  const storage = memoryStorage(initial, 2); // 第二次 setItem 失败
  const result = validateBackupText(serializeBackup(buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) }))));
  if (!result.ok) throw new Error('夹具本身不合法');
  let thrown = '';
  try {
    applyBackup(result.data, storage);
  } catch (error) {
    thrown = error instanceof Error ? error.message : 'unknown';
  }
  eq('写入失败会抛错', thrown, '模拟写满');
  eq('调度键已回滚', storage.data[SCHEDULER_KEY], 'OLD-S');
  eq('偏好键已回滚', storage.data[STORE_KEY], 'OLD-P');
}

// 10. 备份没有 profile → 不动偏好键内容
{
  const onlyScheduler = JSON.stringify({ version: 1, app: 'cijian', scheduler });
  const result = validateBackupText(onlyScheduler);
  if (!result.ok) throw new Error('夹具本身不合法');
  const storage = memoryStorage({ [STORE_KEY]: JSON.stringify(store) });
  applyBackup(result.data, storage);
  eq('没有 profile 时偏好键原样', JSON.parse(storage.data[STORE_KEY]).profile.name, '小夏');
}

// 11. 自定义词库：导出带上、坏结构拒绝、三种导入语义
{
  const customBook = {
    lvl: 'custom',
    label: '我的专业词',
    words: [
      { w: 'alpha', ph: '/ˈælfə/', m: ['n. 阿尔法'] },
      { w: 'beta', ph: '/ˈbiːtə/', m: ['n. 贝塔'] },
    ],
  };
  const withCustom = memoryStorage({
    [SCHEDULER_KEY]: JSON.stringify(scheduler),
    [STORE_KEY]: JSON.stringify({ ...store, custom: customBook }),
  });
  const payload = buildBackup(withCustom);
  eq('导出带自定义词库', payload.custom?.label, '我的专业词');
  eq('摘要给出词库词数', summarizeBackup(payload).customWords, 2);

  const noCustom = memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) });
  eq('没有词库时 custom 为空', buildBackup(noCustom).custom, null);
}

// 12. 坏自定义词库：原子拒绝
{
  const make = (custom: unknown) => JSON.stringify({ version: 1, app: 'cijian', scheduler, custom });
  const reason = (custom: unknown) => {
    const result = validateBackupText(make(custom));
    return result.ok ? 'OK（不该通过）' : result.reason;
  };
  eq('词库不是对象', reason('x'), '备份里的自定义词库不是对象');
  eq('词库缺词表', reason({ lvl: 'custom' }), '备份里的自定义词库缺少词表');
  eq('词库是空的', reason({ words: [] }), '备份里的自定义词库是空的');
  eq('词条不是对象', reason({ words: ['x'] }), '备份里的自定义词库有坏词条');
  eq('词条缺单词', reason({ words: [{ ph: '', m: ['x'] }] }), '备份里的自定义词库有词条缺单词');
  eq('词条缺释义', reason({ words: [{ w: 'a', ph: '', m: [] }] }), '备份里的自定义词库有词条缺释义');
  eq('释义不是文字', reason({ words: [{ w: 'a', ph: '', m: [1] }] }), '备份里的自定义词库有释义不是文字');
}

// 13. 导入语义：备份有→写入；备份无→保留；两边都有→备份覆盖
{
  const backupWithCustom = validateBackupText(
    serializeBackup(
      buildBackup(
        memoryStorage({
          [SCHEDULER_KEY]: JSON.stringify(scheduler),
          [STORE_KEY]: JSON.stringify({ ...store, custom: { lvl: 'custom', label: '备份词库', words: [{ w: 'z', ph: '', m: ['n. 备份'] }] } }),
        }),
      ),
    ),
  );
  if (!backupWithCustom.ok) throw new Error('夹具本身不合法');

  // 13a 备份有、本机没有 → 写入
  const empty = memoryStorage({ [STORE_KEY]: JSON.stringify({ ...store, custom: null }) });
  applyBackup(backupWithCustom.data, empty);
  eq('备份有词库就写入', JSON.parse(empty.data[STORE_KEY]).custom.label, '备份词库');

  // 13b 本机有、备份没有 → 保留本机
  const backupNoCustom = validateBackupText(
    serializeBackup(buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(store) }))),
  );
  if (!backupNoCustom.ok) throw new Error('夹具本身不合法');
  const keep = memoryStorage({
    [STORE_KEY]: JSON.stringify({ ...store, custom: { lvl: 'custom', label: '本机词库', words: [{ w: 'q', ph: '', m: ['n. 本机'] }] } }),
  });
  applyBackup(backupNoCustom.data, keep);
  eq('备份没有词库就保留本机', JSON.parse(keep.data[STORE_KEY]).custom.label, '本机词库');

  // 13c 两边都有 → 备份覆盖
  const both = memoryStorage({
    [STORE_KEY]: JSON.stringify({ ...store, custom: { lvl: 'custom', label: '本机词库', words: [{ w: 'q', ph: '', m: ['n. 本机'] }] } }),
  });
  applyBackup(backupWithCustom.data, both);
  eq('两边都有时用备份覆盖', JSON.parse(both.data[STORE_KEY]).custom.label, '备份词库');
}

// 14. 体积：200 词的词库大概多大（只报告，不设上限）
{
  const words = Array.from({ length: 200 }, (_, i) => ({
    w: `specialword${i}`,
    ph: '/ˈspesɪmən/',
    m: ['n. 一个用来占位的专业术语', 'v. 举例说明这个词条会有多长'],
  }));
  const bigStore = { ...store, custom: { lvl: 'custom', label: '我的专业词', words } };
  const payload = buildBackup(memoryStorage({ [SCHEDULER_KEY]: JSON.stringify(scheduler), [STORE_KEY]: JSON.stringify(bigStore) }));
  const bytes = Buffer.byteLength(serializeBackup(payload), 'utf8');
  console.log(`· 200 词自定义词库的备份约 ${(bytes / 1024).toFixed(1)} KB（含调度数据）`);
  check('200 词备份在几十 KB 量级', bytes > 10 * 1024 && bytes < 200 * 1024, bytes);
}

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
