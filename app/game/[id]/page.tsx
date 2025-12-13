'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Board } from '@/components/Board';
import { PlaceWordControls } from '@/components/PlaceWordControls';
import { Players } from '@/components/Players';
import { NicknameDialog } from '@/components/NicknameDialog';
import { Rack } from '@/components/Rack';

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
  const router = useRouter();
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

      <header className="mx-auto max-w-[1400px] px-4 py-3">
        <div className="flex items-start justify-between">
          {/* LEFT: Title */}
          <div>
            <div className="flex gap-[6px]">
              {'SCRABBLE'.split('').map((ch, i) => (
                <TitleTile key={i}>{ch}</TitleTile>
              ))}
            </div>

            <div className="mt-2 flex gap-1">
              {'BY DOLLY'.split('').map((ch, i) =>
                ch === ' ' ? (
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

          {/* RIGHT: Game ID + Home */}
          <div className="mt-1 flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Game ID
              </div>
              <div className="font-mono text-xl font-bold text-white">{id}</div>
            </div>

            <HomeTile onClick={() => router.push('/')} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <section className="order-2 space-y-4 lg:order-1 -mt-4">
          <Board />
        </section>

        <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          {error && (
            <p className="rounded-lg border border-red-700/40 bg-red-600/10 p-3 text-red-500">
              {error}
            </p>
          )}

          <Players />
          <PlaceWordControls />
          <Rack />
        </aside>
      </div>

      {loading && (
        <p className="mx-auto max-w-[1400px] p-4 text-slate-500">Loading…</p>
      )}
    </main>
  );
}
