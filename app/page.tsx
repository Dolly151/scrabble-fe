'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { newGame } from '@/lib/api';

export default function StartPage() {
  const router = useRouter();
  const [players, setPlayers] = useState(2);
  const [gid, setGid] = useState('');
  const [loading, setLoading] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function onCreate() {
    try {
      setLoading(true);
      setCreateErr(null);
      const { game_id } = await newGame(players);
      router.push(`/game/${game_id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setCreateErr(msg || 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  function onLoad() {
    const id = gid.trim();
    if (!id) {
      setLoadErr('Please enter a GAME ID');
      return;
    }
    setLoadErr(null);
    router.push(`/game/${id}`);
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-3xl font-black tracking-wide text-white">
        SCRABBLE
      </h1>

      {/* Number of players */}
      <label className="block space-y-1">
        <span className="text-sm text-slate-300">
          Number of players
        </span>
        <input
          type="number"
          min={2}
          max={4}
          value={players}
          onChange={(e) =>
            setPlayers(parseInt(e.target.value || '2', 10))
          }
          className="
            w-full rounded-md border border-slate-700
            bg-slate-900 px-3 py-2
            text-lg font-semibold text-white
            focus:outline-none focus:ring-2 focus:ring-sky-500
          "
        />
      </label>

      {/* Create game */}
      <button
        type="button"
        disabled={loading}
        onClick={onCreate}
        className="
          w-full rounded-lg bg-sky-700 px-4 py-3
          font-bold text-white
          hover:bg-sky-600
          disabled:opacity-50
        "
      >
        CREATE GAME
      </button>
      {createErr && (
        <p className="text-sm text-red-500">{createErr}</p>
      )}

      {/* Load game */}
      <div className="flex items-center gap-2">
        <input
          placeholder="GAME ID"
          value={gid}
          onChange={(e) => {
            setGid(e.target.value.toUpperCase());
            if (loadErr) setLoadErr(null);
          }}
          className="
            flex-1 rounded-md border border-slate-700
            bg-slate-900 px-3 py-2
            font-mono text-white
            placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-sky-500
          "
        />
        <button
          type="button"
          disabled={loading || !gid.trim()}
          onClick={onLoad}
          className="
            rounded-lg bg-sky-700 px-4 py-2
            font-bold text-white
            hover:bg-sky-600
            disabled:opacity-50
          "
        >
          LOAD
        </button>
      </div>
      {loadErr && (
        <p className="text-sm text-red-500">{loadErr}</p>
      )}

      <p className="text-xs text-slate-500">
        BE: {process.env.NEXT_PUBLIC_API_URL}
      </p>
    </main>
  );
}
