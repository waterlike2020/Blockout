import {
  LAYER_CELL_COUNT,
  PIT_WIDTH,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  Z_MAX,
  Z_MIN,
} from "@/game/constants";

export function isInside(x: number, y: number, z: number): boolean {
  return (
    x >= X_MIN &&
    x <= X_MAX &&
    y >= Y_MIN &&
    y <= Y_MAX &&
    z >= Z_MIN &&
    z <= Z_MAX
  );
}

export function cellIndex(x: number, y: number, z: number): number {
  const ix = x - X_MIN;
  const iy = y - Y_MIN;
  const iz = z - Z_MIN;
  return iz * LAYER_CELL_COUNT + iy * PIT_WIDTH + ix;
}
