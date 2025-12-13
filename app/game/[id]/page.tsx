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
 * File: app/game/[id]/page.tsx
 *
 * Description:
 *  Game page for a specific Scrabble game (route /game/[id]).
 *  The page loads the game state based on the [id] route parameter,
 *  composes the main game UI (board, players, turn controls, rack),
 *  and displays global UI elements such as the nickname dialog,
 *  error messages, and loading indicators.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useGameStore } from '@/store/useGameStore';

/*
 * Game components – individual parts of the UI (board, players panel,
 * turn controls, etc.). The page component only orchestrates them;
 * it does not implement the game rules itself.
 */
import { Board } from '@/components/Board';
import { PlaceWordControls } from '@/components/PlaceWordControls';
import { Players } from '@/components/Players';
import { NicknameDialog } from '@/components/NicknameDialog';
import { Rack } from '@/components/Rack';

/*
 * TitleTile and HomeTile are small local UI components used in the header.
 * They are kept in this file because they are only used on this page
 * and help keep the JSX structure readable.
 */
function TitleTile({ children }: { children: string }) {
  return (
    <div
      className="
        flex h-12 w-12 items-center justify-center
        rounded-lg
        bg-[#4FB6E8]
        text-[22px] font-extrabold tracking-wide
        text-white
        shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)]
      "
    >
      {children}
    </div>
  );
}

function HomeTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Back to home screen"
      className="
        flex h-12 w-12 items-center justify-center
        rounded-lg
        bg-[#4FB6E8]
        shadow-[inset_0_-4px_0_rgba(0,0,0,0.35)]
        -translate-y-[1px]
        hover:brightness-110
        active:translate-y-[1px]
      "
    >
      {/* The home icon is embedded inline as SVG to allow easy styling
          and to avoid dependency on external icon libraries. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M3 11L12 3l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    </button>
  );
}

export default function GamePage() {
  /*
   * Router is used for navigation back to the home screen.
   * The id parameter (from route /game/[id]) identifies the specific game.
   */
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  /*
   * Global game state is managed via the Zustand store.
   * loadGame fetches game data from the backend based on the ID,
   * loading/error are used to reflect global UI state.
   */
  const loadGame = useGameStore((s) => s.loadGame);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);

  /*
   * Load the game when the page is first rendered
   * and whenever the route parameter changes.
   * This ensures the UI always reflects the current route.
   */
  useEffect(() => {
    if (id) loadGame(id);
  }, [id, loadGame]);

  return (
    <main className="p-4">
      {/* Nickname setup dialog.
          Placed at page level so it can overlay the entire UI. */}
      <NicknameDialog />

      {/* Page header: game title, game ID, and home navigation button. */}
      <header className="mx-auto max-w-[1400px] px-4 py-3">
        <div className="flex items-start justify-between">
          {/* LEFT: Game title rendered as a sequence of tiles */}
          <div>
            <div className="flex gap-[6px]">
              {/* Splitting the title into characters allows easy rendering
                  as a row of styled tiles. */}
              {'SCRABBLE'.split('').map((ch, i) => (
                <TitleTile key={i}>{ch}</TitleTile>
              ))}
            </div>

            {/* Subtitle / branding */}
            <div className="mt-2 flex gap-1">
              {'BY DOLLY'.split('').map((ch, i) =>
                ch === ' ' ? (
                  /* Space is rendered as an empty block to keep spacing consistent */
                  <div key={i} className="w-4" />
                ) : (
                  <div
                    key={i}
                    className="
                      flex h-8 w-8 items-center justify-center
                      rounded-md
                      bg-slate-700
                      text-[12px] font-bold tracking-wide
                      text-slate-100
                    "
                  >
                    {ch}
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT: Game ID display and Home button */}
          <div className="mt-1 flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Game ID
              </div>
              {/* Game ID is shown for convenience (sharing, debugging, etc.). */}
              <div className="font-mono text-xl font-bold text-white">{id}</div>
            </div>

            {/* Navigation back to the home screen */}
            <HomeTile onClick={() => router.push('/')} />
          </div>
        </div>
      </header>

      {/* Main layout: board on the left, control panel on the right.
          On larger screens, the panel is sticky to remain visible. */}
      <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
        {/* Board section – appears below controls on mobile, left on desktop */}
        <section className="order-2 space-y-4 lg:order-1 -mt-4">
          <Board />
        </section>

        {/* Side panel containing game state and controls */}
        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          {/* Error message is shown prominently because it may block gameplay
              (place word, exchange letters, etc.). */}
          {error && (
            <p className="rounded-lg border border-red-700/40 bg-red-600/10 p-3 text-red-500">
              {error}
            </p>
          )}

          {/* Players overview (scores, turn indicator, rack preview, etc.) */}
          <Players />

          {/* Controls for placing words (direction, submit, validation feedback) */}
          <PlaceWordControls />

          {/* Rack of the active player (letter interactions) */}
          <Rack />
        </aside>
      </div>

      {/* Loading indicator (e.g. during loadGame or refresh). */}
      {loading && (
        <p className="mx-auto max-w-[1400px] p-4 text-slate-500">Loading…</p>
      )}
    </main>
  );
}
