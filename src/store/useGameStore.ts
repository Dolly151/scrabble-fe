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
 * File: src/store/useGameStore.ts
 *
 * Description:
 *  Central global store (Zustand) for the entire Scrabble frontend.
 *  This file holds:
 *   - current game state (board, layout, players, hands, points, log)
 *   - UI state (loading, error)
 *   - local “in-progress move” state (start, direction, word, wordRackIndices)
 *   - actions that call the backend (loadGame, place, skipTurn, replaceLetters, nicknames)
 *   - purely client-side helpers (previewStatus, append from rack/keyboard, backspace)
 *
 *  Goal:
 *   - keep components as “thin” as possible (render + calling actions)
 *   - concentrate network communication and state here
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

import { create } from "zustand";
import type { Board } from "@/types/api";
import type { LogEvent } from "@/types/api";
import { getLog } from "@/lib/api";
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
} from "@/lib/api";

/*
 * Direction:
 *  Word composition direction:
 *   - "row" = horizontal (increase x)
 *   - "col" = vertical   (increase y)
 */
type Direction = "row" | "col";

/*
 * PreviewStatus:
 *  Result of client-side validation of the “preview” word before sending it to the backend.
 *  Used mainly for UX:
 *   - so the UI can immediately show “why it cannot be placed” (overflow, conflict, missing tiles)
 *  Note: This is a lightweight validation – the backend is still the source of truth.
 */
type PreviewStatus = {
  ok: boolean;
  overflow: boolean; // the word does not fit within the board dimensions
  conflict: boolean; // collision with an existing letter on the board (outside a match)
  missing: string[]; // missing letters in the rack (e.g. ["A×1", "E×2"])
};

/*
 * GameStore:
 *  Complete contract between the store and the UI.
 *  Components take only what they need (selectors),
 *  but it is useful to have everything typed in one place.
 */
type GameStore = {
  // --- game identity ---
  gameId?: string;

  // --- game data from backend ---
  board: Board | null; // letter grid ('.' = empty)
  layout: (string | null)[][] | null; // bonus layout (TW/DW/TL/DL etc.)
  nPlayers: number; // number of players
  currentPlayer: number; // index of the player on turn
  hands: Record<number, string[]>; // player racks (letters)
  points: Record<number, number>; // player points

  // --- UI state ---
  loading: boolean; // is there an ongoing load / request?
  error?: string | null; // last error message for the user

  // --- event log ---
  log: LogEvent[];

  // --- helper data for UI (tiles) ---
  letterValues: Record<string, number>; // A=1, B=3, ...
  playerNicknames: Record<number, string>;
  setNickname: (playerIndex: number, nickname: string) => Promise<void>;

  // --- local “in-progress move” state (word preview) ---
  start: { x: number; y: number } | null; // cursor / word start
  direction: Direction;
  word: string; // composed word (already uppercase)
  wordRackIndices: (number | null)[]; // mapping of word letters to rack indices

  // --- letter exchange ---
  exchanging: boolean; // are we in exchange mode?
  exchangeSelection: number[]; // indices of selected tiles in the rack

  // --- game lifecycle ---
  loadGame: (gid: string) => Promise<void>;
  refresh: () => Promise<void>;

  // --- setters for preview state ---
  setStart: (x: number, y: number) => void;
  setDirection: (d: Direction) => void;
  setWord: (w: string) => void;
  clear: () => void;

  // --- game actions ---
  place: () => Promise<void>;
  skipTurn: () => Promise<void>;

  // --- exchange: actions ---
  startExchange: () => void;
  toggleExchangeIndex: (index: number) => void;
  cancelExchange: () => void;
  confirmExchange: () => Promise<void>;

  // --- working with rack / composing a word ---
  appendFromRack: (index: number) => void;
  appendFromKeyboard: (letter: string) => void;
  backspaceWord: () => void;

  /*
   * placeLetterPreview:
   *  Unified entry point for “place a letter into preview”:
   *   - set start to (x,y)
   *   - add the letter either via rackIndex (DnD) or via letter (keyboard)
   *
   * Important: We intentionally do not change board/hands, only preview state (start+word).
   */
  placeLetterPreview: (
    x: number,
    y: number,
    letter: string,
    rackIndex?: number
  ) => void;

  // --- client-side preview validation ---
  previewStatus: () => PreviewStatus;
};

/*
 * hasLetterValuesField:
 *  Type guard that checks whether an API response contains `letter_values`.
 *  Useful if an endpoint can return multiple object variants and we want to safely
 *  access the field.
 */
function hasLetterValuesField(
  obj: unknown
): obj is { letter_values: Record<string, number> } {
  if (typeof obj === "object" && obj !== null && "letter_values" in obj) {
    const lv = (obj as Record<string, unknown>)["letter_values"];
    return typeof lv === "object" && lv !== null;
  }
  return false;
}

/*
 * nickDoneKey:
 *  localStorage key that indicates: “nicknames for this game are already done”.
 *  Used as a UX optimization:
 *   - when done, loadGame can load nicknames from the backend
 *   - when not done, we keep playerNicknames empty → NicknameDialog opens
 */
const nickDoneKey = (gid: string) => `scrabble:nicknames_done:${gid}`;

/*
 * useGameStore:
 *  Single source of truth for the FE game state.
 *  create() receives the initial object + methods that have access to set/get.
 */
export const useGameStore = create<GameStore>((set, get) => ({
  // --- initialize game state ---
  gameId: undefined,
  board: null,
  layout: null,
  nPlayers: 0,
  currentPlayer: 0,
  hands: {},
  points: {},
  loading: false,
  error: null,

  // event log
  log: [],

  // tile/UI helpers
  letterValues: {},
  playerNicknames: {},

  // --- move preview state ---
  start: null,
  direction: "row",
  word: "",
  wordRackIndices: [],

  // --- letter exchange ---
  exchanging: false,
  exchangeSelection: [],

  /*
   * loadGame:
   *  Main “bootstrap” and refresh of the entire game from the backend.
   *
   * Intent:
   *  - fetch layout (only once if already cached in memory)
   *  - fetch main data in parallel (board, nPlayers, currentPlayer, points, letterValues, log)
   *  - player hands (hand) are loaded sequentially in a loop (N requests)
   *  - nicknames are loaded only if localStorage says “done”
   *    (so default/random names are not pushed and the dialog stays in control)
   */
  async loadGame(gid: string) {
    set({ loading: true, error: null, gameId: gid });

    try {
      // Bonus layout does not change over time → if we already have it, do not refetch.
      if (!get().layout) {
        const lay = await getBoardLayout();
        set({ layout: lay.board_layout });
      }

      /*
       * done:
       *  Read from localStorage whether nicknames have already been fully set once.
       *  If yes, we load them from the backend during game load and show them in the UI immediately.
       */
      const done =
        typeof window !== "undefined" &&
        !!localStorage.getItem(nickDoneKey(gid));

      /*
       * Promise.all:
       *  Fetch main data in parallel for speed:
       *   - board
       *   - number_of_players
       *   - current-player
       *   - player-points (all)
       *   - letter-values
       *   - nicknames (only if done=true; otherwise return null)
       *   - log (move history)
       */
      const [b, n, cur, pointsResp, letterValuesResp, nicksResp, logResp] =
        await Promise.all([
          getBoard(gid),
          getNumPlayers(gid),
          getCurrentPlayer(gid),
          getAllPlayerPoints(gid),
          getLetterValues(),
          done ? getPlayerNicknames(gid) : Promise.resolve(null),
          getLog(gid),
        ]);

      // --- player hands (racks) ---
      // Loaded sequentially – each player has their own endpoint.
      const hands: Record<number, string[]> = {};
      for (let i = 0; i < n.number_of_players; i++) {
        const h = await getHand(gid, i);
        hands[i] = h.hand;
      }

      // --- points ---
      // The backend returns an array of points; we map it to index->points.
      const points: Record<number, number> = {};
      pointsResp.player_points.forEach((p, idx) => {
        points[idx] = p;
      });

      /*
       * Nicknames:
       *  We intentionally do not always load them – we want NicknameDialog
       *  to control when nicknames are first set and persisted.
       *
       * If done=false → remains {} → NicknameDialog sees “missing” and opens.
       */
      const playerNicknames: Record<number, string> = {};
      if (done && nicksResp) {
        nicksResp.player_nicknames.forEach((name, idx) => {
          playerNicknames[idx] = name;
        });
      }

      /*
       * Preserve start:
       *  If the player already set the cursor (start) and we only refresh the game,
       *  it is nice not to lose it (better UX).
       */
      const currentStart = get().start;

      /*
       * letterValuesResp:
       *  Some endpoints may return different shapes; hence the type guard.
       */
      const letterValues = hasLetterValuesField(letterValuesResp)
        ? letterValuesResp.letter_values
        : (letterValuesResp as unknown as Record<string, number>);

      // Final write to store – note: word/preview state is intentionally not modified here.
      set({
        board: b.board,
        nPlayers: n.number_of_players,
        currentPlayer: cur.current_player,
        hands,
        points,
        letterValues,
        playerNicknames,
        start: currentStart,
        log: logResp.log,
      });
    } catch (e) {
      // Unified mapping of errors to text for the UI.
      set({
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      set({ loading: false });
    }
  },

  /*
   * refresh:
   *  Simple helper: if we have gameId, reload the game.
   *  (Used after place/skip/exchange when the server state changed.)
   */
  async refresh() {
    const gid = get().gameId;
    if (gid) {
      await get().loadGame(gid);
    }
  },

  /*
   * setNickname:
   *  Sets a player's nickname:
   *   - normalizes input (trim + fallback PlayerX)
   *   - stores it on the backend (setPlayerNickname)
   *   - stores it in the store (playerNicknames)
   *   - if all nicknames are filled, store “done” in localStorage
   */
  async setNickname(playerIndex: number, nickname: string) {
    const gid = get().gameId;
    if (!gid) return;

    const finalName = nickname.trim() || `Player${playerIndex + 1}`;
    await setPlayerNickname(gid, playerIndex, finalName);

    set((state) => {
      const next = {
        ...state.playerNicknames,
        [playerIndex]: finalName,
      };

      // check “are all nicknames filled?”
      const allFilled = Array.from({ length: state.nPlayers }, (_, i) =>
        (next[i] ?? "").trim()
      ).every((v) => v.length > 0);

      // if yes, mark the game as done (for loadGame)
      if (allFilled && typeof window !== "undefined" && state.gameId) {
        localStorage.setItem(nickDoneKey(state.gameId), "1");
      }

      return { playerNicknames: next };
    });
  },

  // --- preview setters ---

  /*
   * setStart:
   *  Sets the cursor (starting cell). Also clears error,
   *  because the user typically reacts to an error by changing position.
   */
  setStart(x, y) {
    set({ start: { x, y }, error: null });
  },

  /*
   * setDirection:
   *  Switch word composition direction.
   */
  setDirection(d) {
    set({ direction: d });
  },

  /*
   * setWord:
   *  Directly set the word (e.g. if there were an input).
   *  We keep consistency: the word is stored in uppercase.
   *  wordRackIndices is reset to the same length (null = unknown tile source).
   */
  setWord(w) {
    const up = w.toUpperCase();
    set({
      word: up,
      wordRackIndices: new Array(up.length).fill(null),
      error: null,
    });
  },

  /*
   * clear:
   *  Reset the in-progress move – typically after a successful place,
   *  or when the user wants to start over.
   */
  clear() {
    set({
      start: null,
      word: "",
      wordRackIndices: [],
      error: null,
    });
  },

  // --- game actions: place / skip ---

  /*
   * place:
   *  Confirm the word:
   *   - if gameId/start/word is missing, do nothing
   *   - set loading
   *   - call placeWord on the backend
   *   - on failed set error, on ok reset preview and refresh the game
   */
  async place() {
    const { gameId, start, direction, word } = get();
    if (!gameId || !start || !word) return;

    set({ loading: true, error: null });
    try {
      const res = await placeWord(gameId, start.x, start.y, word, direction);

      if (res.result === "failed") {
        set({ error: res.error_description ?? "Invalid move" });
      } else {
        // On success, clear preview state and load the new game state.
        set({ word: "", wordRackIndices: [], start: null });
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

  /*
   * skipTurn:
   *  Skip the turn:
   *   - clear preview state (so the player does not “carry over” a partial word)
   *   - call the backend
   *   - on ok refresh
   */
  async skipTurn() {
    const { gameId } = get();
    if (!gameId) return;

    set({
      loading: true,
      error: null,
      word: "",
      wordRackIndices: [],
      start: null,
    });

    try {
      const res = await skipTurn(gameId);
      if (res.result === "failed") {
        set({ error: res.error_description ?? "Skip failed" });
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

  // --- letter exchange (exchange) ---

  /*
   * startExchange:
   *  Enables exchange mode.
   *  Safety rule: if we are already composing a word (word is not empty),
   *  we do not allow exchange to avoid mixing states.
   */
  startExchange() {
    if (get().word) return; // if composing a word, do not allow exchange
    set({
      exchanging: true,
      exchangeSelection: [],
      error: null,
    });
  },

  /*
   * toggleExchangeIndex:
   *  Toggles selection of a rack tile for exchange (selected/unselected).
   *  Works only in exchange mode.
   */
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

  /*
   * cancelExchange:
   *  Disables exchange mode and clears the selection.
   */
  cancelExchange() {
    set({
      exchanging: false,
      exchangeSelection: [],
    });
  },

  /*
   * confirmExchange:
   *  Confirm exchange:
   *   - create a string of letters from selection indices (e.g. "AEI")
   *   - call replaceLetters on the backend
   *   - on ok reset exchange + preview and refresh the game
   */
  async confirmExchange() {
    const { gameId, exchanging, exchangeSelection, hands, currentPlayer } =
      get();

    if (!gameId || !exchanging || exchangeSelection.length === 0) return;

    const rack = hands[currentPlayer] ?? [];
    const letters = exchangeSelection
      .map((i) => rack[i])
      .filter((ch) => typeof ch === "string")
      .join("");

    if (!letters) return;

    set({ loading: true, error: null });

    try {
      const res = await replaceLetters(gameId, letters);
      if (res.result === "failed") {
        set({
          error: res.error_description ?? "Exchange failed",
        });
      } else {
        set({
          word: "",
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

  // --- working with rack / composing a word ---

  /*
   * appendFromRack:
   *  Add a letter to the preview word based on the rack index.
   *  We also store the index so that:
   *   - we can prevent reusing the same tile
   *   - we can correctly undo letters with backspace
   */
  appendFromRack(index) {
    const { currentPlayer, hands, word, wordRackIndices, exchanging } = get();
    if (exchanging) return; // do not append from rack in exchange mode

    const rack = hands[currentPlayer] ?? [];
    const ch = rack[index];
    if (!ch) return;

    const up = ch.toUpperCase();
    set({
      word: (word || "") + up,
      wordRackIndices: [...wordRackIndices, index],
      error: null,
    });
  },

  /*
   * appendFromKeyboard:
   *  Add a letter via keyboard:
   *   - find the first unused tile in the rack matching the letter
   *   - if found, add it just like appendFromRack
   *
   * Important:
   *  - we respect the usedSet from wordRackIndices (a tile must not be used twice)
   */
  appendFromKeyboard(letter) {
    const { currentPlayer, hands, word, wordRackIndices, exchanging } = get();
    if (exchanging) return;

    const rack = hands[currentPlayer] ?? [];
    if (!rack.length) return;

    const upper = letter.toUpperCase();

    const used = new Set(
      wordRackIndices.filter((i): i is number => i !== null && i !== undefined)
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
      word: (word || "") + upper,
      wordRackIndices: [...wordRackIndices, chosenIndex],
      error: null,
    });
  },

  /*
   * backspaceWord:
   *  Removes the last added letter from the word.
   *  Note: In this implementation, “return to rack” is only logical –
   *  the rack is actually refreshed from the backend (or the UI simply allows the tile to be used again).
   */
  backspaceWord() {
    const { word, wordRackIndices } = get();
    if (!word || word.length === 0) return;

    set({
      word: word.slice(0, -1),
      wordRackIndices: wordRackIndices.slice(0, -1),
      error: null,
    });
  },

  /*
   * placeLetterPreview:
   *  Unified adapter for different inputs (DnD, click, keyboard):
   *   - set start
   *   - add a letter from the rack if we know rackIndex (DnD)
   *   - otherwise add via keyboard (searches the rack for the first matching tile)
   *
   * Important: We intentionally do not modify board or hands (backend handles that).
   */
  placeLetterPreview(x, y, letter, rackIndex) {
    // Intentionally DO NOT modify board or hands.
    // We want to use the same model as keyboard/click: start + word + wordRackIndices.
    get().setStart(x, y);

    if (rackIndex != null) {
      get().appendFromRack(rackIndex);
    } else {
      get().appendFromKeyboard(letter);
    }
  },

  /*
   * previewStatus:
   *  Client-side validation of the preview word against the current board.
   *
   * What we check:
   *  1) overflow: whether all coordinates fit within the board
   *  2) conflict: if a letter already exists on the board and does not match what we want to place
   *  3) missing: whether we have enough letters in the rack (counts repeated letters as well)
   *
   * Note: We intentionally check “only” local consistency here.
   * Connection to existing words, dictionary checks, etc. can still be rejected by the backend even if ok=true.
   */
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

    // Copy of the rack for “consuming” letters during the check.
    const rack = [...(hands[currentPlayer] ?? [])];
    const need: Record<string, number> = {};

    for (let i = 0; i < w.length; i++) {
      const x = direction === "row" ? start.x + i : start.x;
      const y = direction === "col" ? start.y + i : start.y;

      // 1) overflow
      if (x < 0 || y < 0 || x >= cols || y >= rows) {
        overflow = true;
        continue;
      }

      const existing = board[y]?.[x];

      /*
       * 2) conflict:
       *  If there is already something on the board (not '.'), we allow only a match.
       *  (This covers “crossing” through an existing letter.)
       */
      const desired = w[i];
      if (existing && existing !== "." && existing.toUpperCase() !== desired) {
        conflict = true;
        continue;
      }

      /*
       * 3) missing:
       *  If the square is empty ('.'), we must have the letter in the rack.
       *  We consume it from the rack copy. If missing, we increase the requirement in need.
       *
       *  If there is an existing letter on the square, we do not consume from the rack
       *  because we are not physically placing anything there.
       */
      if (!existing || existing === ".") {
        const letter = desired;

        const idx = rack.findIndex((r) => r.toUpperCase() === letter);
        if (idx >= 0) {
          rack.splice(idx, 1);
        } else {
          need[letter] = (need[letter] ?? 0) + 1;
        }
      }
    }

    // Convert missing into a readable form like "A×2"
    const missing = Object.entries(need).map(([ch, n]) => `${ch}×${n}`);
    const ok = !overflow && !conflict && missing.length === 0;

    return { ok, overflow, conflict, missing };
  },
}));
