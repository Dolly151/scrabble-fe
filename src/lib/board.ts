import type { Board, Square, Multiplier } from '@/types/game';

export const BOARD_SIZE = 15;

// TODO: doplníme reálné TW/DW/TL/DL rozložení
const getMultiplier = (_r: number, _c: number): Multiplier => null;

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
