'use client';
import { useGameStore } from '@/store/useGameStore';

function normalizePremium(v: unknown): 'DL' | 'TL' | 'DW' | 'TW' | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const s = v.trim().toUpperCase();
    if (s === '2C') return 'DL';
    if (s === '3C') return 'TL';
    if (s === '2W') return 'DW';
    if (s === '3W') return 'TW';
    if (s === '' || s === '  ') return null;
    return null;
  }
  return null;
}
const premiumClass = (code: unknown): string => {
  switch (normalizePremium(code)) {
    case 'TW': return 'bg-red-500';
    case 'DW': return 'bg-rose-300';
    case 'TL': return 'bg-teal-700';
    case 'DL': return 'bg-cyan-300';
    default:   return 'bg-sky-200';
  }
};

export function Board() {
  const board     = useGameStore(s => s.board);
  const layout    = useGameStore(s => s.layout);
  const start     = useGameStore(s => s.start);
  const direction = useGameStore(s => s.direction);
  const word      = useGameStore(s => s.word);
  const setStart  = useGameStore(s => s.setStart);
  const error = useGameStore(s => s.error);
  const computePreviewStatus = useGameStore(s => s.previewStatus);
  const status = computePreviewStatus();


  if (!board) return null;
  const size = board.length;

  const preview = new Set<string>();
  if (start && word) {
    for (let i = 0; i < word.length; i++) {
      const x = direction === 'row' ? start.x + i : start.x;
      const y = direction === 'col' ? start.y + i : start.y;
      if (y >= 0 && y < size && x >= 0 && x < size) preview.add(`${x},${y}`);
    }
  }
  const badPreview = !!start && !!word && status && !status.ok;

  return (
    <div className="mx-auto w-full max-w-[900px] p-4">
      <div className="grid grid-cols-[auto,1fr] grid-rows-[auto,1fr] gap-1">
        <div className="col-start-2 row-start-1 grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1 px-3 text-xs font-bold text-white/80">
          {Array.from({ length: size }).map((_, i) => (
            <div key={`top-${i}`} className="grid place-items-center">{i + 1}</div>
          ))}
        </div>

        <div className="col-start-1 row-start-2 grid grid-rows-[repeat(15,minmax(0,1fr))] gap-1 py-3 text-xs font-bold text-white/80">
          {Array.from({ length: size }).map((_, i) => (
            <div key={`left-${i}`} className="grid place-items-center">{i + 1}</div>
          ))}
        </div>

        <div className="col-start-2 row-start-2">
          <div className="relative aspect-square w-full">
            {error && (
              <div className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-3 py-1 text-white text-sm shadow">
                {error}
              </div>
            )}

            <div
              className="grid h-full gap-1 rounded-xl bg-slate-900 p-3"
              style={{ gridTemplateColumns: `repeat(${size},1fr)`, gridTemplateRows: `repeat(${size},1fr)` }}
            >
              {board.map((row: string[], y: number) =>
                row.map((cell: string, x: number) => {
                  const isStart   = !!start && start.x === x && start.y === y;
                  const isPreview = preview.has(`${x},${y}`);
                  const prem      = layout?.[y]?.[x];
                  const hasLetter = cell !== '.';
                  const centerStar = !hasLetter && x === 7 && y === 7;

                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setStart(x, y)}
                      className={[
                        'relative grid place-items-center rounded-md border transition-transform active:scale-95',
                        isStart ? 'ring-2 ring-sky-500 border-sky-600' : 'border-slate-700',
                        premiumClass(prem),
                        isPreview ? `outline outline-2 ${badPreview ? 'outline-red-500' : 'outline-amber-400'}` : '',
                      ].join(' ')}
                      title={`x=${x}, y=${y}`}
                    >
                      {!hasLetter && (
                        <span className="pointer-events-none select-none text-[10px] font-black tracking-wider text-slate-900/90">
                          {centerStar
                            ? '★'
                            : (() => {
                                const n = normalizePremium(prem);
                                if (n === 'TW') return 'TW';
                                if (n === 'DW') return 'DW';
                                if (n === 'TL') return 'TL';
                                if (n === 'DL') return 'DL';
                                return '';
                              })()}
                        </span>
                      )}

                      {hasLetter && (
                        <span className="pointer-events-none select-none rounded-[6px] bg-amber-100 px-2 py-1 text-base font-black text-slate-900 shadow-inner">
                          {cell}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
