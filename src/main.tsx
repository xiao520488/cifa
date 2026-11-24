import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { preloadBook } from './lib/books';
import { loadStore } from './lib/storage';
import './styles/tokens.css';
import './styles/app.css';
import './styles/skin-fonts.css';
import './styles/skin-hooks.css';
import './styles/skins/foundry.css';
import './styles/skins/instrument.css';
import './styles/skins/broadsheet.css';

const container = document.getElementById('root');
if (!container) throw new Error('未找到 #root 挂载点');

/**
 * 先加载当前阶段的词库，再挂载 App。
 *
 * 顺序很重要：调度引擎在 App 挂载时就用「当前词库」灌未学池，词库还没到的话
 * 池子是空的，当天的「新词计划」会被结算成 0 并落盘（见 NOTES 的坑）。
 * 词库是 `import()` 进来的独立 chunk，只有这一本会进首屏。
 */
function Boot() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const stage = loadStore().profile.stage;
    preloadBook(stage)
      .then(() => setReady(true))
      .catch(() => setFailed(true));
  }, []);

  // 词库加载失败（离线且没缓存）时**不能**挂载 App：引擎会拿空词池 seed，
  // 把当天的新词计划结算成 0 并落盘。这里给一个重试入口，绝不带着空词库进主流程。
  if (failed) {
    return (
      <div className="boot-error">
        <p className="boot-error__title">词库没有加载出来</p>
        <p className="boot-error__text">第一次打开需要联网下载词库；连上网络后重试即可，已学的进度不会受影响。</p>
        <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
          重新加载
        </button>
      </div>
    );
  }

  if (!ready) return null;
  return <App />;
}

createRoot(container).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* 离线增强失败不影响主流程 */
    });
  });
}
