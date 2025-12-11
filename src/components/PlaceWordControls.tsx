'use client';

import { FormEvent } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function PlaceWordControls() {
  const start = useGameStore((s) => s.start);
  const direction = useGameStore((s) => s.direction);
  const word = useGameStore((s) => s.word);
  const setDirection = useGameStore((s) => s.setDirection);
  const setWord = useGameStore((s) => s.setWord);
  const place = useGameStore((s) => s.place);
  const clear = useGameStore((s) => s.clear);
  const loading = useGameStore((s) => s.loading);
  const previewStatus = useGameStore((s) => s.previewStatus);

  const status = previewStatus();
  const canSubmit = !!start && !!word && status.ok && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await place();
  };

  const startLabel = start
    ? `${start.x + 1}, ${start.y + 1}`
    : '— klikni na buňku';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 bg-slate-900/40 space-y-3"
    >
      <p className="text-xs uppercase text-slate-400 mb-1">
        START CELL: <span className="font-semibold text-slate-100">{startLabel}</span>
      </p>

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="direction"
            value="row"
            checked={direction === 'row'}
            onChange={() => setDirection('row')}
          />
          Row (→)
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            name="direction"
            value="col"
            checked={direction === 'col'}
            onChange={() => setDirection('col')}
          />
          Col (↓)
        </label>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="zadej slovo z tvého racku"
          value={word}
          onChange={(e) => setWord(e.target.value)}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="px-4 py-2 rounded-md bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm font-semibold"
        >
          PLACE WORD
        </button>
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 rounded-md border border-slate-600 text-sm"
        >
          Cancel
        </button>
      </div>

      {/* malý hint / chyba */}
      {status.overflow && (
        <p className="text-xs text-amber-400">
          Slovo se nevejde na desku.
        </p>
      )}
      {status.conflict && (
        <p className="text-xs text-amber-400">
          Slovo koliduje s písmeny už na desce.
        </p>
      )}
      {status.missing && status.missing.length > 0 && (
        <p className="text-xs text-amber-400">
          Chybí ti dlaždice: {status.missing.join(', ')}
        </p>
      )}
      {!status.ok && !status.overflow && !status.conflict && (!status.missing || status.missing.length === 0) && (
        <p className="text-xs text-slate-400">
          Vyber startovní buňku, směr a napiš slovo.
        </p>
      )}
    </form>
  );
}
