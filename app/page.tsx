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
 * File: app/page.tsx
 *
 * Description:
 *  Entry (landing) page of the Scrabble application.
 *  Serves as the main entry point for the user, allowing them to:
 *   - create a new game
 *   - load an existing game
 *   - navigate to the game page at /game/[id]
 *
 *  This page does not implement game logic itself;
 *  it only initializes and transitions the user into the game.
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

/*
 * This page is a client component because it:
 *  - reacts to user actions (Create / Load)
 *  - works with the global application state
 *  - uses client-side navigation via the Next.js router
 */

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';

/*
 * Imported components may be used for:
 *  - previewing the game state
 *  - initializing data before transitioning to the game page
 */
import { Board } from '@/components/Board';
import { Players } from '@/components/Players';
import { Rack } from '@/components/Rack';
import { PlaceWordControls } from '@/components/PlaceWordControls';
import { NicknameDialog } from '@/components/NicknameDialog';

export default function HomePage() {
  /*
   * Router is used to navigate to the game page
   * after creating or loading a specific game.
   */
  const router = useRouter();

  /*
   * Game identifier used when loading
   * an existing in-progress game.
   */
  const { id } = useParams<{ id: string }>();

  /*
   * Global game state:
   * allows creating or loading a game
   * before transitioning to the game UI.
   */
  const loadGame = useGameStore((s) => s.loadGame);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);

  /*
   * If a game ID is available, load the corresponding game
   * and prepare the transition to the game page.
   */
  useEffect(() => {
    if (id) {
      loadGame(id);
    }
  }, [id, loadGame]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nickname input dialog – may appear during
          initialization of a new or loaded game */}
      <NicknameDialog />

      {/* Landing page header */}
      <header className="flex items-center gap-3 p-4">
        <h1 className="text-xl font-bold">Scrabble</h1>
      </header>

      {/* Main content of the landing page */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
        <section>
          <Board />
        </section>

        <aside className="flex flex-col gap-4">
          <Players />
          <PlaceWordControls />
          <Rack />
        </aside>
      </main>

      {/* Loading state */}
      {loading && (
        <div className="p-4 text-center text-slate-400">
          Loading…
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 text-center text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
