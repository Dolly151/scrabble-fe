'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { newGame } from '@/lib/api'; // nebo '../lib/api'

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
      setLoadErr('Zadej GAME ID');
      return;
    }
    setLoadErr(null);
    router.push(`/game/${id}`);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-3xl font-black">SCRABBLE</h1>

      <label className="block">
        <span className="text-sm">Počet hráčů</span>
        <input
          type="number" min={2} max={4}
          className="mt-1 w-full rounded-md border px-3 py-2"
          value={players}
          onChange={(e)=>setPlayers(parseInt(e.target.value || '2', 10))}
        />
      </label>

      <button
        type="button"
        disabled={loading}
        onClick={onCreate}
        className="w-full rounded-lg bg-sky-700 px-4 py-3 font-bold text-white disabled:opacity-50"
      >
        CREATE GAME
      </button>
      {createErr && <p className="text-red-500 text-sm">{createErr}</p>}

      <div className="flex items-center gap-2">
        <input
          placeholder="GAME ID"
          className="flex-1 rounded-md border px-3 py-2 uppercase"
          value={gid}
          onChange={(e)=>{ setGid(e.target.value); if (loadErr) setLoadErr(null); }}
        />
        <button
          type="button"
          disabled={loading || !gid.trim()}
          onClick={onLoad}
          className="rounded-lg bg-sky-700 px-4 py-2 font-bold text-white disabled:opacity-50"
        >
          LOAD
        </button>
      </div>
      {loadErr && <p className="text-red-500 text-sm">{loadErr}</p>}

      <p className="text-xs text-slate-500">BE: {process.env.NEXT_PUBLIC_API_URL}</p>
    </main>
  );
}
