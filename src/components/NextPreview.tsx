"use client";

import { PIECE_COLORS } from "@/game/constants";
import { PIECE_SHAPES } from "@/game/pieces";
import type { PieceKind } from "@/types/game";

const CELL = 16;

export function NextPreview({ kind }: { kind: PieceKind }) {
  const cells = PIECE_SHAPES[kind];
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = (maxX - minX + 1) * (CELL + 4) + 8;
  const height = (maxY - minY + 1) * (CELL + 4) + 8;
  const solid = PIECE_SHAPES[kind].some((cell) => cell.z !== 0);

  return (
    <div>
      <div className="relative" style={{ width, height }} aria-hidden>
        {cells.map((cell) => {
          const nudge = cell.z === 0 ? 0 : 7;
          return (
            <span
              key={`${cell.x}:${cell.y}:${cell.z}`}
              className="absolute rounded-[3px]"
              style={{
                width: CELL,
                height: CELL,
                left: (cell.x - minX) * (CELL + 4) + nudge,
                bottom: (cell.y - minY) * (CELL + 4) + nudge,
                background: PIECE_COLORS[kind],
              }}
            />
          );
        })}
      </div>
      <p className="sr-only">
        다음 조각 {kind}
        {solid ? ", 입체" : ""}
      </p>
    </div>
  );
}
