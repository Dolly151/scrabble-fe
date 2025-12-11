'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Players() {
  const n = useGameStore((s) => s.nPlayers);
  const hands = useGameStore((s) => s.hands);
  const cur = useGameStore((s) => s.currentPlayer);
  const nicknames = useGameStore((s) => s.playerNicknames);
  const wordRackIndices = useGameStore((s) => s.wordRackIndices);
  const appendFromRack = useGameStore((s) => s.appendFromRack);
  const letterValues = useGameStore((s) => s.letterValues);

  if (!n) return null;

  const usedSet = new Set(
    wordRackIndices.filter((i): i is number => i !== null && i !== undefined)
  );

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    rackIndex: number
  ) => {
    e.dataTransfer.setData('letter', ch);
    e.dataTransfer.setData('rackIndex', String(rackIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="mx-auto max-w-[900px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: n }).map((_, i) => {
        const rack = Array.isArray(hands[i]) ? hands[i] : [];
        const isCurrent = i === cur;
        const name = nicknames[i] || `Player${i + 1}`;

        return (
          <div
            key={i}
            className={[
              'rounded-xl border p-4 bg-slate-900/40',
              isCurrent ? 'ring-2 ring-sky-400' : '',
            ].join(' ')}
          >
            <p className="font-black mb-2">{name}</p>

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

                if (!isCurrent) {
                  return (
                    <div key={idx} className={tileClasses}>
                      {ch}
                      <span className="absolute bottom-[2px] right-[4px] text-[10px] font-bold">
                        {value}
                      </span>
                    </div>
                  );
                }

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
        );
      })}
    </div>
  );
}
