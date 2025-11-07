'use client';
import { useGameStore } from '@/store/useGameStore';

export function PlaceWordControls() {
  const start = useGameStore(s => s.start);
  const direction = useGameStore(s => s.direction);
  const setDirection = useGameStore(s => s.setDirection);
  const word = useGameStore(s => s.word);
  const setWord = useGameStore(s => s.setWord);
  const place = useGameStore(s => s.place);
  const clear = useGameStore(s => s.clear);
  const loading = useGameStore(s => s.loading);
  const computePreviewStatus = useGameStore(s => s.previewStatus);
  const status = computePreviewStatus();


  const disabled = !start || !word || loading || (status && !status.ok);

  return (
    <div className="mx-auto max-w-[900px] p-4 space-y-3">
      <div className="rounded-xl border p-4">
        <p className="text-sm text-slate-600">
          START CELL: {start ? `x=${start.x}, y=${start.y}` : '— klikni na buňku'}
        </p>

        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" checked={direction === 'row'} onChange={() => setDirection('row')} />
            <span>Row (→)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={direction === 'col'} onChange={() => setDirection('col')} />
            <span>Col (↓)</span>
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2"
            placeholder="zadej slovo z tvého racku"
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
          <button
            className="rounded-lg bg-sky-700 px-4 py-2 font-bold text-white disabled:opacity-50"
            disabled={disabled}
            onClick={place}
          >
            PLACE WORD
          </button>
          <button
            className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-50"
            disabled={loading || (!start && !word)}
            onClick={clear}
          >
            Cancel
          </button>
        </div>

        {/* přátelská hláška co přesně je špatně */}
        {status && !status.ok && (
          <p className="mt-2 text-sm text-amber-700">
            {!start || !word ? 'Vyber buňku a napiš slovo.' : (
              <>
                {status.overflow && 'Slovo přesahuje mimo desku. '}
                {status.conflict && 'Konflikt s existujícím písmenem. '}
                {status.missing && status.missing.length > 0 && (
                  <>Chybí v ruce: {status.missing.join(', ')}.</>
                )}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
