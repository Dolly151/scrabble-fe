'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { LogEvent } from '@/types/api';

// Narrowed event types
type WordPlacement = Extract<LogEvent, { type: 'word_placement' }>;
type LettersReplaced = Extract<LogEvent, { type: 'letters_replaced' }>;

function dirArrow(direction?: string) {
  if (direction === 'row') return '→';
  if (direction === 'col') return '↓';
  return '';
}

// Type guards without using `any`
// Works even if LogEvent includes a generic base event
function isWordPlacement(event: LogEvent): event is WordPlacement {
  return (
    event.type === 'word_placement' &&
    typeof (event as unknown as { word?: unknown }).word === 'string' &&
    typeof (event as unknown as { x?: unknown }).x === 'number' &&
    typeof (event as unknown as { y?: unknown }).y === 'number'
  );
}

function isLettersReplaced(event: LogEvent): event is LettersReplaced {
  return event.type === 'letters_replaced';
}

export function MoveHistory({ compact = false }: { compact?: boolean }) {
  const log = useGameStore((s) => s.log);
  const playerNicknames = useGameStore((s) => s.playerNicknames);

  // Sort events by time (newest first)
  const rows = useMemo(() => {
    const sorted = [...(log ?? [])];
    sorted.sort((a, b) => (b.time_epoch ?? 0) - (a.time_epoch ?? 0));
    return sorted;
  }, [log]);

  // Height depends on placement (compact under rack vs full panel)
  const maxHeightClass = compact ? 'max-h-[180px]' : 'max-h-[320px]';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">
          Move history
        </h3>
        <span className="text-[11px] text-slate-400">
          {rows.length} events
        </span>
      </div>

      <div className={`${maxHeightClass} overflow-auto pr-1`}>
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-950/80">
            <tr className="text-slate-300">
              <th className="py-2 pr-2 text-left">Player</th>
              <th className="py-2 pr-2 text-left">Action</th>
              <th className="py-2 pr-2 text-left">Detail</th>
              <th className="py-2 text-right">Points</th>
            </tr>
          </thead>

          <tbody className="text-slate-200">
            {rows.map((event) => {
              const player =
                typeof event.player === 'number'
                  ? playerNicknames[event.player] ??
                    `Player ${event.player + 1}`
                  : '—';

              let detail = event.message ?? '';
              let points: number | null = null;

              if (isWordPlacement(event)) {
                detail = `${event.word} [${event.x + 1},${event.y + 1}] ${dirArrow(
                  event.direction
                )}`;
                points = event.points ?? null;
              } else if (event.type === 'turn_skipped') {
                detail = 'Turn skipped';
              } else if (isLettersReplaced(event)) {
                detail = `Exchanged ${event.number_of_letters ?? '?'} letters`;
              }

              return (
                <tr
                  key={event.event_id}
                  className="border-t border-slate-800/60"
                >
                  <td className="py-2 pr-2">{player}</td>
                  <td className="py-2 pr-2 uppercase text-slate-300">
                    {event.type.replaceAll('_', ' ')}
                  </td>
                  <td className="py-2 pr-2">{detail}</td>
                  <td className="py-2 text-right">
                    {points !== null ? points : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">
            No moves yet.
          </div>
        )}
      </div>
    </div>
  );
}
