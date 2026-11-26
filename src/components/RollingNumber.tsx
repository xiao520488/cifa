/**
 * 璇绘暟鏁板瓧婊氬姩锛坉ocs/MOTION_SPEC.md 搂13.5锛孌6-A / D7-A锛夈€?
 *
 * 涓夋潯纭姹傦紝鏀逛箣鍓嶅厛璇伙細
 * 1. **瀹藉害涓嶉潬 min-width: Nch**锛?:before 鐢ㄥ綋鍓嶅瓧浣撴覆鏌?digits 涓?0锛坴isibility:hidden锛夋妸鐩掑瀹氭锛?
 *    鐪熸鐨勬暟瀛楃粷瀵瑰畾浣嶇洊鍦ㄤ笂闈€俢h 鍙湪銆岀瓑瀹芥暟瀛?+ 鏃犲瓧璺?+ 鏈?tnum銆嶆椂鎵嶅噯锛? 濂楃毊鑲ら噷鏈夊姞
 *    letter-spacing 鐨勩€佹湁姣斾緥鏁板瓧鐨勶紝鐢?ch 涓€瀹氬亸灏忥紝999鈫?000 閭ｄ竴甯х収鏍锋妸甯冨眬鎾戝紑銆?
 * 2. **鍚?key 鍏变韩涓€涓椂閽?*锛氬悓涓€灞忓悓涓€鏁板瓧鏈夊涓涓伙紙棣栭〉銆屽凡瀛︺€嶅湪璇绘暟甯︺€?start__meta銆?
 *    .start__spec 鍚勬湁涓€浠斤級銆傛瘡涓涓诲悇鑷捣涓€鏉?rAF 浼氬樊 1鈥?ms锛屾暟鍊煎ぇ鏃讹紙0鈫?00 鐢?250ms锛?
 *    125ms 閭ｄ竴甯у氨鑳藉樊鍑?2鈥? 涓暟 鈫?鍚屽睆鑷浉鐭涚浘銆傛墍浠ユ寜 memoKey 鍙窇涓€鏉?rAF锛?
 *    鎵€鏈夊涓昏鍚屼竴涓?current锛堣繖灏辨槸 D7-A 鐨勮惤鍦版柟寮忥級銆?
 * 3. **璺ㄦ寕杞借蹇?*锛氬洓涓睆鏄潯浠舵覆鏌擄紝绛斿畬棰樺洖棣栭〉绛変簬閲嶆柊鎸傝浇銆傚彧鍦ㄧ粍浠堕噷瀛?prev 鐨勮瘽
 *    mount 鏃?prev === value 鈫?姘歌繙涓嶆粴锛堝姛鑳藉瓨鍦ㄤ絾姘镐笉瑙﹀彂锛夈€俵astShown 鏄ā鍧楃骇鐨勩€?
 *
 * 姣忓抚鍙啓 textContent锛屼笉璇?getBoundingClientRect / getComputedStyle锛氬竷灞€绋冲畾鐢辩 1 鏉′繚璇侊紝
 * 涓嶆槸闈犮€屾瘡甯ч噺涓€閬嶅啀淇銆嶃€?
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { cubicBezier, MOTION, prefersReducedMotion, readEaseOut } from '../lib/motion';

interface Entry {
  from: number;
  to: number;
  current: number;
  start: number | null;
  ease: (x: number) => number;
  raf: number | null;
  subs: Set<() => void>;
}

const entries = new Map<string, Entry>();
/** 璺ㄦ寕杞借蹇嗭細key 鈫?涓婁竴娆?*鐢ㄦ埛鐪熸鐪嬪埌**鐨勫€硷紙鍐峰惎鍔ㄤ负绌?鈫?棣栧抚涓嶆粴锛岃繖鏄鐭╋級 */
const lastShown = new Map<string, number>();

const FALLBACK_EASE = cubicBezier(0.2, 0.8, 0.2, 1);

function notify(e: Entry) {
  for (const cb of e.subs) cb();
}

function entryFor(key: string, initial: number): Entry {
  let e = entries.get(key);
  if (!e) {
    const known = lastShown.get(key);
    e = {
      from: initial,
      to: initial,
      current: known === undefined ? initial : known,
      start: null,
      ease: FALLBACK_EASE,
      raf: null,
      subs: new Set(),
    };
    entries.set(key, e);
  }
  return e;
}

function step(key: string, e: Entry, startedAt: number) {
  const t = Math.min(1, Math.max(0, (performance.now() - startedAt) / MOTION.number));
  e.current = Math.round(e.from + (e.to - e.from) * e.ease(t));
  notify(e);
  if (t >= 1) {
    e.current = e.to;
    e.raf = null;
    lastShown.set(key, e.to);
    notify(e);
    return;
  }
  e.raf = requestAnimationFrame(() => step(key, e, startedAt));
}

function ensure(key: string, value: number) {
  const e = entryFor(key, value);
  if (e.raf !== null) cancelAnimationFrame(e.raf); // 鎵撴柇锛氫竴寰嬬敤褰撳墠鏄剧ず鍊奸噸鏂拌捣涓€鏉?
  if (e.current === value) {
    // 棣栧抚 / 鍊兼病鍙橈細鐩存帴钀藉畾锛屼笉婊氾紙鍐峰惎鍔ㄩ甯т笉婊氶潬杩欐潯锛?
    e.from = value;
    e.to = value;
    return;
  }
  if (prefersReducedMotion()) {
    // 鍑忓急鍔ㄦ晥锛氱洿鎺ョ粰缁堝€硷紝涓嶅缓 rAF銆佷笉寤惰繜
    e.from = value;
    e.to = value;
    e.current = value;
    lastShown.set(key, value);
    notify(e);
    return;
  }
  e.from = e.current;
  e.to = value;
  e.ease = readEaseOut();
  /* 璧风偣鏃堕棿鑷繁鎶擄細涓嶇敤 rAF 鐨勬椂闂存埑銆傜敤鏃堕棿鎴充細璁┿€屼笂涓€娆℃病璺戝畬鐨勫姩鐢汇€嶆妸璧风偣鐣欏湪杩囧幓锛?
     涓€甯у氨绠楀嚭 t>=1 鈫?鏁板瓧鐩存帴璺崇粓鍊硷紙绗竴娆″疄娴嬪氨鏄繖涔堛€屾粴瀹屼簡銆嶈€屾病浜虹湅瑙侊級銆?*/
  const startedAt = performance.now();
  e.raf = requestAnimationFrame(() => step(key, e, startedAt));
}

function subscribe(key: string, cb: () => void) {
  const e = entryFor(key, lastShown.get(key) ?? 0);
  e.subs.add(cb);
  return () => {
    e.subs.delete(cb);
    /* 鏈€鍚庝竴涓涓诲嵏杞斤紙鍚?StrictMode 鐨勬寕杞解啋鍗歌浇鈫掑啀鎸傝浇锛夛細鍙浣?*鐢ㄦ埛鏈€鍚庣湅鍒扮殑鏁?*锛?
       缁濅笉鑳藉啓鎴?e.to銆傚啓鎴愮洰鏍囧€?= 鎶婅捣鐐规姽鎺夛紝鍐嶆寕杞芥椂 ensure 鐪嬪埌銆屽凡鏄粓鍊笺€嶁啋 涓嶆粴銆?
       绗竴娆″疄娴嬪氨鏄繖涔堝潖鐨勶細鏃ュ織閲?3966ms 鍑虹幇 `set-unsub home.learned 10`锛?
       绱ф帴鐫€ 3967ms 鐨?ensure 灏辨槸 cur=10 / last=10锛屽姩鐢讳竴姝ユ病璺戙€?*/
    if (e.subs.size === 0) {
      if (e.raf !== null) {
        cancelAnimationFrame(e.raf);
        e.raf = null;
      }
      lastShown.set(key, e.current);
    }
  };
}

export interface RollingNumberProps {  /** 鐩爣鍊硷紙鏁存暟锛?*/
  value: number;
  /** 鍚屼竴鏁板瓧鐨勫涓涓诲繀椤荤敤鍚屼竴涓?key 鈥斺€?杩欐槸銆屽悓灞忓悓婧愬悓甯с€嶇殑鍞竴寮€鍏?*/
  memoKey: string;
  /** 棰勭暀浣嶆暟锛?:before 鐢?digits 涓?0 鎾戝锛屽繀椤?鈮?鍙兘鍑虹幇鐨勬渶澶т綅鏁?*/
  digits: number;
  /** 鏄剧ず鏍煎紡锛堝琛ラ浂锛夛紱榛樿 String */
  format?: (n: number) => string;
}

export function RollingNumber({ value, memoKey, digits, format }: RollingNumberProps) {
  const fmt = format ?? ((n: number) => String(n));
  const sub = useCallback((cb: () => void) => subscribe(memoKey, cb), [memoKey]);
  const snap = useCallback(() => entryFor(memoKey, value).current, [memoKey, value]);
  const current = useSyncExternalStore(sub, snap, snap);

  useEffect(() => {
    ensure(memoKey, value);
  }, [memoKey, value]);

  return (
    <span
      className="num-roll"
      data-num-key={memoKey}
      data-ghost={'0'.repeat(Math.max(1, digits))}
    >
      <span className="num-roll__live">{fmt(current)}</span>
    </span>
  );
}

/* ---------------------------------------------------------------------------
 * 寮€鍙戞湡鐘舵€侀挬瀛愶紙AGENTS.md銆?0 绉掓帰閽堛€嶏紝v13 璧峰己鍒讹級銆?
 * 鍔ㄦ晥 / 璺ㄦ寕杞界姸鎬佷笉璁稿彧鑳介潬璇?DOM 鍙嶆帹锛氫笂琛?entries / lastShown 鏄ā鍧椾綔鐢ㄥ煙鐨勶紝
 * 浠庡闈㈢湅涓嶈锛岀涓€娆℃煡銆屽洖棣栭〉涓嶆粴銆嶅氨鍙兘闈犲弽澶嶆敼婧愮爜鎵撴棩蹇楋紝鑺变簡 40 鍒嗛挓銆?
 * 鐜板湪鎺㈤拡鑴氭湰 scripts/probe-motion.js 鐩存帴璇?window.__motionState()銆?
 * 鐢熶骇鏋勫缓閲?import.meta.env.DEV 涓?false锛屾暣娈佃鎽囨帀锛屼笉澧炲姞鍖呬綋銆?
 * ------------------------------------------------------------------------- */
declare global {
  interface Window {
    __motionState?: () => {
      t: number;
      entries: {
        key: string;
        from: number;
        to: number;
        current: number;
        subs: number;
        raf: boolean;
      }[];
      lastShown: Record<string, number>;
    };
    __motionReset?: () => void;
  }
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__motionState = () => ({
    t: Math.round(performance.now()),
    entries: [...entries].map(([key, e]) => ({
      key,
      from: e.from,
      to: e.to,
      current: e.current,
      subs: e.subs.size,
      raf: e.raf !== null,
    })),
    lastShown: Object.fromEntries(lastShown),
  });
  /* 鍚屼竴涓〉闈㈤噷杩炵画璺戝娆℃帰閽堟椂鐢細娓呮帀妯″潡鎬侊紝鍥炲埌銆屽喎鍚姩銆嶃€?*/
  window.__motionReset = () => {
    for (const e of entries.values()) if (e.raf !== null) cancelAnimationFrame(e.raf);
    entries.clear();
    lastShown.clear();
  };
}
