'use client';

import { useGameStore } from '@/store/useGameStore';

type PremiumCode = 'DL' | 'TL' | 'DW' | 'TW' | null;

function normalizePremium(v: unknown): PremiumCode {
  if (v == null) return null;
  const s = String(v).trim().toUpperCase();
  if (!s || s === '.' || s === '  ') return null;

  // Podpora různých zápisů z backendu
  if (s === '3W' || s === 'TW') return 'TW';
  if (s === '2W' || s === 'DW') return 'DW';
  if (s === '3C' || s === '3L' || s === 'TL') return 'TL';
  if (s === '2C' || s === '2L' || s === 'DL') return 'DL';

  return null;
}

const premiumClass = (code: unknown): string => {
  switch (normalizePremium(code)) {
    case 'TW':
      return 'bg-red-500';
    case 'DW':
      return 'bg-rose-300';
    case 'TL':
      return 'bg-teal-700';
    case 'DL':
      return 'bg-cyan-300';
    default:
      // běžné pole
      return 'bg-sky-200';
  }
};

export function Board() {
  const board = useGameStore((s) => s.board);
  const layout = useGameStore((s) => s.layout);
  const start = useGameStore((s) => s.start);
  const direction = useGameStore((s) => s.direction);
  const word = useGameStore((s) => s.word);
  const setStart = useGameStore((s) => s.setStart);
  const error = useGameStore((s) => s.error);
  const computePreviewStatus = useGameStore((s) => s.previewStatus);
  const placeLetterPreview = useGameStore((s) => s.placeLetterPreview);

  const status = computePreviewStatus();

  if (!board) return null;
  const size = board.length;
  const center = Math.floor(size / 2);

  // souřadnice, kde se má vykreslit preview slova
  const previewCoords = new Set<string>();
  if (start && word) {
    for (let i = 0; i < word.length; i++) {
      const x = direction === 'row' ? start.x + i : start.x;
      const y = direction === 'col' ? start.y + i : start.y;
      if (y >= 0 && y < size && x >= 0 && x < size) {
        previewCoords.add(`${x},${y}`);
      }
    }
  }
  const badPreview = !!start && !!word && status && !status.ok;

  const handleDrop =
    (x: number, y: number, hasLetter: boolean) =>
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const letter =
        e.dataTransfer.getData('letter') || e.dataTransfer.getData('text/plain');
      if (!letter) return;
      if (hasLetter) return;

      const rackIndexStr = e.dataTransfer.getData('rackIndex');
      const rackIndex = rackIndexStr ? Number(rackIndexStr) : undefined;

      placeLetterPreview(x, y, letter, rackIndex);
    };

  return (
    <div className="mx-auto w-full max-w-[900px] p-4">
      <div className="grid grid-cols-[auto,1fr] grid-rows-[auto,1fr] gap-1">
        {/* horní čísla sloupců */}
        <div
          className="col-start-2 row-start-1 grid gap-1 px-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`top-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* levá čísla řádků */}
        <div
          className="col-start-1 row-start-2 grid gap-1 py-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`left-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* samotná deska */}
        <div className="col-start-2 row-start-2">
          <div className="relative aspect-square w-full">
            {error && (
              <div className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-3 py-1 text-white text-sm shadow">
                {error}
              </div>
            )}

            <div
              className="grid h-full gap-1 rounded-xl bg-slate-900 p-3"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isStart = !!start && start.x === x && start.y === y;
                  const isPreview = previewCoords.has(`${x},${y}`);
                  const prem = layout?.[y]?.[x];
                  const hasLetter = cell !== '.';
                  const isCenter = x === center && y === center;

                  // ghost písmeno pro preview (jen na prázdných polích)
                  let previewLetter: string | null = null;
                  if (!hasLetter && start && isPreview && word) {
                    const idx =
                      direction === 'row' ? x - start.x : y - start.y;
                    if (idx >= 0 && idx < word.length) {
                      previewLetter = word[idx] ?? null;
                    }
                  }

                  const premiumText = (() => {
                    if (!hasLetter) {
                      // střed = hvězda, ale barvu bere z layoutu (DW)
                      if (isCenter) return '★';
                      const n = normalizePremium(prem);
                      if (n === 'TW') return 'TW';
                      if (n === 'DW') return 'DW';
                      if (n === 'TL') return 'TL';
                      if (n === 'DL') return 'DL';
                    }
                    return '';
                  })();

                  const showTile = hasLetter || !!previewLetter;
                  const tileLetter = hasLetter ? cell : previewLetter ?? '';

                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setStart(x, y)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop(x, y, hasLetter)}
                      className={[
                        'relative grid place-items-center rounded-md border transition-transform active:scale-95',
                        isStart
                          ? 'ring-2 ring-sky-500 border-sky-600'
                          : 'border-slate-700',
                        premiumClass(prem),
                        isPreview
                          ? `outline outline-2 ${
                              badPreview ? 'outline-red-500' : 'outline-amber-400'
                            }`
                          : '',
                      ].join(' ')}
                      title={`x=${x + 1}, y=${y + 1}`}
                    >
                      {!showTile && premiumText && (
                        <span className="pointer-events-none select-none text-[10px] font-black tracking-wider text-slate-900/90">
                          {premiumText}
                        </span>
                      )}

                      {showTile && (
                        <span className="pointer-events-none select-none rounded-md bg-yellow-100 px-2 py-1 text-base font-black text-slate-900 shadow-inner">
                          {tileLetter}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
