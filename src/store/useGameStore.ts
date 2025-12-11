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
  skipTurn,
  replaceLetters,
} from '@/lib/api';

type Direction = 'row' | 'col';

type PreviewStatus = {
  ok: boolean;
  overflow: boolean;
  conflict: boolean;
  missing: string[];
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
  wordRackIndices: (number | null)[];

  // výměna písmen
  exchanging: boolean;
  exchangeSelection: number[];

  loadGame: (gid: string) => Promise<void>;
  refresh: () => Promise<void>;

  setStart: (x: number, y: number) => void;
  setDirection: (d: Direction) => void;
  setWord: (w: string) => void;
  clear: () => void;

  place: () => Promise<void>;
  skipTurn: () => Promise<void>;

  startExchange: () => void;
  toggleExchangeIndex: (index: number) => void;
  cancelExchange: () => void;
  confirmExchange: () => Promise<void>;

  appendFromRack: (index: number) => void;
  appendFromKeyboard: (letter: string) => void;
  backspaceWord: () => void;

  placeLetterPreview: (
    x: number,
    y: number,
    letter: string,
    rackIndex?: number,
  ) => void;

  previewStatus: () => PreviewStatus;
};

// type-guard: jestli odpověď z API má pole `letter_values`
function hasLetterValuesField(
  obj: unknown,
): obj is { letter_values: Record<string, number> } {
  if (
    typeof obj === 'object' &&
    obj !== null &&
    'letter_values' in obj
  ) {
    const lv = (obj as Record<string, unknown>)['letter_values'];
    return typeof lv === 'object' && lv !== null;
  }
  return false;
}


export const useGameStore = create<GameStore>((set, get) => ({
  gameId: undefined,
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
  wordRackIndices: [],

  exchanging: false,
  exchangeSelection: [],

  async loadGame(gid: string) {
    set({ loading: true, error: null, gameId: gid });
    try {
      if (!get().layout) {
        const lay = await getBoardLayout();
        set({ layout: lay.board_layout });
      }

      const [b, n, cur, pointsResp, letterValuesResp, nicksResp] =
        await Promise.all([
          getBoard(gid),
          getNumPlayers(gid),
          getCurrentPlayer(gid),
          getAllPlayerPoints(gid),
          getLetterValues(),
          getPlayerNicknames(gid),
        ]);

      // ruce hráčů
      const hands: Record<number, string[]> = {};
      for (let i = 0; i < n.number_of_players; i++) {
        const h = await getHand(gid, i);
        hands[i] = h.hand;
      }

      // body
      const points: Record<number, number> = {};
      pointsResp.player_points.forEach((p, idx) => {
        points[idx] = p;
      });

      // přezdívky
      const playerNicknames: Record<number, string> = {};
      nicksResp.player_nicknames.forEach((name, idx) => {
        playerNicknames[idx] = name;
      });

      // hodnoty písmen – přijmeme obě varianty:
      // 1) { letter_values: { A: 1, B: 3, ... } }
      // 2) { A: 1, B: 3, ... }
      let letterValues: Record<string, number> = {};
      const raw = letterValuesResp as unknown;
      if (hasLetterValuesField(raw)) {
        letterValues = raw.letter_values ?? {};
      } else {
        letterValues = (raw as Record<string, number>) ?? {};
      }

      const midY = Math.floor(b.board.length / 2);
      const midX = Math.floor((b.board[0]?.length ?? 0) / 2);
      const currentStart = get().start ?? { x: midX, y: midY };

      set({
        board: b.board,
        nPlayers: n.number_of_players,
        currentPlayer: cur.current_player,
        hands,
        points,
        letterValues,
        playerNicknames,
        start: currentStart,
      });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },

  async refresh() {
    const gid = get().gameId;
    if (gid) {
      await get().loadGame(gid);
    }
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
    const up = w.toUpperCase();
    set({
      word: up,
      wordRackIndices: new Array(up.length).fill(null),
      error: null,
    });
  },

  clear() {
    set({
      start: null,
      word: '',
      wordRackIndices: [],
      error: null,
    });
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
        set({ word: '', wordRackIndices: [], start: null });
        await get().refresh();
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },

  async skipTurn() {
    const { gameId } = get();
    if (!gameId) return;

    set({
      loading: true,
      error: null,
      word: '',
      wordRackIndices: [],
      start: null,
    });

    try {
      const res = await skipTurn(gameId);
      if (res.result === 'failed') {
        set({ error: res.error_description ?? 'Skip failed' });
      } else {
        await get().refresh();
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },

  // --- výměna písmen ---

  startExchange() {
    if (get().word) return; // když skládá slovo, neumožníme výměnu
    set({
      exchanging: true,
      exchangeSelection: [],
      error: null,
    });
  },

  toggleExchangeIndex(index) {
    const { exchanging, exchangeSelection } = get();
    if (!exchanging) return;

    const exists = exchangeSelection.includes(index);
    set({
      exchangeSelection: exists
        ? exchangeSelection.filter((i) => i !== index)
        : [...exchangeSelection, index],
    });
  },

  cancelExchange() {
    set({
      exchanging: false,
      exchangeSelection: [],
    });
  },

  async confirmExchange() {
    const { gameId, exchanging, exchangeSelection, hands, currentPlayer } =
      get();

    if (!gameId || !exchanging || exchangeSelection.length === 0) return;

    const rack = hands[currentPlayer] ?? [];
    const letters = exchangeSelection
      .map((i) => rack[i])
      .filter((ch) => typeof ch === 'string')
      .join('');

    if (!letters) return;

    set({ loading: true, error: null });

    try {
      const res = await replaceLetters(gameId, letters);
      if (res.result === 'failed') {
        set({
          error: res.error_description ?? 'Exchange failed',
        });
      } else {
        set({
          word: '',
          wordRackIndices: [],
          start: null,
          exchanging: false,
          exchangeSelection: [],
        });
        await get().refresh();
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },

  // --- práce s rackem ---

  appendFromRack(index) {
    const { currentPlayer, hands, word, wordRackIndices, exchanging } = get();
    if (exchanging) return; // v režimu výměny se rackem nepřidává

    const rack = hands[currentPlayer] ?? [];
    const ch = rack[index];
    if (!ch) return;

    const up = ch.toUpperCase();
    set({
      word: (word || '') + up,
      wordRackIndices: [...wordRackIndices, index],
      error: null,
    });
  },

  appendFromKeyboard(letter) {
    const { currentPlayer, hands, word, wordRackIndices, exchanging } = get();
    if (exchanging) return;

    const rack = hands[currentPlayer] ?? [];
    if (!rack.length) return;

    const upper = letter.toUpperCase();

    const used = new Set(
      wordRackIndices.filter(
        (i): i is number => i !== null && i !== undefined,
      ),
    );

    let chosenIndex = -1;
    for (let i = 0; i < rack.length; i++) {
      if (used.has(i)) continue;
      if (rack[i].toUpperCase() === upper) {
        chosenIndex = i;
        break;
      }
    }

    if (chosenIndex === -1) return;

    set({
      word: (word || '') + upper,
      wordRackIndices: [...wordRackIndices, chosenIndex],
      error: null,
    });
  },

  backspaceWord() {
    const { word, wordRackIndices } = get();
    if (!word || word.length === 0) return;

    set({
      word: word.slice(0, -1),
      wordRackIndices: wordRackIndices.slice(0, -1),
      error: null,
    });
  },

  placeLetterPreview(x, y, letter, rackIndex) {
    const { board } = get();
    if (!board) return;

    const rows = board.length;
    const cols = board[0]?.length ?? 0;

    if (x < 0 || y < 0 || y >= rows || x >= cols) return;

    const newBoard = board.map((row) => [...row]);

    if (newBoard[y][x] === '.') {
      newBoard[y][x] = letter.toUpperCase();
    }

    set({ board: newBoard });

    if (rackIndex != null) {
      const { currentPlayer, hands } = get();
      const rack = [...(hands[currentPlayer] ?? [])];
      if (rack[rackIndex]) {
        rack[rackIndex] = ' ';
        set({
          hands: {
            ...hands,
            [currentPlayer]: rack,
          },
        });
      }
    }
  },

  previewStatus() {
    const { board, word, start, direction, hands, currentPlayer } = get();
    if (!board || !start || !word) {
      return { ok: false, overflow: false, conflict: false, missing: [] };
    }

    const w = word.toUpperCase();
    const rows = board.length;
    const cols = board[0]?.length ?? 0;

    let overflow = false;
    let conflict = false;

    const rack = [...(hands[currentPlayer] ?? [])];
    const need: Record<string, number> = {};

    for (let i = 0; i < w.length; i++) {
      const letter = w[i];
      const x = direction === 'row' ? start.x + i : start.x;
      const y = direction === 'row' ? start.y : start.y + i;

      if (x < 0 || y < 0 || y >= rows || x >= cols) {
        overflow = true;
        continue;
      }

      const onBoard = board[y][x];

      if (onBoard !== '.' && onBoard !== letter) {
        conflict = true;
      }

      if (onBoard === '.') {
        const idx = rack.findIndex((r) => r === letter);
        if (idx >= 0) {
          rack.splice(idx, 1);
        } else {
          need[letter] = (need[letter] ?? 0) + 1;
        }
      }
    }

    const missing = Object.entries(need).map(([ch, n]) => `${ch}×${n}`);
    const ok = !overflow && !conflict && missing.length === 0;
    return { ok, overflow, conflict, missing };
  },
}));
