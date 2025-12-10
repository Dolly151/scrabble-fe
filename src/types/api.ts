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
