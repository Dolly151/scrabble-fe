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

  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: n }).map((_, playerIndex) => {
        const name = nicknames[playerIndex] || `PLAYER${playerIndex + 1}`;
        const rack = Array.isArray(hands?.[playerIndex])
          ? hands[playerIndex]
          : [];

        // DŮLEŽITÉ:
        // Použité indexy (wordRackIndices) platí jen pro hráče na tahu.
        // Pro ostatní hráče necháme usedSet prázdný.
        const usedSet =
          playerIndex === cur
            ? new Set(
                wordRackIndices.filter(
                  (i): i is number =>
                    i !== null && i !== undefined,
                ),
              )
            : new Set<number>();

        return (
          <div
            key={playerIndex}
            className={[
              'rounded-xl border p-4 bg-slate-900/40',
              playerIndex === cur ? 'ring-2 ring-sky-400' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg font-black">{name}</p>
              <span className="text-[11px] uppercase text-slate-400">
                {playerIndex === cur ? 'ON TURN' : 'WAITING'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {rack.map((ch, rackIndex) => {
                const value = letterValues[ch] ?? 0;
                const used = usedSet.has(rackIndex);

                const tileClasses = [
                  'relative inline-grid w-8 h-8 place-items-center rounded-md border font-black select-none text-sm',
                  used
                    ? 'opacity-30 cursor-not-allowed'
                    : 'cursor-default bg-yellow-200 shadow-inner',
                  'border-yellow-700 text-slate-900',
                ].join(' ');

                // U ostatních hráčů racky většinou nejsou interaktivní,
                // u aktuálního hráče můžeme nechat klik přidávat písmena:
                const interactive = playerIndex === cur && !used;

                return (
                  <div
                    key={rackIndex}
                    className={tileClasses}
                    onClick={
                      interactive
                        ? () => appendFromRack(rackIndex)
                        : undefined
                    }
                    title={
                      interactive
                        ? 'Klikni pro přidání do aktuálního slova'
                        : undefined
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
