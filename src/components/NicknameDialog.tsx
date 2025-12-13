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
 * File: src/components/NicknameDialog.tsx
 *
 * Description:
 *  The NicknameDialog component handles entering player nicknames at the start of the game.
 *  Nicknames are stored:
 *   - in the global store (application state used by other components)
 *   - in localStorage (client-side persistence based on gameId)
 *
 *  The dialog is displayed only if at least one player does not have a nickname.
 *  It also handles an important detail: to prevent the dialog from popping up
 *  when loading a game due to a store reset, it first hydrates nicknames from
 *  localStorage and only then decides whether the dialog needs to be shown.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

/*
 * The localStorage key is derived from gameId so that:
 *  - each game has its own stored nicknames
 *  - nicknames are properly separated when switching between games
 */
const storageKey = (gameId: string) => `scrabble:nicknames:${gameId}`;

export function NicknameDialog() {
  /*
   * From the global store we read:
   *  - gameId: identifier of the current game (key for localStorage)
   *  - nPlayers: number of players (how many nicknames we expect)
   *  - playerNicknames: array of nicknames
   *  - setNickname: setter for a single nickname (player index + name)
   */
  const gameId = useGameStore((s) => s.gameId);
  const nPlayers = useGameStore((s) => s.nPlayers);
  const nicknames = useGameStore((s) => s.playerNicknames);
  const setNickname = useGameStore((s) => s.setNickname);

  /*
   * inputRef:
   *  Direct access to the input value without controlling it via state
   *  (uncontrolled input). This is simple and sufficient for this dialog.
   */
  const inputRef = useRef<HTMLInputElement | null>(null);

  /*
   * hydratedFor:
   *  "Hydration gate" – tracks for which gameId we have already loaded
   *  nicknames from localStorage and written them into the store.
   *
   *  Purpose: to prevent the dialog from flashing / appearing unnecessarily
   *  before nicknames are loaded.
   */
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  /**
   * IMPORTANT: Hooks MUST always be called in the same order.
   * Therefore, no `return null` before useEffect/useMemo.
   */

  /*
   * 1) Hydration of nicknames from localStorage
   *
   * Runs whenever gameId or nPlayers changes.
   * In practice: when loading a different game.
   *
   * Steps:
   *  - read stored nicknames from localStorage (if they exist)
   *  - trim them to the number of players
   *  - write non-empty values into the store using setNickname
   *  - set hydratedFor = gameId so the component knows hydration is done
   */
  useEffect(() => {
    if (!gameId || !nPlayers) return;

    let cancelled = false;

    try {
      const raw = localStorage.getItem(storageKey(gameId));

      /*
       * If there is nothing in localStorage, just mark hydration as complete.
       * The dialog will then decide based on the current nickname state in the store.
       */
      if (!raw) {
        setHydratedFor(gameId);
        return;
      }

      const parsed = JSON.parse(raw);

      /*
       * Protection against corrupted or unexpected data in localStorage.
       * If the data is not an array, abort hydration.
       */
      if (!Array.isArray(parsed)) {
        setHydratedFor(gameId);
        return;
      }

      /*
       * Normalization:
       *  - take at most nPlayers items
       *  - trim each value
       *  - map non-string values to an empty string
       */
      const arr = parsed
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .slice(0, nPlayers);

      /*
       * Write only non-empty names into the store.
       * This avoids overwriting nicknames that are already valid in the store.
       */
      arr.forEach((name, i) => {
        if (name.length > 0) {
          setNickname(i, name);
        }
      });
    } catch {
      /*
       * Errors during reading/parsing localStorage are ignored,
       * because this is only client-side UI state persistence.
       * The application must continue to work without it.
       */
    } finally {
      if (!cancelled) setHydratedFor(gameId);
    }

    return () => {
      cancelled = true;
    };
  }, [gameId, nPlayers, setNickname]);

  /*
   * 2) Normalized list of nicknames
   *
   * Computes an array of nicknames of length nPlayers, where each value is trimmed.
   * useMemo avoids unnecessary recomputation on re-render – recalculates only when
   * nicknames or nPlayers change.
   */
  const nicknameList = useMemo(() => {
    if (!nPlayers) return [];
    return Array.from({ length: nPlayers }, (_, i) =>
      (nicknames[i] ?? '').trim()
    );
  }, [nicknames, nPlayers]);

  /**
   * CONDITIONAL RETURNS ONLY AFTER HOOKS
   */

  /*
   * If we do not know gameId or number of players, the dialog cannot be shown.
   */
  if (!gameId || !nPlayers) return null;

  /*
   * Until hydration for the current gameId is complete, do not render the dialog.
   * This prevents the dialog from "flashing" during game load.
   */
  if (hydratedFor !== gameId) return null;

  /*
   * Find the first player without a nickname.
   * If all players have nicknames, the dialog is not shown.
   */
  const missingIndex = nicknameList.findIndex((n) => n.length === 0);
  if (missingIndex === -1) return null;

  /*
   * Default nickname for the given player (fallback).
   * Used if the user leaves the input empty.
   */
  const defaultValue = `Player${missingIndex + 1}`;

  /*
   * persistNicknames:
   *  Stores the current nickname array into localStorage.
   *  We always store the entire array because:
   *   - we want a consistent state during the next hydration
   *   - it is simpler than storing per-index separately
   */
  const persistNicknames = (next: string[]) => {
    try {
      localStorage.setItem(storageKey(gameId), JSON.stringify(next));
    } catch {
      /*
       * Storage may be disabled (privacy mode) or full.
       * The application must work even without persistence.
       */
    }
  };

  /*
   * handleSubmit:
   *  Confirms the nickname:
   *   - validation: empty input -> defaultValue is used
   *   - stored in the global state (setNickname)
   *   - stored in localStorage (persistNicknames)
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const value = inputRef.current?.value.trim() || defaultValue;

    // 1) Store the nickname in the global state
    setNickname(missingIndex, value);

    // 2) Prepare a new nickname array and store it in localStorage
    const next = [...nicknameList];
    next[missingIndex] = value;
    persistNicknames(next);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      {/*
        The dialog is a simple modal:
         - covers the entire UI (fixed inset-0)
         - dims the background (bg-black/60)
         - form is used for submit (Enter works automatically)
       */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-700"
      >
        <h2 className="text-xl font-bold mb-4">
          Přezdívka hráče {missingIndex + 1}
        </h2>

        {/*
          The input is uncontrolled (defaultValue + ref).
          The user can confirm with Enter or the button.
         */}
        <input
          ref={inputRef}
          defaultValue={defaultValue}
          autoFocus
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 mb-4"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-sm font-semibold"
          >
            Potvrdit
          </button>
        </div>
      </form>
    </div>
  );
}
