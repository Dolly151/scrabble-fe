// src/types/api.ts
export type Board = string[][]; // "." = prázdno

export type BoardResp = { board: Board };
export type NumPlayersResp = { number_of_players: number };
export type CurrentPlayerResp = { current_player: number };
export type PlayersHandResp = { player: number; hand: string[] };
export type BoardLayoutResp = { board_layout: (string | null)[][] };
