'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Rack() {
  const cur = useGameStore((s) => s.currentPlayer);
  const hands = useGameStore((s) => s.hands);
  const letters = hands?.[cur] ?? [];

  const append = useGameStore((s) => s.appendFromRack);
  const backspace = useGameStore((s) => s.backspaceWord);
  const shuffle = useGameStore((s) => s.shuffleRack);
  const word = useGameStore((s) => s.word);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    index: number,
  ) => {
    // pro kontrolu, klidně si můžeš nechat v konzoli:
    // console.log('drag start', ch, index);
    e.dataTransfer.setData('letter', ch);
    e.dataTransfer.setData('rackIndex', String(index));
    // trochu UX
    e.dataTransfer.effectAllowed = 'move';
  };

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
            <div
              key={`${ch}-${i}`}
              role="button"
              tabIndex={0}
              onClick={() => append(i)} // klik pořád přidá písmeno do inputu
              draggable
              onDragStart={(e) => handleDragStart(e, ch, i)}
              className="inline-grid h-10 w-10 cursor-grab place-items-center rounded-md border bg-amber-100 font-black shadow-inner active:scale-95 select-none"
              title={`Přidat ${ch}`}
            >
              {ch}
            </div>
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
