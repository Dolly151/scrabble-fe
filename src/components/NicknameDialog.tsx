'use client';

import { FormEvent, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function NicknameDialog() {
  const gameId = useGameStore((s) => s.gameId);
  const nPlayers = useGameStore((s) => s.nPlayers);
  const nicknames = useGameStore((s) => s.playerNicknames);
  const setNickname = useGameStore((s) => s.setNickname);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // bez hry nebo hráčů → nic nezobrazujeme
  if (!gameId || !nPlayers) return null;

  // poskládáme si seznam přezdívek pro hráče 0..nPlayers-1
  const nicknameList = Array.from({ length: nPlayers }, (_, i) => {
    const raw = nicknames[i];
    return (raw ?? '').trim();
  });

  // najdeme prvního hráče bez přezdívky
  const missingIndex = nicknameList.findIndex((n) => n.length === 0);

  // všichni mají přezdívku → dialog vůbec nerenderujeme
  if (missingIndex === -1) return null;

  const defaultValue = `Player${missingIndex + 1}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = inputRef.current?.value ?? '';
    const value = raw.trim() || defaultValue;

    await setNickname(missingIndex, value);
    // po uložení se store aktualizuje, komponenta se znovu vyrenderuje,
    // missingIndex se přepočítá na dalšího hráče bez nicku
    // nebo na -1 → dialog zmizí
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <form
        key={`${gameId}-${missingIndex}`}
        onSubmit={handleSubmit}
        className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-700"
      >
        <h2 className="text-xl font-bold mb-4">
          Přezdívka hráče {missingIndex + 1}
        </h2>
        <p className="text-sm text-slate-300 mb-3">
          Nech <span className="font-mono">{defaultValue}</span> nebo zadej
          vlastní přezdívku.
        </p>
        <input
          ref={inputRef}
          defaultValue={defaultValue}
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-sky-500"
          autoFocus
        />
        <div className="flex justify-end gap-2">
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
