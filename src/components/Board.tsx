"use client";

import { useGameStore } from "@/store/useGameStore";

type PremiumCode = "DL" | "TL" | "DW" | "TW" | null;

function normalizePremium(v: unknown): PremiumCode {
  if (v == null) return null;
  const s = String(v).trim().toUpperCase();
  if (!s || s === "." || s === "  ") return null;

  // Podpora různých zápisů z backendu
  if (s === "3W" || s === "TW") return "TW";
  if (s === "2W" || s === "DW") return "DW";
  if (s === "3C" || s === "3L" || s === "TL") return "TL";
  if (s === "2C" || s === "2L" || s === "DL") return "DL";

  return null;
}

const premiumClass = (code: unknown): string => {
  switch (normalizePremium(code)) {
    case "TW":
      return "bg-red-500";
    case "DW":
      return "bg-rose-300";
    case "TL":
      return "bg-teal-700";
    case "DL":
      return "bg-cyan-300";
    default:
      return "bg-sky-200";
  }
};

export function Board() {
  const board = useGameStore((s) => s.board);
  const layout = useGameStore((s) => s.layout);

  const start = useGameStore((s) => s.start);
  const direction = useGameStore((s) => s.direction);
  const word = useGameStore((s) => s.word);

  const setStart = useGameStore((s) => s.setStart);

  const error = useGameStore((s) => s.error);
  const computePreviewStatus = useGameStore((s) => s.previewStatus);

  const appendFromRack = useGameStore((s) => s.appendFromRack);

  const letterValues = useGameStore((s) => s.letterValues);

  const status = computePreviewStatus();

  const setDirection = useGameStore((s) => s.setDirection);

  if (!board) return null;

  const size = board.length;
  const center = Math.floor(size / 2);

  // souřadnice, kde se má vykreslit preview slova
  const previewCoords = new Set<string>();
  if (start && word) {
    for (let i = 0; i < word.length; i++) {
      const x = direction === "row" ? start.x + i : start.x;
      const y = direction === "col" ? start.y + i : start.y;
      if (y >= 0 && y < size && x >= 0 && x < size) {
        previewCoords.add(`${x},${y}`);
      }
    }
  }
  const badPreview = !!start && !!word && status && !status.ok;

  const getLetterValue = (ch: string) => {
    if (!ch) return 0;
    // kompatibilita s klíči v letterValues (někdy uppercase, někdy už „správné“)
    return (letterValues?.[ch] ??
      letterValues?.[ch.toUpperCase()] ??
      0) as number;
  };

  const handleDrop =
    (x: number, y: number, hasLetter: boolean) =>
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (hasLetter) return;

      const rackIndexStr = e.dataTransfer.getData("rackIndex");
      if (!rackIndexStr) return;

      const rackIndex = Number(rackIndexStr);
      if (Number.isNaN(rackIndex)) return;

      // 1) Začínám nové slovo -> start se nastaví na dropnuté políčko
      if (!start || !word || word.length === 0) {
        setStart(x, y);
        appendFromRack(rackIndex);
        return;
      }

      // 2) Už stavím slovo -> start se NESMÍ měnit.
      if (word.length === 1) {
        // Druhé písmeno: dovolíme drop buď doprava, nebo dolů od startu,
        // a podle toho nastavíme směr.
        const canRow = x === start.x + 1 && y === start.y;
        const canCol = x === start.x && y === start.y + 1;

        if (!canRow && !canCol) return;

        if (canRow) setDirection("row");
        if (canCol) setDirection("col");

        appendFromRack(rackIndex);
        return;
      }

      // Třetí a další písmeno: už musí sedět na "další očekávané" políčko dle směru.
      const nextX = direction === "row" ? start.x + word.length : start.x;
      const nextY = direction === "col" ? start.y + word.length : start.y;

      if (x !== nextX || y !== nextY) return;

      appendFromRack(rackIndex);
    };

  return (
    <div className="mx-auto w-full max-w-[900px] p-4">
      <div className="grid grid-cols-[auto,1fr] grid-rows-[auto,1fr] gap-1">
        {/* horní čísla sloupců */}
        <div
          className="col-start-2 row-start-1 grid gap-1 px-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`top-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* levá čísla řádků */}
        <div
          className="col-start-1 row-start-2 grid gap-1 py-3 text-xs font-bold text-white/80"
          style={{
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: size }).map((_, i) => (
            <div key={`left-${i}`} className="grid place-items-center">
              {i + 1}
            </div>
          ))}
        </div>

        {/* samotná deska */}
        <div className="col-start-2 row-start-2">
          <div className="relative aspect-square w-full">
            {error && (
              <div className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-3 py-1 text-white text-sm shadow">
                {error}
              </div>
            )}

            <div
              className="grid h-full gap-1 rounded-xl bg-slate-900 p-3"
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, y) =>
                row.map((cell, x) => {
                  const isStart = !!start && start.x === x && start.y === y;
                  const isPreview = previewCoords.has(`${x},${y}`);
                  let prem = layout?.[y]?.[x];

                  // Hotfix: TL kolem středu (diagonálně ±2) se nám někdy vrací jako DW.
                  // Opravíme jen když to skutečně vychází jako DW, aby se nepřepisovalo správné TL.
                  if (size === 15) {
                    const cx = center;
                    const cy = center;

                    const isTLDiagonal2 =
                      (x === cx - 2 && y === cy - 2) ||
                      (x === cx + 2 && y === cy - 2) ||
                      (x === cx - 2 && y === cy + 2) ||
                      (x === cx + 2 && y === cy + 2);

                    const isTLDiagonal2Other =
                      (x === cx - 2 && y === cy + 2) ||
                      (x === cx + 2 && y === cy - 2);

                    // Ty, které jsi ukázal: (10,6) a (6,10) => (x=cx+2,y=cy-2) a (x=cx-2,y=cy+2)
                    const shouldBeTL = isTLDiagonal2Other;

                    if (shouldBeTL && normalizePremium(prem) === "DW") {
                      prem = "TL";
                    }
                  }

                  const hasLetter = cell !== ".";
                  const isCenter = x === center && y === center;

                  // ghost písmeno pro preview (jen na prázdných polích)
                  let previewLetter: string | null = null;
                  if (!hasLetter && start && isPreview && word) {
                    const idx = direction === "row" ? x - start.x : y - start.y;
                    if (idx >= 0 && idx < word.length) {
                      previewLetter = word[idx] ?? null;
                    }
                  }

                  const premiumText = (() => {
                    if (!hasLetter) {
                      if (isCenter) return "★";
                      const n = normalizePremium(prem);
                      if (n === "TW") return "TW";
                      if (n === "DW") return "DW";
                      if (n === "TL") return "TL";
                      if (n === "DL") return "DL";
                    }
                    return "";
                  })();

                  const showTile = hasLetter || !!previewLetter;
                  const tileLetter = hasLetter
                    ? cell
                    : (previewLetter ?? "").toUpperCase();

                  const tileValue = showTile ? getLetterValue(tileLetter) : 0;

                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => setStart(x, y)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop(x, y, hasLetter)}
                      className={[
                        "relative grid place-items-center rounded-md border transition-transform active:scale-95",
                        isStart
                          ? "ring-2 ring-sky-500 border-sky-600"
                          : "border-slate-700",

                        isCenter
                          ? "bg-amber-300 border-amber-500"
                          : premiumClass(prem),

                        isPreview
                          ? `outline outline-2 ${
                              badPreview
                                ? "outline-red-500"
                                : "outline-amber-400"
                            }`
                          : "",
                      ].join(" ")}
                      title={`x=${x + 1}, y=${y + 1}`}
                    >
                      {!showTile && premiumText && (
                        <span className="pointer-events-none select-none text-[10px] font-black tracking-wider text-slate-900/90">
                          {premiumText}
                        </span>
                      )}

                      {showTile && (
                        <span
                          className={[
                            // trochu větší než dřív, a relativní kvůli bodům v rohu
                            "pointer-events-none select-none relative",
                            "rounded-md bg-yellow-100 shadow-inner",
                            "w-[42px] h-[42px] grid place-items-center",
                            "border border-yellow-700 text-slate-900",
                            "font-black text-lg leading-none",
                          ].join(" ")}
                        >
                          {tileLetter}
                          <span className="absolute bottom-[2px] right-[4px] text-[10px] font-bold leading-none">
                            {tileValue}
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
