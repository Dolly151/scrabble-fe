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
 * File: src/components/Board.tsx
 *
 * Description:
 *  The Board component renders the Scrabble game board and handles user
 *  interaction with the board (clicking, drag & drop). It also displays:
 *   - bonus squares (DL/TL/DW/TW) according to the backend layout
 *   - letters already placed on the board
 *   - a preview of the currently composed word, including valid/invalid highlighting
 *   - the letter value shown in the corner of the tile (based on letterValues from the store)
 *
 *  Important: Board does not contain the full game rules. Rules (e.g. move validation,
 *  rack state, word composition) are managed by the global store. Board acts mainly
 *  as a visualization and interaction layer.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

"use client";

import { useGameStore } from "@/store/useGameStore";

/*
 * Internal type for bonus squares.
 * null means "no bonus".
 */
type PremiumCode = "DL" | "TL" | "DW" | "TW" | null;

/*
 * normalizePremium:
 *  The backend may send bonuses in various formats (e.g. 3w, 2w, 3l…),
 *  and empty strings or symbols for "nothing" may also appear.
 *
 *  This function normalizes all possible inputs into one standard:
 *   - TW / DW / TL / DL / null
 *
 *  Thanks to this, the rest of the code is simpler (colors, labels).
 */
function normalizePremium(v: unknown): PremiumCode {
  if (v == null) return null;
  const s = String(v).trim().toUpperCase();
  if (!s || s === "." || s === "  ") return null;

  // Support for different backend notations
  if (s === "3W" || s === "TW") return "TW";
  if (s === "2W" || s === "DW") return "DW";
  if (s === "3C" || s === "3L" || s === "TL") return "TL";
  if (s === "2C" || s === "2L" || s === "DL") return "DL";

  return null;
}

/*
 * premiumClass:
 *  Maps a bonus to its visual style (background color).
 *  Uses normalizePremium, so it also handles "dirty" input.
 */
const premiumClass = (code: unknown): string => {
  switch (normalizePremium(code)) {
    case "TW":
      return "bg-red-500";
    case "DW":
      return "bg-rose-300";
    case "TL":
      return "bg-teal-700";
    case "DL":
      return "bg-cyan-300";
    default:
      // default color for a regular square
      return "bg-sky-200";
  }
};

export function Board() {
  /*
   * board:
   *  Matrix of characters representing the current state of the game board.
   *  Typically '.' means an empty square, letters are stored as characters.
   *
   * layout:
   *  Matrix of bonus squares (DL/TL/DW/TW) from the backend.
   *  layout and board are separate: layout defines bonuses, board defines letters.
   */
  const board = useGameStore((s) => s.board);
  const layout = useGameStore((s) => s.layout);

  /*
   * start, direction, word:
   *  State of the "currently composed word" (player's move):
   *   - start: starting position of the word (x,y)
   *   - direction: "row" (horizontal) or "col" (vertical)
   *   - word: string composed of letters the player plans to place
   */
  const start = useGameStore((s) => s.start);
  const direction = useGameStore((s) => s.direction);
  const word = useGameStore((s) => s.word);

  /*
   * setStart:
   *  Sets the starting square. Used when clicking on the board
   *  or when dropping the first letter.
   */
  const setStart = useGameStore((s) => s.setStart);

  /*
   * error:
   *  Errors from rules / API / validation. Displayed on the board as an overlay.
   *
   * previewStatus:
   *  Function (or selector) that returns whether the current word preview
   *  is valid (e.g. connects to existing letters, passes dictionary checks, etc.).
   */
  const error = useGameStore((s) => s.error);
  const computePreviewStatus = useGameStore((s) => s.previewStatus);

  /*
   * appendFromRack:
   *  Adds a letter from the rack to the composed word (word) based on the rack index.
   *  Board only forwards the index obtained from Drag & Drop.
   */
  const appendFromRack = useGameStore((s) => s.appendFromRack);

  /*
   * letterValues:
   *  Dictionary of letter values (A=1, B=3, …). Used to display points
   *  directly on the tile (same as in the rack).
   */
  const letterValues = useGameStore((s) => s.letterValues);

  /*
   * status:
   *  Immediately request the preview validation state. If status.ok === false,
   *  the preview is highlighted in red (invalid move).
   */
  const status = computePreviewStatus();

  /*
   * setDirection:
   *  Direction setter. Used when composing a word via DnD:
   *  the direction is determined by the second placed letter.
   */
  const setDirection = useGameStore((s) => s.setDirection);

  /*
   * If the board is not available yet (e.g. before the game is loaded), render nothing.
   */
  if (!board) return null;

  const size = board.length;
  const center = Math.floor(size / 2);

  /*
   * previewCoords:
   *  Set of coordinates (x,y) where the composed word should be rendered
   *  in preview mode.
   *
   *  We use Set<string> in the "x,y" format because:
   *   - lookup is O(1)
   *   - it is easy to use inside cell mapping
   */
  const previewCoords = new Set<string>();
  if (start && word) {
    for (let i = 0; i < word.length; i++) {
      const x = direction === "row" ? start.x + i : start.x;
      const y = direction === "col" ? start.y + i : start.y;
      if (y >= 0 && y < size && x >= 0 && x < size) {
        previewCoords.add(`${x},${y}`);
      }
    }
  }

  /*
   * badPreview:
   *  true if start + word exist and validation reports an invalid state.
   *  Used to control the outline color around preview squares.
   */
  const badPreview = !!start && !!word && status && !status.ok;

  /*
   * getLetterValue:
   *  Returns the point value of a letter from letterValues.
   *  Handles key compatibility – sometimes the map may use uppercase keys.
   */
  const getLetterValue = (ch: string) => {
    if (!ch) return 0;
    return (letterValues?.[ch] ?? letterValues?.[ch.toUpperCase()] ?? 0) as number;
  };

  /*
   * handleDrop:
   *  Factory function – creates a handler for a specific cell (x,y).
   *
   *  DnD rules:
   *   1) if the cell already has a letter, ignore the drop
   *   2) if starting a new word (word empty), start = dropped cell
   *   3) if composing a word and we have 1 letter, the second one determines direction:
   *        - to the right of start -> row
   *        - below start -> col
   *   4) the third and subsequent letters must land exactly on the "next expected" cell
   */
  const handleDrop =
    (x: number, y: number, hasLetter: boolean) =>
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();

      // Cannot drop onto a cell that already contains a letter.
      if (hasLetter) return;

      // From DnD we transfer the index of the letter in the rack.
      const rackIndexStr = e.dataTransfer.getData("rackIndex");
      if (!rackIndexStr) return;

      const rackIndex = Number(rackIndexStr);
      if (Number.isNaN(rackIndex)) return;

      // 1) Starting a new word -> set start and add the first letter.
      if (!start || !word || word.length === 0) {
        setStart(x, y);
        appendFromRack(rackIndex);
        return;
      }

      // 2) Already composing a word -> start must NOT change.
      if (word.length === 1) {
        // Second letter: allow only right or down from start,
        // and set direction accordingly.
        const canRow = x === start.x + 1 && y === start.y;
        const canCol = x === start.x && y === start.y + 1;

        if (!canRow && !canCol) return;

        if (canRow) setDirection("row");
        if (canCol) setDirection("col");

        appendFromRack(rackIndex);
        return;
      }

      // 3) Third and subsequent letters: must match the next expected cell by direction.
      const nextX = direction === "row" ? start.x + word.length : start.x;
      const nextY = direction === "col" ? start.y + word.length : start.y;

      if (x !== nextX || y !== nextY) return;

      appendFromRack(rackIndex);
    };

  return (
    <div className="mx-auto w-full max-w-[900px] p-4">
      {/*
        Grid with coordinate labels:
         - column numbering at the top
         - row numbering on the left
         - the board itself in the center
       */}
      <div className="grid grid-cols-[auto,1fr] grid-rows-[auto,1fr] gap-1">
        {/* top column numbers */}
        <div
          className="col-start-2 row-start-1 grid gap-1 px-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`top-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* left row numbers */}
        <div
          className="col-start-1 row-start-2 grid gap-1 py-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`left-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* the board itself */}
        <div className="col-start-2 row-start-2">
          <div className="relative aspect-square w-full">
            {/*
              Error overlay: if there is an error in the store, display it directly on the board.
              This provides immediate feedback to the user (e.g. invalid move).
             */}
            {error && (
              <div className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-3 py-1 text-white text-sm shadow">
                {error}
              </div>
            )}

            {/*
              The board grid itself. Uses a CSS grid with size×size cells.
              Letters and bonuses are rendered as buttons to support:
               - clickability (setStart)
               - drag & drop (onDrop)
             */}
            <div
              className="grid h-full gap-1 rounded-xl bg-slate-900 p-3"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isStart = !!start && start.x === x && start.y === y;
                  const isPreview = previewCoords.has(`${x},${y}`);

                  /*
                   * prem = bonus square from the layout
                   * (may be undefined if the layout has not been loaded yet)
                   */
                  let prem = layout?.[y]?.[x];

                  /*
                   * Layout hotfix:
                   *  Backend uses a slightly different bonus layout than desired.
                   *  This block selectively fixes only specific diagonal positions
                   *  around the center.
                   *
                   */
                  if (size === 15) {
                    const cx = center;
                    const cy = center;

                    const isTLDiagonal2 =
                      (x === cx - 2 && y === cy - 2) ||
                      (x === cx + 2 && y === cy - 2) ||
                      (x === cx - 2 && y === cy + 2) ||
                      (x === cx + 2 && y === cy + 2);

                    const isTLDiagonal2Other =
                      (x === cx - 2 && y === cy + 2) ||
                      (x === cx + 2 && y === cy - 2);

                    const shouldBeTL = isTLDiagonal2Other;

                    if (shouldBeTL && normalizePremium(prem) === "DW") {
                      prem = "TL";
                    }
                  }

                  const hasLetter = cell !== ".";
                  const isCenter = x === center && y === center;

                  /*
                   * previewLetter:
                   *  If the square is empty and belongs to the preview area,
                   *  render a "ghost" letter from word here. This lets the user
                   *  see how the word will look before confirming the move.
                   */
                  let previewLetter: string | null = null;
                  if (!hasLetter && start && isPreview && word) {
                    const idx = direction === "row" ? x - start.x : y - start.y;
                    if (idx >= 0 && idx < word.length) {
                      previewLetter = word[idx] ?? null;
                    }
                  }

                  /*
                   * premiumText:
                   *  On empty squares, display the bonus label (DL/TL/DW/TW),
                   *  or a star in the center (★).
                   *  If a tile (letter or preview letter) is present,
                   *  the bonus label is not shown.
                   */
                  const premiumText = (() => {
                    if (!hasLetter) {
                      if (isCenter) return "★";
                      const n = normalizePremium(prem);
                      if (n === "TW") return "TW";
                      if (n === "DW") return "DW";
                      if (n === "TL") return "TL";
                      if (n === "DL") return "DL";
                    }
                    return "";
                  })();

                  /*
                   * showTile:
                   *  true if a tile should be rendered:
                   *   - either a real placed letter (hasLetter)
                   *   - or a ghost previewLetter
                   */
                  const showTile = hasLetter || !!previewLetter;

                  /*
                   * tileLetter:
                   *  Real placed letter has priority, otherwise preview letter.
                   *  Letters are normalized to uppercase for UI consistency.
                   */
                  const tileLetter = hasLetter
                    ? cell
                    : (previewLetter ?? "").toUpperCase();

                  /*
                   * tileValue:
                   *  Displayed point value of the letter in the tile corner.
                   *  Calculated only if a tile is actually shown.
                   */
                  const tileValue = showTile ? getLetterValue(tileLetter) : 0;

                  return (
                    <button
                      key={`${x}-${y}`}
                      /*
                       * Clicking a square sets the start for word composition.
                       * This allows starting a move even without DnD (e.g. via keyboard).
                       */
                      onClick={() => setStart(x, y)}
                      /*
                       * onDragOver is required for onDrop to work (default blocks drop).
                       */
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop(x, y, hasLetter)}
                      className={[
                        "relative grid place-items-center rounded-md border transition-transform active:scale-95",

                        /*
                         * Highlight the starting square (strong ring).
                         */
                        isStart
                          ? ["ring-4 ring-amber-400", "border-amber-500"].join(" ")
                          : "border-slate-700",

                        /*
                         * The center square has its own color (star).
                         * Others use color based on the bonus.
                         */
                        isCenter
                          ? "bg-amber-300 border-amber-500"
                          : premiumClass(prem),

                        /*
                         * Preview highlighting:
                         *  - valid preview: amber outline
                         *  - invalid preview: red outline
                         */
                        isPreview
                          ? `outline outline-2 ${
                              badPreview ? "outline-red-500" : "outline-amber-400"
                            }`
                          : "",
                      ].join(" ")}
                      title={`x=${x + 1}, y=${y + 1}`}
                    >
                      {/* Bonus text (DL/TL/DW/TW/★) is shown only when there is no tile */}
                      {!showTile && premiumText && (
                        <span className="pointer-events-none select-none text-[10px] font-black tracking-wider text-slate-900/90">
                          {premiumText}
                        </span>
                      )}

                      {/* Tile with letter (real or preview) */}
                      {showTile && (
                        <span
                          className={[
                            "pointer-events-none select-none relative",
                            "rounded-md bg-yellow-100 shadow-inner",
                            // tile size + letter centering
                            "w-[42px] h-[42px] grid place-items-center",
                            "border border-yellow-700 text-slate-900",
                            "font-black text-lg leading-none",
                          ].join(" ")}
                        >
                          {tileLetter}

                          {/* Points in the bottom-right corner of the tile */}
                          <span className="absolute bottom-[2px] right-[4px] text-[10px] font-bold leading-none">
                            {tileValue}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
