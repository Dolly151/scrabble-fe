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
 * File: src/components/Tile.tsx
 *
 * Description:
 *  Reusable component for rendering a single tile.
 *  It is used in places where a consistent tile appearance is needed:
 *   - "normal" size (e.g. rack)
 *   - "mini" size (e.g. previews, compact lists)
 *   - "ghost" variant (transparent, lower contrast; e.g. rack preview)
 *
 *  The component supports:
 *   - selected state (ring around the tile)
 *   - optional onClick (if not provided, the button is disabled)
 *   - tooltip with letter and value
 *
 * Author: Filip Dolezal, xdolezf00, 250073
 * Date: Autumn 2025
 */

'use client';

import { cn } from '@/lib/utils';
import type { Tile } from '@/types/game';

/*
 * TileSize:
 *  Allows the same component to be used in different UI contexts.
 *  - normal: standard 40×40
 *  - mini: small preview (e.g. 20×20)
 */
type TileSize = 'normal' | 'mini';

/*
 * TileVariant:
 *  - normal: classic “light” tile (high contrast)
 *  - ghost: transparent / muted tile for preview UI
 */
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
  /*
   * Derived booleans for clarity in JSX (fewer conditions directly in render).
   */
  const isMini = size === 'mini';
  const isGhost = variant === 'ghost';

  return (
    <button
      /*
       * onClick:
       *  Optional – if not provided, the button is disabled.
       *  This is intentional: the component can then serve purely for visualization.
       */
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        /*
         * Base style: the tile uses "grid place-items-center" to center the letter.
         * transition-transform + active:scale-95 gives a tactile click feedback.
         */
        'rounded-md grid place-items-center font-bold transition-transform',

        /*
         * selected:
         *  Selection state (e.g. exchange) – highlighted with a ring and border.
         */
        selected ? 'ring-2 ring-blue-400 border-blue-600' : '',

        /*
         * size:
         *  Two sizes depending on usage context.
         */
        isMini ? 'w-5 h-5 text-[10px]' : 'w-10 h-10 text-base',

        /*
         * variant:
         *  Ghost is transparent and less contrasty (e.g. player rack preview).
         *  Normal is the classic “tile” (light) with border + shadow.
         */
        isGhost
          ? 'bg-white/10 text-white/60 border border-white/20 shadow-none'
          : 'bg-white text-slate-900 border border-gray-300 shadow',

        /*
         * Active “press” effect only makes sense if onClick exists.
         */
        onClick && 'active:scale-95'
      )}
      /*
       * Tooltip:
       *  Quick overview (letter + point value). Especially useful on desktop.
       */
      title={`${tile.letter} (${tile.value})`}
    >
      {/* The letter itself. The value is not shown here (unlike in the rack). */}
      <span className="leading-none">{tile.letter}</span>
    </button>
  );
}
