import { PIECE_COLORS, SPAWN_X, SPAWN_Y, SPAWN_Z } from "@/game/constants";
import type { ActivePiece, CellCoord, PieceKind } from "@/types/game";

export const STANDARD_KINDS = ["I", "O", "L", "J", "T", "S", "Z"] as const satisfies readonly PieceKind[];

export const ADVANCED_KINDS = ["L3", "Corner"] as const satisfies readonly PieceKind[];

export const PIECE_SHAPES: Record<PieceKind, readonly CellCoord[]> = {
  I: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
  ],
  O: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
  ],
  T: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ],
  L: [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 1, y: -1, z: 0 },
  ],
  J: [
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: -1, y: -1, z: 0 },
  ],
  S: [
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
  ],
  Z: [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: -1, y: 1, z: 0 },
  ],
  L3: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 1, z: -1 },
  ],
  Corner: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: -1 },
  ],
};

export function createPiece(
  kind: PieceKind,
  pivot: CellCoord = { x: SPAWN_X, y: SPAWN_Y, z: SPAWN_Z },
): ActivePiece {
  return {
    kind,
    color: PIECE_COLORS[kind],
    pivot: { ...pivot },
    cells: PIECE_SHAPES[kind].map((cell) => ({ ...cell })),
  };
}

export function worldCells(piece: ActivePiece): CellCoord[] {
  return piece.cells.map((cell) => ({
    x: piece.pivot.x + cell.x,
    y: piece.pivot.y + cell.y,
    z: piece.pivot.z + cell.z,
  }));
}
