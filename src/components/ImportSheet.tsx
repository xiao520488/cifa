import { useMemo, useState } from 'react';
import { parseWordList, type ParseIssue } from '../lib/csv';
import type { Word } from '../lib/types';
import { IconAlert } from './Icons';
import { Sheet } from './Modal';

interface ImportSheetProps {
  onClose: () => void;
  onImport: (words: Word[]) => void;
}

const PLACEHOLDER = `输入或粘贴词表，一行一个词。例如：
abandon, /əˈbændən/, v. 放弃；抛弃;n. 放任
benefit  /ˈbenɪfɪt/  n. 好处；v. 有益于
deliberate, /dɪˈlɪbərət/, adj. 故意的；深思熟虑的`;

export function ImportSheet({ onClose, onImport }: ImportSheetProps) {
  const [text, setText] = useState('');
  const { words, issues } = useMemo(() => {
    if (!text.trim()) return { words: [] as Word[], issues: [] as ParseIssue[] };
    return parseWordList(text);
  }, [text]);

  return (
    <Sheet
      title="导入词表"
      description="支持逗号或空格分隔；多个义项用 ; 或 | 分开，「；」只分隔同一个义项里的近义词。表头、空行与 # 注释会自动跳过。"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={words.length === 0}
            onClick={() => onImport(words)}
          >
            {words.length > 0 ? `导入 ${words.length} 个词` : '导入词表'}
          </button>
        </>
      }
    >
      <label className="sr-only" htmlFor="import-text">
        词表内容
      </label>
      <textarea
        id="import-text"
        className="textarea"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        data-autofocus
      />
      <div className="parse-summary" aria-live="polite">
        <span>
          可导入 <strong>{words.length}</strong> 个词
          {issues.length > 0 ? ` · ${issues.length} 行需要修正` : ''}
        </span>
        <span>不会覆盖已有词库</span>
      </div>
      {issues.length > 0 ? (
        <ul className="issues">
          {issues.slice(0, 6).map((issue) => (
            <li key={`${issue.line}-${issue.reason}`}>
              <IconAlert size={13} />
              <span>
                第 {issue.line} 行：{issue.reason}
              </span>
            </li>
          ))}
          {issues.length > 6 ? <li>…还有 {issues.length - 6} 行未显示</li> : null}
        </ul>
      ) : null}
    </Sheet>
  );
}
