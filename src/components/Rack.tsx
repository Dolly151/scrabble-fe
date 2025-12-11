'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Rack() {
  const cur = useGameStore((s) => s.currentPlayer);
  const hands = useGameStore((s) => s.hands);
  const wordRackIndices = useGameStore((s) => s.wordRackIndices);
  const appendFromRack = useGameStore((s) => s.appendFromRack);
  const letterValues = useGameStore((s) => s.letterValues);
  const playerNicknames = useGameStore((s) => s.playerNicknames);

  const exchanging = useGameStore((s) => s.exchanging);
  const exchangeSelection = useGameStore((s) => s.exchangeSelection);
  const toggleExchangeIndex = useGameStore((s) => s.toggleExchangeIndex);

  if (cur == null || !hands) return null;

  const rack = Array.isArray(hands[cur]) ? hands[cur] : [];

  // dlaždice, které už jsou použité v aktuálním slově
  const usedSet = new Set(
    wordRackIndices.filter(
      (i): i is number => i !== null && i !== undefined,
    ),
  );
  // dlaždice vybrané k výměně
  const selectedSet = new Set(exchangeSelection);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    rackIndex: number,
  ) => {
    if (exchanging) return; // v režimu výměny nedraggujeme
    e.dataTransfer.setData('letter', ch);
    e.dataTransfer.setData('rackIndex', String(rackIndex));
    e.dataTransfer.effectAllowed = 'move';
  };

  const name = playerNicknames[cur] || `PLAYER ${cur + 1}`;

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="rounded-xl border bg-slate-900/40 px-4 py-3">
        <p className="text-xs uppercase text-slate-400 mb-2">
          RACK:{' '}
          <span className="font-semibold text-slate-100">{name}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {rack.map((ch, idx) => {
            const value = letterValues ? letterValues[ch] ?? 0 : 0;
            const used = usedSet.has(idx);
            const selected = selectedSet.has(idx);

            const tileClasses = [
              'relative inline-grid w-10 h-10 place-items-center rounded-md border font-black select-none text-lg',
              used
                ? 'opacity-30 cursor-not-allowed'
                : 'bg-yellow-200 shadow-inner hover:bg-yellow-300',
              exchanging && !selected ? 'cursor-pointer' : '',
              exchanging && selected ? 'cursor-pointer ring-2 ring-sky-400' : '',
              !exchanging && !used ? 'cursor-grab' : '',
              'border-yellow-700 text-slate-900',
            ].join(' ');

            const handleClick = () => {
              if (exchanging) {
                // v režimu výměny jen přepínáme výběr
                toggleExchangeIndex(idx);
              } else if (!used) {
                // normální režim – přidat písmeno do slova
                appendFromRack(idx);
              }
            };

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                draggable={!exchanging && !used}
                onClick={handleClick}
                onDragStart={
                  !exchanging && !used
                    ? (e) => handleDragStart(e, ch, idx)
                    : undefined
                }
                className={tileClasses}
                title={
                  exchanging
                    ? selected
                      ? 'Odebrat z výměny'
                      : 'Přidat do výměny'
                    : used
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
