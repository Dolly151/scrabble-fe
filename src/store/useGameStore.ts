// src/store/useGameStore.ts
import { create } from 'zustand';
import type { Board } from '@/types/api';
import {
  getBoard,
  getBoardLayout,
  getCurrentPlayer,
  getHand,
  getNumPlayers,
  placeWord,
  getPlayerNicknames,
  setPlayerNickname,
  getAllPlayerPoints,
  getLetterValues,
} from '@/lib/api';

type Direction = 'row' | 'col';

type PreviewStatus = {
  ok: boolean;
  overflow?: boolean;
  conflict?: boolean;
  missing?: string[]; // např. ["A×1","E×2"]
};

type GameStore = {
  gameId?: string;
  board: Board | null;
  layout: (string | null)[][] | null;
  nPlayers: number;
  currentPlayer: number;
  hands: Record<number, string[]>;
  points: Record<number, number>;            // index hráče -> body
  loading: boolean;
  error?: string | null;

  letterValues: Record<string, number>;      // hodnoty písmen z /letter-values
  playerNicknames: Record<number, string>;   // index hráče -> nickname
  setNickname: (playerIndex: number, nickname: string) => Promise<void>;

  start: { x: number; y: number } | null;
  direction: Direction;
  word: string;

  loadGame: (gid: string) => Promise<void>;
  refresh: () => Promise<void>;
  setStart: (x: number, y: number) => void;
  setDirection: (d: Direction) => void;
  setWord: (w: string) => void;
  clear: () => void;
  place: () => Promise<void>;

  previewStatus: () => PreviewStatus;
};

export const useGameStore = create<GameStore>((set, get) => ({
  board: null,
  layout: null,
  nPlayers: 0,
  currentPlayer: 0,
  hands: {},
  points: {},
  loading: false,
  error: null,

  letterValues: {},
  playerNicknames: {},

  start: null,
  direction: 'row',
  word: '',

  async loadGame(gid: string) {
    set({ loading: true, error: null, gameId: gid });
    try {
      // layout načítáme jen jednou
      if (!get().layout) {
        const lay = await getBoardLayout();
        set({ layout: lay.board_layout });
      }

      // hodnoty písmen také jen jednou
      if (Object.keys(get().letterValues).length === 0) {
        const vals = await getLetterValues();
        set({ letterValues: vals });
      }

      const [b, n, cur, pts, nicksResp] = await Promise.all([
        getBoard(gid),
        getNumPlayers(gid),
        getCurrentPlayer(gid),
        getAllPlayerPoints(gid),
        getPlayerNicknames(gid),
      ]);

      const hands: Record<number, string[]> = {};
      for (let p = 0; p < n.number_of_players; p++) {
        const h = await getHand(gid, p);
        hands[p] = h.hand;
      }

      const points: Record<number, number> = {};
      pts.player_points.forEach((val, idx) => {
        points[idx] = val ?? 0;
      });

      const playerNicknames: Record<number, string> = {};
      nicksResp.player_nicknames.forEach((name, idx) => {
        playerNicknames[idx] = name;
      });

      set({
        board: b.board,
        nPlayers: n.number_of_players,
        currentPlayer: cur.current_player,
        hands,
        points,
        playerNicknames,
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },

  async refresh() {
    const gid = get().gameId;
    if (gid) await get().loadGame(gid);
  },

  async setNickname(playerIndex, nickname) {
    const gid = get().gameId;
    if (!gid) return;

    const finalName = nickname.trim() || `Player${playerIndex + 1}`;
    await setPlayerNickname(gid, playerIndex, finalName);

    set(state => ({
      playerNicknames: {
        ...state.playerNicknames,
        [playerIndex]: finalName,
      },
    }));
  },

  setStart(x, y) {
    set({ start: { x, y }, error: null });
  },

  setDirection(d) {
    set({ direction: d });
  },

  setWord(w) {
    set({ word: w.toUpperCase() });
  },

  clear() {
    set({ start: null, word: '', error: null });
  },

  async place() {
    const { gameId, start, direction, word } = get();
    if (!gameId || !start || !word) return;
    set({ loading: true, error: null });
    try {
      const res = await placeWord(gameId, start.x, start.y, word, direction);
      if (res.result === 'failed') {
        set({ error: res.error_description ?? 'Invalid move' });
      } else {
        set({ word: '', start: null });
        await get().refresh();
      }
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },

  // ---- klientská validace previewu (přetečení, kolize, chybějící písmena) ----
  previewStatus() {
    const { board, start, direction, word, hands, currentPlayer } = get();
    if (!board || !start || !word) return { ok: false };

    const sizeY = board.length;
    const sizeX = board[0]?.length ?? 0;

    const endX = direction === 'row' ? start.x + word.length - 1 : start.x;
    const endY = direction === 'col' ? start.y + word.length - 1 : start.y;
    const overflow =
      start.x < 0 || start.y < 0 || endX >= sizeX || endY >= sizeY;

    let conflict = false;
    const rack = (hands[currentPlayer] ?? []).slice(); // kopie pro „spotřebu“
    const need: Record<string, number> = {};

    for (let i = 0; i < word.length; i++) {
      const x = direction === 'row' ? start.x + i : start.x;
      const y = direction === 'col' ? start.y + i : start.y;
      if (x < 0 || y < 0 || x >= sizeX || y >= sizeY) continue;

      const onBoard = board[y][x];
      const letter = word[i];

      if (onBoard !== '.' && onBoard !== letter) {
        conflict = true;
      }

      // na prázdném poli musíme mít dlaždici v ruce
      if (onBoard === '.') {
        const idx = rack.indexOf(letter);
        if (idx >= 0) rack.splice(idx, 1);
        else need[letter] = (need[letter] ?? 0) + 1;
      }
    }

    const missing = Object.entries(need).map(
      ([ch, n]) => `${ch}×${n}`,
    );
    const ok = !overflow && !conflict && missing.length === 0;
    return { ok, overflow, conflict, missing };
  },
}));
