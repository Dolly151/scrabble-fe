'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Rack() {
  const cur = useGameStore((s) => s.currentPlayer);
  const hands = useGameStore((s) => s.hands);
  const letters = hands?.[cur] ?? [];

  const backspace = useGameStore((s) => s.backspaceWord);
  const word = useGameStore((s) => s.word);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    index: number,
  ) => {
    e.dataTransfer.setData('letter', ch);
    e.dataTransfer.setData('rackIndex', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto rounded-xl border bg-slate-50 px-3 py-2">
          {letters.map((ch, i) => (
            <div
              key={`${ch}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, ch, i)}
              className="inline-grid h-10 w-10 cursor-grab place-items-center rounded-md border bg-amber-100 font-black shadow-inner active:scale-95 select-none"
              title={`Přetáhni ${ch} na desku`}
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
            className="rounded-lg border px-3 py-2 text-sm font-semibold"
            title="Backspace"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
}
