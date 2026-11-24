import { splitMeaning } from '../lib/words';
import type { Word } from '../lib/types';

interface WordRowProps {
  word: Word;
  /** 本批中的序号，从 1 开始 */
  index: number;
  showAll: boolean;
  hideWord: boolean;
  hideMeaning: boolean;
  /** 本行是否已被单独偷看 */
  revealed: boolean;
  onReveal: () => void;
}

export function WordRow({
  word,
  index,
  showAll,
  hideWord,
  hideMeaning,
  revealed,
  onReveal,
}: WordRowProps) {
  const wordHidden = hideWord && !revealed;
  const meaningHidden = hideMeaning && !revealed;
  const peekable = wordHidden || meaningHidden;
  const meanings = showAll ? word.m : word.m.slice(0, 1);

  return (
    <li
      className={peekable ? 'word-row word-row--peekable' : 'word-row'}
      onClick={peekable ? onReveal : undefined}
      onKeyDown={
        peekable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onReveal();
              }
            }
          : undefined
      }
      role={peekable ? 'button' : undefined}
      tabIndex={peekable ? 0 : undefined}
      aria-label={peekable ? `显示第 ${index} 个词被隐藏的内容` : undefined}
    >
      <span className="word-row__index" aria-hidden="true">
        {String(index).padStart(2, '0')}
      </span>
      <div className="word-row__body">
        <div className="word-row__head">
          <span
            className={wordHidden ? 'word-row__word masked' : 'word-row__word'}
            aria-hidden={wordHidden || undefined}
          >
            {word.w}
          </span>
          {word.ph ? (
            <span
              className={wordHidden ? 'word-row__ph masked' : 'word-row__ph'}
              aria-hidden={wordHidden || undefined}
            >
              {word.ph}
            </span>
          ) : null}
        </div>
        <div className="word-row__meanings">
          {meanings.map((meaning, senseIndex) => {
            const { pos, body } = splitMeaning(meaning);
            return (
              <p
                key={`${word.w}-${senseIndex}`}
                className={senseIndex === 0 ? 'meaning meaning--main' : 'meaning meaning--extra'}
              >
                <span
                  className={meaningHidden ? 'masked' : undefined}
                  aria-hidden={meaningHidden || undefined}
                >
                  {pos ? <span className="meaning__pos">{pos}</span> : null}
                  {body}
                </span>
              </p>
            );
          })}
        </div>
      </div>
    </li>
  );
}
