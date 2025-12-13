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
 * File: src/components/PlaceWordControls.tsx
 *
 * Description:
 *  Control panel for a player's turn – composing and confirming a word.
 *  The component provides:
 *   - overview and setup of the starting cell (START CELL)
 *   - direction switching (row/col)
 *   - move confirmation (PLACE WORD)
 *   - undo of the last letter (⌫ / backspace)
 *   - skipping the turn (SKIP TURN)
 *   - letter exchange mode (EXCHANGE)
 *   - global keyboard shortcuts (Enter, Backspace, arrows, spacebar, letters)
 *
 *  Important: the component itself does not implement game rules
 *  (dictionary, scoring, etc.).
 *  It only calls actions from the store (place, backspaceWord, skipTurn,
 *  confirmExchange…) and displays validation returned by previewStatus().
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { FormEvent, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function PlaceWordControls() {
  /*
   * From the global store we read the word composition state:
   *  - start: cursor / starting cell from which the word is composed
   *  - direction: composition direction (row/col)
   *  - word: currently composed string of letters
   */
  const start = useGameStore((s) => s.start);
  const setStart = useGameStore((s) => s.setStart);

  const direction = useGameStore((s) => s.direction);
  const setDirection = useGameStore((s) => s.setDirection);

  const word = useGameStore((s) => s.word);

  /*
   * Turn actions:
   *  - place: attempts to confirm and send the word to the backend
   *  - backspaceWord: returns the last added letter back to the rack
   *  - skipTurn: skips the turn without placing a word
   */
  const place = useGameStore((s) => s.place);
  const backspace = useGameStore((s) => s.backspaceWord);
  const skipTurn = useGameStore((s) => s.skipTurn);

  /*
   * loading: indicates an ongoing request / game state change (e.g. place, exchange)
   * previewStatus: returns a structure with validation of the current word preview
   * (e.g. overflow, conflict, missing tiles, ok).
   */
  const loading = useGameStore((s) => s.loading);
  const previewStatus = useGameStore((s) => s.previewStatus);

  /*
   * board: we need the board size for auto-centering and arrow-key movement
   * appendFromKeyboard: adds a letter to the word via key press (A–Z)
   */
  const board = useGameStore((s) => s.board);
  const appendFromKeyboard = useGameStore((s) => s.appendFromKeyboard);

  /*
   * Letter exchange mode state:
   *  - exchanging: are we in exchange mode?
   *  - exchangeSelection: which letters are selected for exchange
   *  - startExchange / cancelExchange / confirmExchange: exchange actions
   *
   * Note: in exchange mode we often block other shortcuts (word placement)
   * to avoid unintended actions.
   */
  const exchanging = useGameStore((s) => s.exchanging);
  const exchangeSelection = useGameStore((s) => s.exchangeSelection);
  const startExchange = useGameStore((s) => s.startExchange);
  const cancelExchange = useGameStore((s) => s.cancelExchange);
  const confirmExchange = useGameStore((s) => s.confirmExchange);

  /*
   * Preview word validation state.
   * previewStatus() typically returns e.g.:
   *  - ok: boolean
   *  - overflow: word does not fit on the board
   *  - conflict: conflicts with existing board letters
   *  - missing: missing tiles in the rack
   */
  const status = previewStatus();

  /*
   * Conditions under which individual actions are allowed:
   *
   * canSubmit:
   *  - must not be in exchange mode
   *  - must have start and word
   *  - preview must be valid (status.ok)
   *  - must not be loading
   *
   * canSkip:
   *  - must not be loading
   *  - no word in progress (word is empty)
   *  - must not be in exchange mode
   *
   * canConfirmExchange:
   *  - in exchange mode
   *  - not loading
   *  - user selected at least one letter
   */
  const canSubmit = !exchanging && !!start && !!word && status.ok && !loading;
  const canSkip = !loading && !word && !exchanging;
  const canConfirmExchange =
    exchanging && !loading && exchangeSelection.length > 0;

  /*
   * Automatic setup of the starting cell to the center of the board:
   *  - if the board is loaded and start is not set, move the cursor to the center.
   *
   * Motivation: after starting a turn, the user does not need to click the center first,
   * they can immediately type/drag. At the same time, this eliminates an "undefined start" state.
   */
  useEffect(() => {
    if (!board || !board.length) return;
    if (start) return;

    const mid = Math.floor(board.length / 2);
    setStart(mid, mid);
  }, [board, start, setStart]);

  /*
   * Form submit = confirm the word.
   * It is a form for UX reasons (Enter key), but Enter is also handled globally.
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await place();
  };

  /*
   * Global keyboard shortcuts:
   *  - Enter: confirm word (place)
   *  - Backspace: undo last letter
   *  - Space: toggle direction (row <-> col)
   *  - Arrow keys: move cursor on the board
   *  - A-Z: add a letter to the composed word (if start is set)
   *
   * Important:
   *  - if focus is in an input/textarea, shortcuts are ignored
   *    (we do not want to break text typing)
   *  - in exchange mode, composition shortcuts are ignored
   *    (to avoid accidental actions)
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // In exchange mode, we intentionally ignore keys for word placement.
      if (exchanging) {
        return;
      }

      // ENTER = place word
      if (e.key === 'Enter') {
        if (isInput) return;
        if (!canSubmit) return;
        e.preventDefault();
        void place();
        return;
      }

      // BACKSPACE = undo last letter
      if (e.key === 'Backspace') {
        if (isInput) return;
        e.preventDefault();
        backspace();
        return;
      }

      // SPACE = toggle direction
      if (!isInput && (e.key === ' ' || e.key === 'Spacebar')) {
        e.preventDefault();
        setDirection(direction === 'row' ? 'col' : 'row');
        return;
      }

      /*
       * ARROWS = cursor movement (starting cell) on the board.
       * This allows the player to move purely with the keyboard.
       */
      if (
        !isInput &&
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight')
      ) {
        e.preventDefault();

        const boardSize = board?.length ?? 15;
        if (!boardSize) return;

        // If start is not set, begin in the center.
        let x = start ? start.x : Math.floor(boardSize / 2);
        let y = start ? start.y : Math.floor(boardSize / 2);

        switch (e.key) {
          case 'ArrowUp':
            if (y > 0) y -= 1;
            break;
          case 'ArrowDown':
            if (y < boardSize - 1) y += 1;
            break;
          case 'ArrowLeft':
            if (x > 0) x -= 1;
            break;
          case 'ArrowRight':
            if (x < boardSize - 1) x += 1;
            break;
        }

        setStart(x, y);
        return;
      }

      /*
       * LETTERS = add letters via key presses.
       * Restricted to A-Z without modifiers to:
       *  - avoid shortcuts like Ctrl+C
       *  - avoid special characters
       */
      if (
        !isInput &&
        start &&
        e.key.length === 1 &&
        /^[a-zA-Z]$/.test(e.key) &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        appendFromKeyboard(e.key);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    appendFromKeyboard,
    backspace,
    board,
    canSubmit,
    direction,
    exchanging,
    place,
    setDirection,
    setStart,
    start,
  ]);

  /*
   * startLabel:
   *  User-friendly label of the starting cell.
   *  We display 1-based coordinates (x+1, y+1) to match the board UI.
   */
  const startLabel = start ? `${start.x + 1}, ${start.y + 1}` : '— střed desky';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 bg-slate-900/40 space-y-3"
    >
      {/* Current starting cell */}
      <p className="text-xs uppercase text-slate-400 mb-1">
        START CELL:{' '}
        <span className="font-semibold text-slate-100">{startLabel}</span>
      </p>

      {/* Direction switch + short control hint */}
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1">
          <input
            tabIndex={-1}
            type="radio"
            name="direction"
            value="row"
            checked={direction === 'row'}
            onChange={() => setDirection('row')}
          />
          Row (→)
        </label>

        <label className="flex items-center gap-1">
          <input
            tabIndex={-1}
            type="radio"
            name="direction"
            value="col"
            checked={direction === 'col'}
            onChange={() => setDirection('col')}
          />
          Col (↓)
        </label>

        <span className="text-[12px] text-slate-400">
          arrows = movement, spacebar = direction, letters = add them to board by
          press them or use drag&drop, backspace = undo
        </span>
      </div>

      {/* Turn action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          tabIndex={-1}
          className="px-4 py-2 rounded-md bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm font-semibold"
        >
          PLACE WORD
        </button>

        {/* Undo last letter – same as Backspace */}
        <button
          type="button"
          tabIndex={-1}
          onClick={backspace}
          className="px-3 py-2 rounded-md border border-slate-600 text-sm"
          title="Vrátit poslední písmeno zpět"
        >
          ⌫
        </button>

        {/* Skip turn (only if no word is in progress) */}
        <button
          type="button"
          tabIndex={-1}
          onClick={skipTurn}
          disabled={!canSkip}
          className="px-3 py-2 rounded-md border border-slate-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Přeskočit tah bez položení slova"
        >
          SKIP TURN
        </button>

        {/*
          Exchange button:
           - outside exchange mode: startExchange
           - in exchange mode: confirmExchange (shows number of selected letters)
         */}
        <button
          type="button"
          tabIndex={-1}
          onClick={exchanging ? confirmExchange : startExchange}
          disabled={loading || (exchanging && !canConfirmExchange)}
          className="px-3 py-2 rounded-md border border-slate-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            exchanging
              ? 'Potvrdit výměnu vybraných písmen'
              : 'Začít výměnu písmen'
          }
        >
          {exchanging ? `EXCHANGE (${exchangeSelection.length})` : 'EXCHANGE'}
        </button>

        {/* In exchange mode, allow the user to cancel the exchange */}
        {exchanging && (
          <button
            type="button"
            tabIndex={-1}
            onClick={cancelExchange}
            className="px-3 py-2 rounded-md border border-slate-600 text-sm"
          >
            CANCEL
          </button>
        )}
      </div>

      {/*
        Preview word validation section.
        The user gets immediate feedback why the word cannot be confirmed.
       */}
      {status.overflow && (
        <p className="text-xs text-amber-400">Slovo se nevejde na desku.</p>
      )}
      {status.conflict && (
        <p className="text-xs text-amber-400">
          Slovo koliduje s písmeny už na desce.
        </p>
      )}
      {status.missing && status.missing.length > 0 && (
        <p className="text-xs text-amber-400">
          Chybí ti dlaždice: {status.missing.join(', ')}
        </p>
      )}
    </form>
  );
}
