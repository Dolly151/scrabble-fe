/*
 *  ###################
 *  #                 #
 *  #   #####         #
 *  #        ######   #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #        ##       #
 *  #                 #
 *  ###################
 *
 * Faculty of Information Technologies
 * Brno University of Technology
 * User Interface Programming (ITU)
 *
 * File: src/components/MoveHistory.tsx
 *
 * Description:
 *  Component for displaying the move history (event log) in the Scrabble game.
 *  Data are read from the global store and presented in a table:
 *   - sorting events from newest first
 *   - mapping event types to human-readable "Detail" and "Points"
 *   - sticky table header + scrollable body
 *   - optional compact mode for smaller panels
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/useGameStore';
import type { LogEvent } from '@/types/api';

/*
 * Narrowing union types for specific events that we want to handle in the UI.
 *
 * Note: Using Extract<LogEvent, ...> can resolve to `never` if the discriminator
 * values do not exist in the LogEvent union (or if the union is generated differently).
 * Therefore, we define UI-level shapes that extend LogEvent and type-guard into them.
 */
type WordPlacement = LogEvent & {
  type: 'word_placement';
  word: string;
  x: number;
  y: number;
  direction?: 'row' | 'col';
  points?: number;
};

type LettersReplaced = LogEvent & {
  type: 'letters_replaced';
  number_of_letters?: number;
};

/*
 * Helper visualization of word placement direction:
 *  - "row" = horizontal (→)
 *  - "col" = vertical (↓)
 */
function dirArrow(direction?: string) {
  if (direction === 'row') return '→';
  if (direction === 'col') return '↓';
  return '';
}

/*
 * Type guard for the "word_placement" event.
 * We check not only `type`, but also that the event contains expected fields.
 * This is useful if LogEvent can also contain more generic/optional data.
 */
function isWordPlacement(event: LogEvent): event is WordPlacement {
  const e = event as Record<string, unknown>;

  return (
    event.type === 'word_placement' &&
    typeof e.word === 'string' &&
    typeof e.x === 'number' &&
    typeof e.y === 'number'
  );
}

/*
 * Type guard for the "letters_replaced" event.
 * Here it is enough to check the type, because we build the detail text simply.
 */
function isLettersReplaced(event: LogEvent): event is LettersReplaced {
  return event.type === 'letters_replaced';
}

export function MoveHistory({ compact = false }: { compact?: boolean }) {
  /*
   * `log` contains a chronological record of game events (moves, exchange, skip, …).
   * `playerNicknames` allows displaying human-readable names instead of player indices.
   */
  const log = useGameStore((s) => s.log);
  const playerNicknames = useGameStore((s) => s.playerNicknames);

  /*
   * The table displays events from newest to oldest.
   * Sorting is done inside useMemo:
   *  - to avoid unnecessary recalculation on every render
   *  - and to never mutate the original `log` from the global store
   */
  const rows = useMemo(() => {
    const sorted = [...(log ?? [])];
    sorted.sort((a, b) => (b.time_epoch ?? 0) - (a.time_epoch ?? 0));
    return sorted;
  }, [log]);

  /*
   * Compact mode is used, for example, when showing history under the rack,
   * full mode is used in a side panel. They differ only in max height.
   * The table body itself is scrollable.
   */
  const maxHeightClass = compact ? 'max-h-[180px]' : 'max-h-[320px]';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      {/* Panel header: title + number of events */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Move history</h3>
        <span className="text-[11px] text-slate-400">{rows.length} events</span>
      </div>

      {/* 
        The table container is scrollable.
        The header (<thead>) is sticky, so it remains visible while scrolling.
      */}
      <div className={`${maxHeightClass} overflow-auto pr-1`}>
        <table className="w-full text-xs">
          {/* Sticky table header improves readability */}
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
              /*
               * For each event, we try to make it "human-readable":
               *  - Player: player index -> nickname (fallback: Player N)
               *  - Action: event type (e.g. "word placement")
               *  - Detail: rich description (word + position + direction, or "Turn skipped", etc.)
               *  - Points: score gain, where applicable (primarily for word_placement)
               */
              const player =
                typeof event.player === 'number'
                  ? playerNicknames[event.player] ?? `Player ${event.player + 1}`
                  : '—';

              /*
               * By default, we use `event.message` (if present).
               * For specific event types, we override it with a more precise detail.
               */
              let detail = event.message ?? '';
              let points: number | null = null;

              if (isWordPlacement(event)) {
                /*
                 * For word placement we want maximum context:
                 *  - the word itself
                 *  - coordinates (1-based indexing in UI)
                 *  - direction (arrow)
                 *  - points from backend (if available)
                 */
                detail = `${event.word} [${event.x + 1},${event.y + 1}] ${dirArrow(
                  event.direction
                )}`;
                points = event.points ?? null;
              } else if (event.type === 'turn_skipped') {
                /*
                 * Turn skip: points are usually not displayed, detail is simple.
                 */
                detail = 'Turn skipped';
              } else if (isLettersReplaced(event)) {
                /*
                 * Letter exchange: we show the number of exchanged letters.
                 */
                detail = `Exchanged ${event.number_of_letters ?? '?'} letters`;
              }

              return (
                <tr key={event.event_id} className="border-t border-slate-800/60">
                  <td className="py-2 pr-2">{player}</td>

                  {/* Action is kept uppercase and "_" is replaced by space */}
                  <td className="py-2 pr-2 uppercase text-slate-300">
                    {event.type.replaceAll('_', ' ')}
                  </td>

                  {/* Detail is a human-readable description of the event */}
                  <td className="py-2 pr-2">{detail}</td>

                  {/* Points are shown only when relevant */}
                  <td className="py-2 text-right">{points !== null ? points : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state: no events yet */}
        {rows.length === 0 && (
          <div className="py-6 text-center text-xs text-slate-400">No moves yet.</div>
        )}
      </div>
    </div>
  );
}
