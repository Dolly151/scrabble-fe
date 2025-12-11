'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Board } from '@/components/Board';
import { PlaceWordControls } from '@/components/PlaceWordControls';
import { Players } from '@/components/Players';
import { PlayerCards } from '@/components/PlayerCards';
import { NicknameDialog } from '@/components/NicknameDialog';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const loadGame = useGameStore((s) => s.loadGame);
  const loading = useGameStore((s) => s.loading);
  const error = useGameStore((s) => s.error);

  useEffect(() => {
    if (id) loadGame(id);
  }, [id, loadGame]);

  return (
    <main className="p-4">
      <NicknameDialog />

      <h1 className="mx-auto max-w-[1400px] p-2 text-2xl font-black">
        GAME ID: {id}
      </h1>

      <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
        {/* Levá část – deska */}
        <section className="order-2 lg:order-1 space-y-4">
          <Board />
        </section>

        {/* Pravý sidebar */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start space-y-4">
          {error && (
            <p className="rounded-lg border border-red-700/40 bg-red-600/10 p-3 text-red-500">
              {error}
            </p>
          )}

          {/* Karty hráčů */}
          <PlayerCards />

          {/* Ovládání (Row/Col, Place Word, Back) */}
          <PlaceWordControls />

          {/* Racky hráčů (nově interaktivní jen pro current player) */}
          <Players />
        </aside>
      </div>

      {loading && (
        <p className="mx-auto max-w-[1400px] p-4 text-slate-500">
          Načítám…
        </p>
      )}
    </main>
  );
}
