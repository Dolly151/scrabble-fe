'use client';
import { useGameStore } from '@/store/useGameStore';

export function Players() {
  const n = useGameStore(s => s.nPlayers);
  const hands = useGameStore(s => s.hands);
  const cur = useGameStore(s => s.currentPlayer);
  if (!n) return null;

  return (
    <div className="mx-auto max-w-[900px] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: n }).map((_, i) => {
        const rack = Array.isArray(hands[i]) ? hands[i] : []; // ← bezpečně
        return (
          <div key={i} className={`rounded-xl border p-4 ${cur === i ? 'ring-2 ring-sky-400' : ''}`}>
            <p className="font-black mb-2">PLAYER{i + 1}</p>
            <div className="flex flex-wrap gap-2">
              {rack.map((ch, idx) => (
                <span key={idx} className="inline-grid place-items-center w-8 h-8 rounded-md border font-bold">
                  {ch}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
