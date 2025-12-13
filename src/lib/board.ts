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
 * File: src/lib/board.ts
 *
 * Description:
 *  Helper module for creating a local board representation (model).
 *  In the current version of the project, most of the layout and bonuses
 *  are taken from the backend, but this file serves as:
 *   - a fallback / base for generating an empty board
 *   - a place where TW/DW/TL/DL multipliers could be defined purely on the frontend
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

import type { Board, Square, Multiplier } from '@/types/game';

/*
 * The standard Scrabble board size is 15×15.
 */
export const BOARD_SIZE = 15;

/*
 * getMultiplier:
 *  Returns the multiplier for the square at position (r, c).
 *  In this version, it returns null everywhere – bonuses are handled
 *  via the backend (board-layout).
 *
 * Note: This is intentionally left as a prepared hook for the future
 * (or as a fallback), in case generating the layout on the frontend
 * becomes necessary.
 */
const getMultiplier = (_r: number, _c: number): Multiplier => null;

/*
 * createBoard:
 *  Creates an empty BOARD_SIZE×BOARD_SIZE matrix where each Square contains:
 *   - r, c: coordinates
 *   - multiplier: (currently null)
 * The return type is Board (alias for Square[][]).
 */
export function createBoard(): Board {
  const b: Board = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: Square[] = [];

    for (let c = 0; c < BOARD_SIZE; c++) {
      row.push({ r, c, multiplier: getMultiplier(r, c) });
    }

    b.push(row);
  }

  return b;
}
