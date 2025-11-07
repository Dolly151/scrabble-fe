'use client';
import { useGameStore } from '@/store/useGameStore';

export function PlayerCards() {
  const n = useGameStore(s => s.nPlayers);
  const cur = useGameStore(s => s.currentPlayer);
  if (!n) return null;

  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-xl border p-4 bg-slate-900/40',
            cur === i ? 'ring-2 ring-sky-400' : '',
          ].join(' ')}
        >
          <p className="text-lg font-black">PLAYER{i + 1}</p>
          <p className="text-sm text-slate-300">POINTS: —</p>
        </div>
      ))}
    </div>
  );
}
