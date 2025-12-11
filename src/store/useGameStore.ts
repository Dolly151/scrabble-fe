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
  missing?: string[];
};

type GameStore = {
  gameId?: string;
  board: Board | null;
  layout: (string | null)[][] | null;
  nPlayers: number;
  currentPlayer: number;
  hands: Record<number, string[]>;
  points: Record<number, number>;
  loading: boolean;
  error?: string | null;

  letterValues: Record<string, number>;
  playerNicknames: Record<number, string>;
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

  // rack helpers (pro klikání v Racku)
  appendFromRack: (index: number) => void;
  backspaceWord: () => void;
  shuffleRack: () => void;

  // drag&drop helper
  placeLetterPreview: (x: number, y: number, letter: string) => void;

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
      // layout jen jednou
      if (!get().layout) {
        const lay = await getBoardLayout();
        set({ layout: lay.board_layout });
      }

      // letter values jen jednou
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

      // výchozí start na střed desky (pokud ještě není)
      const midY = Math.floor(b.board.length / 2);
      const midX = Math.floor((b.board[0]?.length ?? 0) / 2);
      const currentStart = get().start ?? { x: midX, y: midY };

      set({
        board: b.board,
        nPlayers: n.number_of_players,
        currentPlayer: cur.current_player,
        hands,
        points,
        playerNicknames,
        start: currentStart,
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

    set((state) => ({
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

  // --- rack helpery pro klikání ---

  appendFromRack(index) {
    const { currentPlayer, hands, word } = get();
    const rack = hands[currentPlayer] ?? [];
    const ch = rack[index];
    if (!ch) return;
    set({ word: (word || '') + ch.toUpperCase(), error: null });
  },

  backspaceWord() {
    const { word } = get();
    if (!word) return;
    set({ word: word.slice(0, -1), error: null });
  },

  shuffleRack() {
    const { currentPlayer, hands } = get();
    const rack = [...(hands[currentPlayer] ?? [])];
    if (rack.length <= 1) return;

    // Fisher–Yates shuffle
    for (let i = rack.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rack[i], rack[j]] = [rack[j], rack[i]];
    }

    set({
      hands: {
        ...hands,
        [currentPlayer]: rack,
      },
    });
  },

  // --- drag&drop helper (varianta B + auto row/col) ---

  placeLetterPreview(x, y, letter) {
    const { board, start, direction, word } = get();
    if (!board) return;

    const upper = letter.toUpperCase();

    // 1) první písmeno – nastavíme start + první znak
    if (!start) {
      set({ start: { x, y }, word: upper, error: null });
      return;
    }

    let dir = direction;

    // 2) druhé písmeno – určujeme směr podle pozice
    if (word.length === 1) {
      if (x === start.x && y !== start.y) {
        dir = 'col'; // stejné X → sloupec
      } else if (y === start.y && x !== start.x) {
        dir = 'row'; // stejné Y → řádek
      } else {
        // ani stejný řádek ani sloupec → drop ignorujeme
        return;
      }
    } else {
      // už směr máme – musíme ho dodržet
      if (dir === 'row' && y !== start.y) return;
      if (dir === 'col' && x !== start.x) return;
    }

    // 3) index v řetězci (varianta B: žádné mezery / dozadu)
    const index = dir === 'row' ? x - start.x : y - start.y;
    if (index < 0) return;
    if (index > word.length) return;

    let newWord = word;
    if (index === word.length) {
      newWord = word + upper;
    } else {
      newWord = word.slice(0, index) + upper + word.slice(index + 1);
    }

    set({
      start,
      direction: dir, // auto přepnutí Row/Col v UI
      word: newWord,
      error: null,
    });
  },

  // --- preview status pro outline ---

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
    const rack = (hands[currentPlayer] ?? []).slice();
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

      if (onBoard === '.') {
        const idx = rack.indexOf(letter);
        if (idx >= 0) rack.splice(idx, 1);
        else need[letter] = (need[letter] ?? 0) + 1;
      }
    }

    const missing = Object.entries(need).map(([ch, n]) => `${ch}×${n}`);
    const ok = !overflow && !conflict && missing.length === 0;
    return { ok, overflow, conflict, missing };
  },
}));
