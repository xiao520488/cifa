// nocturne 顶栏小标签在「矩阵盲区」宽度段（400–768）的实测守卫。
//
// 为什么要它（v11.1 实测发现）：`.topbar__meta` 只在 <400 整条隐藏（nocturne.css §14），
// 而两套主矩阵的视口是 360 / 390 / 768 / 1440 —— **400–767 从来没被量过**。
// 13px 时代这段就已经在静默裁字（400/412 需要 166px 只有 142/151px），
// 把字号提到 14px（需要 178px）更会把裁切扩到 430。没有这段扫描，两轮都会「全绿」而字被吃掉。
//
// 判据四条：文档零横滚、`.topbar__meta` 不被自身 overflow:hidden 裁（scrollWidth <= clientWidth+1）、
// 顶栏内可聚焦件仍 >=44px、且不出列。
//
// 跑法（隔离 context，不碰真实档案）：
//   node run-audit-node.js D:\背单词\scripts\audit-topbar-narrow.js '{}'
//   带截图：'{"__narrow_shots":"1","__narrow_widths":"[412,460,768]","__narrow_prefix":"vE"}'
//   配置键同族：__narrow_widths / __narrow_themes / __narrow_shots / __narrow_prefix
// 判据：clipped / overflow / tapFail / outCol 四个数组全空。
//
// 规则 7：页面侧代码看不见 Node 闭包，主题一律走 args 注入（见下面 evaluate 的第二个参数）。
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  // 配置键与 audit-screens / audit-readouts-band 同族命名，写在 /icon.svg 的 localStorage 里
  await page.goto(BASE + '/icon.svg');
  const cfg = await page.evaluate(() => ({
    widths: JSON.parse(localStorage.getItem('__narrow_widths') || 'null'),
    themes: JSON.parse(localStorage.getItem('__narrow_themes') || 'null'),
    shots: localStorage.getItem('__narrow_shots') === '1',
    prefix: localStorage.getItem('__narrow_prefix') || 'vE',
  }));
  const widths = cfg.widths || [400, 412, 430, 440, 452, 459, 460, 480, 540, 600, 680, 768];
  const out = [];
  for (const theme of (cfg.themes || ['dark', 'light'])) {
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(BASE + '/icon.svg');
      await page.evaluate((t) => {
        const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
        s.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, s.profile, { skin: 'nocturne', theme: t });
        localStorage.setItem('cijian.v1', JSON.stringify(s));
      }, theme);
      await page.goto(BASE + '/');
      await page.waitForTimeout(500);
      const r = await page.evaluate(() => {
        const el = document.querySelector('.topbar__meta');
        const tb = document.querySelector('.topbar');
        const rect = (n) => (n ? n.getBoundingClientRect() : null);
        const box = rect(el);
        const vis = el && getComputedStyle(el).display !== 'none';
        const kids = tb ? [...tb.querySelectorAll('button,a,[role=button]')] : [];
        const small = kids.filter((k) => { const b = rect(k); return b && (b.width < 43.5 || b.height < 43.5); }).map((k) => (k.className || k.tagName) + ' ' + Math.round(rect(k).width) + '×' + Math.round(rect(k).height));
        const outCol = kids.filter((k) => { const b = rect(k); return b && (b.left < -0.5 || b.right > document.documentElement.clientWidth + 0.5); }).map((k) => k.className || k.tagName);
        return {
          w: window.innerWidth,
          visible: !!vis,
          // 只报**可见**那几段的文字：textContent 会把 display:none 的子段也算进来，
          // 用它判断「这段宽度下到底显示了什么」会得出假结论（v11.1 差点被它骗过去）
          text: el ? [...el.children].filter((c) => getComputedStyle(c).display !== 'none').map((c) => c.textContent.trim()).join(' / ') : null,
          fontSize: el ? getComputedStyle(el).fontSize : null,
          scrollW: el ? el.scrollWidth : null,
          clientW: el ? el.clientWidth : null,
          clipped: el ? el.scrollWidth > el.clientWidth + 1 : false,
          docOvf: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          smallTap: small,
          outCol,
        };
      });
      if (cfg.shots) await page.screenshot({ path: `${cfg.prefix}-nocturne-${theme}-${w}.png`, scale: 'css' });
      out.push({ theme, ...r });
    }
  }
  await page.goto(BASE + '/icon.svg');
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
    s.profile = Object.assign({}, s.profile, { skin: 'paper', theme: 'light' });
    localStorage.setItem('cijian.v1', JSON.stringify(s));
  });
  return {
    n: out.length,
    clipped: out.filter((r) => r.clipped).map((r) => `${r.theme}/${r.w}/${r.scrollW}>${r.clientW}`),
    overflow: out.filter((r) => r.docOvf).map((r) => `${r.theme}/${r.w}`),
    tapFail: out.filter((r) => r.smallTap.length).map((r) => `${r.theme}/${r.w}:${r.smallTap.join('|')}`),
    outCol: out.filter((r) => r.outCol.length).map((r) => `${r.theme}/${r.w}:${r.outCol.join('|')}`),
    samples: out.map((r) => `${r.theme}/${r.w} vis=${r.visible} fs=${r.fontSize} ${r.scrollW}>${r.clientW}${r.clipped ? ' CUT' : ''}「${r.text}」`),
  };
}
