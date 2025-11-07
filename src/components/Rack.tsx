'use client';
import { useGameStore } from '@/store/useGameStore';

export function Rack() {
  const cur = useGameStore(s => s.currentPlayer);
  const hands = useGameStore(s => s.hands);
  const letters = hands?.[cur] ?? [];

  const append = useGameStore(s => s.appendFromRack);
  const backspace = useGameStore(s => s.backspaceWord);
  const shuffle = useGameStore(s => s.shuffleRack);
  const word = useGameStore(s => s.word);

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={shuffle}
          className="rounded-lg border px-3 py-2 font-semibold"
          title="Shuffle"
        >
          ⤮
        </button>

        <div className="flex flex-1 items-center gap-2 overflow-x-auto rounded-xl border bg-slate-50 px-3 py-2">
          {letters.map((ch, i) => (
            <button
              key={`${ch}-${i}`}
              onClick={() => append(i)}
              className="inline-grid h-10 w-10 place-items-center rounded-md border bg-amber-100 font-black shadow-inner active:scale-95"
              title={`Přidat ${ch}`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="min-w-[140px] rounded-md border bg-white px-3 py-2 text-sm font-mono">
            {word || <span className="text-slate-400">—</span>}
          </div>
          <button
            onClick={backspace}
            className="rounded-lg border px-3 py-2 font-semibold"
            title="Backspace"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
