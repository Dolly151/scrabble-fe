'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Rack() {
  const cur = useGameStore((s) => s.currentPlayer);
  const hands = useGameStore((s) => s.hands);
  const wordRackIndices = useGameStore((s) => s.wordRackIndices);
  const appendFromRack = useGameStore((s) => s.appendFromRack);
  const letterValues = useGameStore((s) => s.letterValues);

  const rack = Array.isArray(hands?.[cur]) ? hands[cur] : [];

  const usedSet = new Set(
    wordRackIndices.filter(
      (i): i is number => i !== null && i !== undefined,
    ),
  );

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    rackIndex: number,
  ) => {
    e.dataTransfer.setData('letter', ch);
    e.dataTransfer.setData('rackIndex', String(rackIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="rounded-xl border bg-slate-900/40 px-4 py-3">
        <p className="text-xs uppercase text-slate-400 mb-2">
          RACK: CURRENT PLAYER
        </p>
        <div className="flex flex-wrap gap-2">
          {rack.map((ch, idx) => {
            const value = letterValues[ch] ?? 0;
            const used = usedSet.has(idx);

            const tileClasses = [
              'relative inline-grid w-10 h-10 place-items-center rounded-md border font-black select-none text-lg',
              used
                ? 'opacity-30 cursor-not-allowed'
                : 'cursor-grab bg-yellow-200 shadow-inner hover:bg-yellow-300',
              'border-yellow-700 text-slate-900',
            ].join(' ');

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                draggable={!used}
                onClick={used ? undefined : () => appendFromRack(idx)}
                onDragStart={
                  used
                    ? undefined
                    : (e) => handleDragStart(e, ch, idx)
                }
                className={tileClasses}
                title={
                  used
                    ? 'Už použito v aktuálním slovu'
                    : 'Přetáhni na desku nebo klikni pro přidání'
                }
              >
                {ch}
                <span className="absolute bottom-[2px] right-[4px] text-[10px] font-bold">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
