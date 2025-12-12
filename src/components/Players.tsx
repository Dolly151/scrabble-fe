'use client';

import { useGameStore } from '@/store/useGameStore';

function GhostRackTile({
  letter,
  value,
}: {
  letter: string;
  value: number;
}) {
  // větší, aby se vešlo písmeno i body, a průhledné aby ladilo s tmavým UI
  return (
    <div
      className={[
        'relative grid place-items-center',
        'w-8 h-8 rounded-md',
        'border border-white/15',
        'bg-white/10 text-white/70',
        'shadow-none',
        'select-none',
      ].join(' ')}
    >
      <span className="text-sm font-black leading-none">{letter}</span>
      <span className="absolute bottom-[2px] right-[3px] text-[10px] font-bold leading-none text-white/60">
        {value}
      </span>
    </div>
  );
}

function GhostRackEmpty() {
  return (
    <div className="w-8 h-8 rounded-md border border-white/10 bg-transparent" />
  );
}

export function Players() {
  const n = useGameStore((s) => s.nPlayers);
  const cur = useGameStore((s) => s.currentPlayer);
  const points = useGameStore((s) => s.points);
  const nicknames = useGameStore((s) => s.playerNicknames);

  // U tebe jsou hands string[][] (písmena), ne Tile[]
  const hands = useGameStore((s) => s.hands) as unknown as Record<number, string[]>;
  const letterValues = useGameStore((s) => s.letterValues);

  if (!n) return null;

  const getValue = (ch: string) =>
    (letterValues?.[ch] ?? letterValues?.[ch.toUpperCase()] ?? 0) as number;

  return (
    <div className="grid grid-cols-1 gap-4">
      {Array.from({ length: n }).map((_, i) => {
        const name = nicknames[i] || `PLAYER${i + 1}`;
        const score = points?.[i] ?? 0;

        const rack = hands?.[i] ?? []; // string[] délky 7 (nebo méně)

        return (
          <div
            key={i}
            className={[
              'rounded-xl border p-4 bg-slate-900/40',
              cur === i ? 'ring-2 ring-sky-400' : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <p className="text-lg font-black">{name}</p>

                {/* ghost rack vedle jména */}
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((__, idx) => {
                    const ch = (rack[idx] ?? ' ').toString();
                    if (!ch || ch === ' ') return <GhostRackEmpty key={idx} />;

                    return (
                      <GhostRackTile
                        key={idx}
                        letter={ch.toUpperCase()}
                        value={getValue(ch)}
                      />
                    );
                  })}
                </div>
              </div>

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
