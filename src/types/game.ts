export type Multiplier = 'DL' | 'TL' | 'DW' | 'TW' | null;

export interface Square {
  r: number;
  c: number;
  letter?: string;   // položené písmeno
  value?: number;    // bodová hodnota
  multiplier: Multiplier;
  locked?: boolean;  // po potvrzení tahu
}

export interface Tile {
  id: string;
  letter: string;
  value: number;
}

export type Board = Square[][];
