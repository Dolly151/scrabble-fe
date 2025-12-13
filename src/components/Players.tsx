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
 * File: src/components/Players.tsx
 *
 * Description:
 *  The Players component displays the list of players and their state:
 *   - player nickname
 *   - score (points)
 *   - indication of the current player (currentPlayer)
 *   - "ghost" preview of the player's rack next to the name
 *     (transparent tiles with letter value)
 *
 *  The component is purely presentational – it reads state from the global store
 *  and only renders the UI. It does not perform any game actions.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { useGameStore } from '@/store/useGameStore';

/*
 * GhostRackTile:
 *  Small visual tile for previewing the rack in the player card.
 *  Intentionally designed as a "ghost":
 *   - semi-transparent (matches the dark UI)
 *   - lower contrast than the active rack at the bottom
 *  Still contains both the letter and its value for clarity.
 */
function GhostRackTile({
  letter,
  value,
}: {
  letter: string;
  value: number;
}) {
  // Larger size to fit both letter and points, and transparent to match the dark UI
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

/*
 * GhostRackEmpty:
 *  Placeholder for an empty rack slot – keeps alignment to 7 slots.
 *  This prevents the UI from "shifting" when a player has fewer than 7 letters.
 */
function GhostRackEmpty() {
  return (
    <div className="w-8 h-8 rounded-md border border-white/10 bg-transparent" />
  );
}

export function Players() {
  /*
   * n: number of players in the game
   * cur: index of the player currently on turn
   * points: players' scores (array or mapping)
   * nicknames: player nicknames (array)
   */
  const n = useGameStore((s) => s.nPlayers);
  const cur = useGameStore((s) => s.currentPlayer);
  const points = useGameStore((s) => s.points);
  const nicknames = useGameStore((s) => s.playerNicknames);

  /*
   * hands:
   *  In this project, player hands are represented as string[][],
   *  i.e. a list of letters for each player.
   *
   *  Note: We cast the type here because the store may use a more generic type.
   */
  const hands = useGameStore((s) => s.hands) as unknown as Record<number, string[]>;

  /*
   * letterValues:
   *  Map of letter point values, used to display points in the ghost rack.
   */
  const letterValues = useGameStore((s) => s.letterValues);

  // If the number of players is not known yet, there is nothing to render.
  if (!n) return null;

  /*
   * getValue:
   *  Returns the point value of a letter. Handles uppercase key variants as well.
   */
  const getValue = (ch: string) =>
    (letterValues?.[ch] ?? letterValues?.[ch.toUpperCase()] ?? 0) as number;

  return (
    <div className="grid grid-cols-1 gap-4">
      {/*
        Rendering player cards:
         - iterate from 0..n-1
         - for each player render name, rack preview and score
       */}
      {Array.from({ length: n }).map((_, i) => {
        const name = nicknames[i] || `PLAYER${i + 1}`;
        const score = points?.[i] ?? 0;

        /*
         * rack:
         *  Player's letters. Typically length 7, but it may be shorter
         *  (e.g. near the end of the game or when the bag runs out of letters).
         */
        const rack = hands?.[i] ?? [];

        return (
          <div
            key={i}
            className={[
              'rounded-xl border p-4 bg-slate-900/40',

              /*
               * Highlighting the current player:
               *  - ring (outline)
               *  - slightly different background
               *  - subtle scaling and stronger font
               *
               * Goal: the user can immediately see who is playing.
               */
              cur === i
                ? 'ring-4 ring-sky-400 bg-slate-800/60 shadow-lg scale-[1.02] font-extrabold text-white '
                : '',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <p className="text-lg font-black">{name}</p>

                {/* 
                  Ghost rack next to the name:
                  - always 7 slots (for consistent width)
                  - empty slots use placeholders (GhostRackEmpty)
                  - occupied slots use GhostRackTile (letter + points)
                */}
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

              {/* Textual indication of player state (on turn / waiting) */}
              <span className="text-[13px] uppercase text-slate-400">
                {cur === i ? 'ON TURN' : 'WAITING'}
              </span>
            </div>

            {/* Player score */}
            <p className="text-sm text-slate-300">POINTS: {score}</p>
          </div>
        );
      })}
    </div>
  );
}
