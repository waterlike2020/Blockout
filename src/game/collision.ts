import { getCell, setCell } from "@/game/board";
import { isInside } from "@/game/coords";
import { worldCells } from "@/game/pieces";
import { rotateOffset } from "@/game/rotation";
import { Z_MAX } from "@/game/constants";
import type { ActivePiece, Axis, CellCoord, Grid, RotationDirection } from "@/types/game";

export function canPlace(grid: Grid, cells: readonly CellCoord[]): boolean {
  for (const cell of cells) {
    if (!isInside(cell.x, cell.y, cell.z)) return false;
    if (getCell(grid, cell.x, cell.y, cell.z) !== null) return false;
  }
  return true;
}

export function translate(piece: ActivePiece, dx: number, dy: number, dz: number): ActivePiece {
  return {
    ...piece,
    pivot: {
      x: piece.pivot.x + dx,
      y: piece.pivot.y + dy,
      z: piece.pivot.z + dz,
    },
  };
}

export function rotatePiece(
  piece: ActivePiece,
  axis: Axis,
  direction: RotationDirection,
): ActivePiece {
  return {
    ...piece,
    cells: piece.cells.map((cell) => rotateOffset(cell, axis, direction)),
  };
}

export function tryTranslate(
  grid: Grid,
  piece: ActivePiece,
  dx: number,
  dy: number,
  dz: number,
): ActivePiece | null {
  const next = translate(piece, dx, dy, dz);
  return canPlace(grid, worldCells(next)) ? next : null;
}

export function tryRotate(
  grid: Grid,
  piece: ActivePiece,
  axis: Axis,
  direction: RotationDirection,
): ActivePiece | null {
  const next = rotatePiece(piece, axis, direction);
  return canPlace(grid, worldCells(next)) ? next : null;
}

export function dropDistance(
  grid: Grid,
  piece: ActivePiece,
): { piece: ActivePiece; distance: number } {
  let current = piece;
  let distance = 0;

  while (true) {
    const next = tryTranslate(grid, current, 0, 0, -1);
    if (!next) return { piece: current, distance };
    current = next;
    distance += 1;
  }
}

export function lockPiece(
  grid: Grid,
  piece: ActivePiece,
): { grid: Grid; aboveCeiling: boolean } {
  const cells = worldCells(piece);
  const aboveCeiling = cells.some((cell) => cell.z > Z_MAX);
  let next = grid;

  for (const cell of cells) {
    if (!isInside(cell.x, cell.y, cell.z)) continue;
    next = setCell(next, cell.x, cell.y, cell.z, piece.color);
  }

  return { grid: next, aboveCeiling };
}
