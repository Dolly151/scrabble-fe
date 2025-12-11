'use client';

import { FormEvent, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function PlaceWordControls() {
  const start = useGameStore((s) => s.start);
  const setStart = useGameStore((s) => s.setStart);
  const direction = useGameStore((s) => s.direction);
  const setDirection = useGameStore((s) => s.setDirection);
  const word = useGameStore((s) => s.word);
  const place = useGameStore((s) => s.place);
  const backspace = useGameStore((s) => s.backspaceWord);
  const loading = useGameStore((s) => s.loading);
  const previewStatus = useGameStore((s) => s.previewStatus);
  const board = useGameStore((s) => s.board);
  const appendFromKeyboard = useGameStore((s) => s.appendFromKeyboard);
  const skipTurn = useGameStore((s) => s.skipTurn);

  const exchanging = useGameStore((s) => s.exchanging);
  const exchangeSelection = useGameStore((s) => s.exchangeSelection);
  const startExchange = useGameStore((s) => s.startExchange);
  const cancelExchange = useGameStore((s) => s.cancelExchange);
  const confirmExchange = useGameStore((s) => s.confirmExchange);

  const status = previewStatus();
  const canSubmit = !exchanging && !!start && !!word && status.ok && !loading;
  const canSkip = !loading && !word && !exchanging;
  const canConfirmExchange =
    exchanging && !loading && exchangeSelection.length > 0;

  // Auto nastavení startovní buňky na střed
  useEffect(() => {
    if (!board || !board.length) return;
    if (start) return;
    const mid = Math.floor(board.length / 2);
    setStart(mid, mid);
  }, [board, start, setStart]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await place();
  };

  // globální klávesové zkratky
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName ?? '';
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // když jsme v exchange módu, ignorujeme zkratky pro pokládání
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

      // ARROWS = move cursor
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

      // LETTERS = add from rack by keyboard
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

  const startLabel = start
    ? `${start.x + 1}, ${start.y + 1}`
    : '— střed desky';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-4 bg-slate-900/40 space-y-3"
    >
      <p className="text-xs uppercase text-slate-400 mb-1">
        START CELL:{' '}
        <span className="font-semibold text-slate-100">{startLabel}</span>
      </p>

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

        <span className="text-[11px] text-slate-400">
          Šipky = pohyb, mezerník = směr, písmena = přidání, Backspace = undo
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          tabIndex={-1}
          className="px-4 py-2 rounded-md bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-sm font-semibold"
        >
          PLACE WORD
        </button>

        <button
          type="button"
          tabIndex={-1}
          onClick={backspace}
          className="px-3 py-2 rounded-md border border-slate-600 text-sm"
          title="Vrátit poslední písmeno zpět"
        >
          ⌫
        </button>

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
          {exchanging
            ? `EXCHANGE (${exchangeSelection.length})`
            : 'EXCHANGE'}
        </button>

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
