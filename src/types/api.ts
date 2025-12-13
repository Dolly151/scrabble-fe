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
 * File: src/types/api.ts
 *
 * Description:
 *  Type definitions for backend API responses.
 *  This file serves as a contract between frontend and backend:
 *   - each interface corresponds to one endpoint
 *   - the frontend works with typed data (no any)
 *
 *  Goal:
 *   - prevent errors when working with the API
 *   - have a clearly documented structure of backend responses
 *   - separate “API data” from internal game models (see types/game.ts)
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

/*
 * Board:
 *  Representation of the game board as returned by the backend.
 *  It is a matrix of characters:
 *   - '.' = empty square
 *   - 'A'..'Z' = placed letter
 */
export type Board = string[][];

/*
 * Response of endpoint GET /g/:id/board
 */
export type BoardResp = {
  board: Board;
};

/*
 * Response of endpoint GET /g/:id/number-of-players
 */
export type NumPlayersResp = {
  number_of_players: number;
};

/*
 * Response of endpoint GET /g/:id/current-player
 */
export type CurrentPlayerResp = {
  current_player: number;
};

/*
 * Response of endpoint GET /g/:id/p/:pnum/hand
 * hand = array of letters in the player's rack
 */
export type PlayersHandResp = {
  hand: string[];
};

/*
 * Response of endpoint GET /g/:id/player-points
 * player_points = array of points of all players (index corresponds to the player)
 */
export type PlayerPointsAllResp = {
  player_points: number[];
};

/*
 * Response of endpoint GET /g/:id/p/:pnum/points
 */
export type PlayerPointsResp = {
  points: number;
};

/*
 * Response of endpoint GET /letter-values
 * letter_values = mapping of letters to point values
 */
export type LetterValuesResp = {
  letter_values: Record<string, number>;
};

/*
 * Response of endpoint GET /board-layout
 * board_layout = matrix of bonus squares (e.g. "TW", "DL", null)
 */
export type BoardLayoutResp = {
  board_layout: (string | null)[][];
};

/*
 * Response of endpoint GET /g/:id/player-nicknames
 */
export type PlayerNicknamesResp = {
  player_nicknames: string[];
};

/*
 * Response of endpoint POST /g/:id/p/:pnum/set-nickname
 */
export type SetNicknameResp = {
  result: 'ok' | 'failed';
};

/*
 * LogEvent:
 *  One item in the game history.
 *  type determines the meaning of the event; other fields are optional depending on the type.
 *
 * Used in the MoveHistory component.
 */
export type LogEvent = {
  event_id: string;
  time_epoch?: number;
  player?: number;
  type:
    | 'word_placement'
    | 'turn_skipped'
    | 'letters_replaced'
    | 'game_started';

  // common / optional attributes
  message?: string;

  // specific to word_placement
  word?: string;
  x?: number;
  y?: number;
  direction?: 'row' | 'col';
  points?: number;

  // specific to letters_replaced
  number_of_letters?: number;
};

/*
 * Response of endpoint GET /g/:id/log
 */
export type LogResp = {
  log: LogEvent[];
};
