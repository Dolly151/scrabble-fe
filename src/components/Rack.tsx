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
 * File: src/components/Rack.tsx
 *
 * Description:
 *  The Rack component displays the rack (letter holder) of the current player
 *  and allows interaction with it:
 *   - normal mode: click to add a letter to the composed word / drag & drop to the board
 *   - exchange mode: click to mark letters for exchange (no drag & drop)
 *   - visually marks letters already used in the currently composed word
 *     (wordRackIndices) – these are “disabled” and cannot be reused
 *
 *  Additionally, the move history (MoveHistory) is displayed below the rack
 *  in compact mode, so the player has context about recent actions directly
 *  near their rack.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

"use client";

import React from "react";
import { useGameStore } from "@/store/useGameStore";
import { MoveHistory } from "@/components/MoveHistory";

export function Rack() {
  /*
   * cur:
   *  Index of the player whose turn it is. The rack always displays letters
   *  of the current player, because the user is actively working with them.
   *
   * hands:
   *  Players' hands (racks) – typically an array or similar structure from
   *  which we select letters based on cur.
   */
  const cur = useGameStore((s) => s.currentPlayer);
  const hands = useGameStore((s) => s.hands);

  /*
   * wordRackIndices:
   *  Array of indices in the rack that have already been used to compose
   *  the current word.
   *  This allows us to visually and logically block reuse of the same tile.
   */
  const wordRackIndices = useGameStore((s) => s.wordRackIndices);

  /*
   * appendFromRack:
   *  Adds a letter to the currently composed word based on the rack index.
   *  Used in normal mode (click) and indirectly via drag & drop on the board.
   */
  const appendFromRack = useGameStore((s) => s.appendFromRack);

  /*
   * letterValues:
   *  Map of letter point values (for the small number in the bottom-right corner of the tile).
   */
  const letterValues = useGameStore((s) => s.letterValues);

  /*
   * playerNicknames:
   *  Player nicknames, used in the rack title (RACK: <name>).
   */
  const playerNicknames = useGameStore((s) => s.playerNicknames);

  /*
   * exchanging / exchangeSelection / toggleExchangeIndex:
   *  State and actions for the letter exchange mode.
   *  In exchange mode:
   *   - tiles are not draggable
   *   - click only toggles selection (selected / not selected)
   */
  const exchanging = useGameStore((s) => s.exchanging);
  const exchangeSelection = useGameStore((s) => s.exchangeSelection);
  const toggleExchangeIndex = useGameStore((s) => s.toggleExchangeIndex);

  /*
   * If we do not yet know the current player or hands are not loaded,
   * there is nothing to display.
   */
  if (cur == null || !hands) return null;

  /*
   * rack:
   *  List of letters of the current player.
   *  We handle the case where hands[cur] may not be an array (robustness).
   */
  const rack = Array.isArray(hands[cur]) ? hands[cur] : [];

  /*
   * usedSet:
   *  Set of rack tile indices that have already been used
   *  in the currently composed word.
   *  We use Set for fast O(1) lookup.
   */
  const usedSet = new Set(
    wordRackIndices.filter((i): i is number => i !== null && i !== undefined)
  );

  /*
   * selectedSet:
   *  Set of indices selected for exchange (exchangeSelection).
   *  Again, Set is used for fast lookup and simple render logic.
   */
  const selectedSet = new Set(exchangeSelection);

  /*
   * handleDragStart:
   *  Writes data into dataTransfer – the board later reads it in its onDrop handler.
   *
   *  We transfer:
   *   - "letter": the letter itself (useful for debugging / possible extensions)
   *   - "rackIndex": index in the rack (main identifier of the specific tile)
   *
   *  Drag & drop is disabled in exchange mode to avoid mixing modes.
   */
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    ch: string,
    rackIndex: number
  ) => {
    if (exchanging) return; // do not drag in exchange mode
    e.dataTransfer.setData("letter", ch);
    e.dataTransfer.setData("rackIndex", String(rackIndex));
    e.dataTransfer.effectAllowed = "move";
  };

  /*
   * Player name shown in the rack title (fallback to PLAYER N).
   */
  const name = playerNicknames[cur] || `PLAYER ${cur + 1}`;

  return (
    <div className="mx-auto max-w-[900px] p-4">
      <div className="rounded-xl border bg-slate-900/40 px-4 py-3">
        <p className="text-xs uppercase text-slate-400 mb-2">
          RACK: <span className="font-semibold text-slate-100">{name}</span>
        </p>

        {/*
          Rendering the rack:
           - flex + gap to make tiles look like they are “in hand”
           - each tile:
              - has its own state (used / selected / normal)
              - supports click and drag & drop depending on the current mode
        */}
        <div className="flex flex-wrap gap-2">
          {rack.map((ch, idx) => {
            /*
             * value:
             *  Point value of the letter. If letterValues are not loaded yet,
             *  we display 0 (fallback).
             */
            const value = letterValues ? letterValues[ch] ?? 0 : 0;

            /*
             * used:
             *  The tile has already been used in the currently composed word.
             *  In this case we dim and disable it (the user should not reuse it).
             */
            const used = usedSet.has(idx);

            /*
             * selected:
             *  The tile is selected in exchange mode.
             */
            const selected = selectedSet.has(idx);

            /*
             * tileClasses:
             *  CSS classes are composed based on the mode and tile state:
             *   - used -> opacity + cursor-not-allowed
             *   - normal mode -> cursor-grab + hover
             *   - exchange mode -> cursor-pointer + ring when selected
             */
            const tileClasses = [
              "relative inline-grid w-10 h-10 place-items-center rounded-md border font-black select-none text-lg",
              used
                ? "opacity-30 cursor-not-allowed"
                : "bg-yellow-200 shadow-inner hover:bg-yellow-300",
              exchanging && !selected ? "cursor-pointer" : "",
              exchanging && selected
                ? "cursor-pointer ring-2 ring-sky-400"
                : "",
              !exchanging && !used ? "cursor-grab" : "",
              "border-yellow-700 text-slate-900",
            ].join(" ");

            /*
             * handleClick:
             *  Two different behaviors depending on the mode:
             *   - exchange mode: click toggles selection
             *   - normal mode: click adds the letter to the composed word (appendFromRack)
             *
             *  If the tile is "used", clicks are ignored in normal mode.
             */
            const handleClick = () => {
              if (exchanging) {
                // exchange mode – just toggle selection
                toggleExchangeIndex(idx);
              } else if (!used) {
                // normal mode – add letter to the word
                appendFromRack(idx);
              }
            };

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                /*
                 * draggable:
                 *  Enabled only in normal mode and only for unused tiles.
                 */
                draggable={!exchanging && !used}
                onClick={handleClick}
                /*
                 * Drag start is registered only if DnD is allowed.
                 * In exchange mode or for used tiles, onDragStart is undefined.
                 */
                onDragStart={
                  !exchanging && !used
                    ? (e) => handleDragStart(e, ch, idx)
                    : undefined
                }
                className={tileClasses}
                /*
                 * title:
                 *  Contextual tooltip. Helps the user understand what can be done.
                 */
                title={
                  exchanging
                    ? selected
                      ? "Remove from exchange"
                      : "Add to exchange"
                    : used
                    ? "Already used in the current word"
                    : "Drag to the board or click to add"
                }
              >
                {/*
                  Display of the letter + point value in the corner.
                  The letter is rendered as ch (according to store data).
                */}
                {ch}
                <span className="absolute bottom-[2px] right-[4px] text-[10px] font-bold">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/*
        Move history:
         - placed below the rack so the player has quick access to recent actions
         - compact mode limits height so the panel does not take too much space
      */}
      <div className="mt-3">
        <MoveHistory compact />
      </div>
    </div>
  );
}
