import type { Axis, CellCoord, RotationDirection } from "@/types/game";

export const AXES: readonly Axis[] = ["x", "y", "z"];

function coordinate(value: number): number {
  return value === 0 ? 0 : value;
}

function cell(x: number, y: number, z: number): CellCoord {
  return { x: coordinate(x), y: coordinate(y), z: coordinate(z) };
}

/** Quarter turn around the piece pivot. Inputs and outputs stay on integer cells. */
export function rotateOffset(
  cellCoord: CellCoord,
  axis: Axis,
  direction: RotationDirection,
): CellCoord {
  const { x, y, z } = cellCoord;

  if (axis === "x") {
    return direction === 1 ? cell(x, -z, y) : cell(x, z, -y);
  }

  if (axis === "y") {
    return direction === 1 ? cell(z, y, -x) : cell(-z, y, x);
  }

  return direction === 1 ? cell(-y, x, z) : cell(y, -x, z);
}
