'use client';
import { cn } from '@/lib/utils';
import type { Tile } from '@/types/game';

export function TileComp({
  tile,
  selected,
  onClick,
}: {
  tile: Tile;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-10 h-10 rounded-md shadow text-center grid place-items-center border font-bold bg-white',
        'transition-transform active:scale-95',
        selected ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-300',
      )}
      title={`${tile.letter} (${tile.value})`}
    >
      <span className="leading-none">{tile.letter}</span>
    </button>
  );
}
