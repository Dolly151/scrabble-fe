// src/types/api.ts

// Board na backendu – pole stringů, "." = prázdno
export type Board = string[][]; 

// Základní odpovědi z BE
export type BoardResp = { board: Board };
export type NumPlayersResp = { number_of_players: number };
export type CurrentPlayerResp = { current_player: number };
export type PlayersHandResp = { player: number; hand: string[] };
export type BoardLayoutResp = { board_layout: (string | null)[][] };

// Bodování hráčů
export type PlayerPointsResp = { player: number; points: number };
export type PlayerPointsAllResp = { player_points: number[] };

// Hodnoty písmen – /letter-values
export type LetterValuesResp = Record<string, number>;

// Nickname – seznam / nastavení
export type PlayerNicknamesResp = {
  player_nicknames: string[];
};

export type SetNicknameResp = {
  status: string;                 // např. "ok"
  error_description: string | null;
};

// =====================
// Game log / history
// =====================

export type LogEventBase = {
  event_id: string;
  time_human: string;
  time_epoch: number;
  type: string;
  message?: string;
  message_cz?: string;
  player?: number;
};

export type WordPlacementEvent = LogEventBase & {
  type: 'word_placement';
  x: number;
  y: number;
  direction: 'row' | 'col';
  word: string;
  points: number;
  player: number;
};

export type TurnSkippedEvent = LogEventBase & {
  type: 'turn_skipped';
  player: number;
};

export type LettersReplacedEvent = LogEventBase & {
  type: 'letters_replaced';
  player: number;
  number_of_letters: number;
};

export type GameStartedEvent = LogEventBase & {
  type: 'game_started';
  number_of_players: number;
};

export type LogEvent =
  | WordPlacementEvent
  | TurnSkippedEvent
  | LettersReplacedEvent
  | GameStartedEvent
  | LogEventBase;

export type LogResp = {
  log: LogEvent[];
};
