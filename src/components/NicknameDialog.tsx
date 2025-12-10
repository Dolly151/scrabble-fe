'use client';

import { FormEvent, useState, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';

export function NicknameDialog() {
  const gameId = useGameStore((s) => s.gameId);
  const nPlayers = useGameStore((s) => s.nPlayers);
  const nicknames = useGameStore((s) => s.playerNicknames);
  const setNickname = useGameStore((s) => s.setNickname);

  // lokální stav průvodce nicků pro aktuální hru
  const [currentIdx, setCurrentIdx] = useState(0);
  const [finished, setFinished] = useState(false);

  // ref na input
  const inputRef = useRef<HTMLInputElement | null>(null);

  // bez hry nebo hráčů → nic nezobrazujeme
  if (!gameId || !nPlayers) return null;

  // pokud už jsme průvodce pro tuhle hru dokončili
  if (finished) return null;

  // ochrana – kdyby currentIdx „přeskočil“ počet hráčů
  if (currentIdx >= nPlayers) {
    return null;
  }

  const defaultValue = `Player${currentIdx + 1}`;


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = inputRef.current?.value ?? '';
    const value = raw.trim() || defaultValue;

    await setNickname(currentIdx, value);

    if (currentIdx + 1 < nPlayers) {
      // další hráč
      setCurrentIdx(currentIdx + 1);
    } else {
      // poslední hráč → průvodce hotový
      setFinished(true);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <form
        key={`${gameId}-${currentIdx}`}
        onSubmit={handleSubmit}
        className="bg-slate-900 text-white rounded-2xl shadow-xl p-6 w-full max-w-sm border border-slate-700"
      >
        <h2 className="text-xl font-bold mb-4">
          Přezdívka hráče {currentIdx + 1}
        </h2>
        <p className="text-sm text-slate-300 mb-3">
          Nech <span className="font-mono">Player{currentIdx + 1}</span> nebo
          zadej vlastní přezdívku.
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
