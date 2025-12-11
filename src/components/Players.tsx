'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';

export function Players() {
  const n = useGameStore((s) => s.nPlayers);
  const cur = useGameStore((s) => s.currentPlayer);
  const points = useGameStore((s) => s.points);
  const nicknames = useGameStore((s) => s.playerNicknames);

  if (!n) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: n }).map((_, i) => {
        const name = nicknames[i] || `PLAYER${i + 1}`;
        const score = points?.[i] ?? 0;

        return (
          <div
            key={i}
            className={[
              'rounded-xl border p-4 bg-slate-900/40',
              cur === i ? 'ring-2 ring-sky-400' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-black">{name}</p>
              <span className="text-[11px] uppercase text-slate-400">
                {cur === i ? 'ON TURN' : 'WAITING'}
              </span>
            </div>

            <p className="text-sm text-slate-300">POINTS: {score}</p>
          </div>
        );
      })}
    </div>
  );
}
