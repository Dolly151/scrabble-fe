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
 * File: src/types/game.ts
 *
 * Description:
 *  Internal game models used by the frontend.
 *  These types:
 *   - DO NOT directly correspond to backend responses
 *   - are used to model game logic and UI (board, tiles, multipliers)
 *
 *  Separation from types/api.ts is intentional:
 *   - api.ts = “what comes from the backend”
 *   - game.ts = “how the frontend works with it”
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

/*
 * Multiplier:
 *  Scrabble bonus multipliers for board squares.
 *  null means “no bonus”.
 */
export type Multiplier = 'DL' | 'TL' | 'DW' | 'TW' | null;

/*
 * Square:
 *  One board square in the internal FE model.
 *  Contains:
 *   - r, c: coordinates
 *   - multiplier: bonus type (if FE-generated layout is used)
 */
export type Square = {
  r: number;
  c: number;
  multiplier: Multiplier;
};

/*
 * Board:
 *  Internal representation of the board:
 *   - two-dimensional array of Square
 */
export type Board = Square[][];

/*
 * Tile:
 *  Model of a single tile (letter + point value).
 */
export type Tile = {
  letter: string;
  value: number;
};
