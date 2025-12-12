'use client';
import { cn } from '@/lib/utils';
import type { Tile } from '@/types/game';

type TileSize = 'normal' | 'mini';
type TileVariant = 'normal' | 'ghost';

export function TileComp({
  tile,
  selected,
  onClick,
  size = 'normal',
  variant = 'normal',
}: {
  tile: Tile;
  selected?: boolean;
  onClick?: () => void;
  size?: TileSize;
  variant?: TileVariant;
}) {
  const isMini = size === 'mini';
  const isGhost = variant === 'ghost';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'rounded-md grid place-items-center font-bold transition-transform',
        selected ? 'ring-2 ring-blue-400 border-blue-600' : '',
        isMini ? 'w-5 h-5 text-[10px]' : 'w-10 h-10 text-base',
        isGhost
          ? 'bg-white/10 text-white/60 border border-white/20 shadow-none'
          : 'bg-white text-slate-900 border border-gray-300 shadow',
        onClick && 'active:scale-95',
      )}
      title={`${tile.letter} (${tile.value})`}
    >
      <span className="leading-none">{tile.letter}</span>
    </button>
  );
}
