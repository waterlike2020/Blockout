import { cellIndex } from "@/game/coords";
import {
  LAYER_CELL_COUNT,
  PIT_CELL_COUNT,
  PIT_DEPTH,
  PIT_WIDTH,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  Z_MAX,
  Z_MIN,
} from "@/game/constants";
import type { Grid, OccupiedCell } from "@/types/game";

export function createEmptyGrid(): Grid {
  return Array.from({ length: PIT_CELL_COUNT }, () => null);
}

export function getCell(grid: Grid, x: number, y: number, z: number): string | null {
  return grid[cellIndex(x, y, z)] ?? null;
}

export function setCell(
  grid: Grid,
  x: number,
  y: number,
  z: number,
  color: string | null,
): Grid {
  const index = cellIndex(x, y, z);
  if (grid[index] === color) return grid;
  const next = grid.slice();
  next[index] = color;
  return next;
}

export function isLayerFull(grid: Grid, z: number): boolean {
  for (let y = Y_MIN; y <= Y_MAX; y += 1) {
    for (let x = X_MIN; x <= X_MAX; x += 1) {
      if (getCell(grid, x, y, z) === null) return false;
    }
  }
  return true;
}

export function fullLayers(grid: Grid): number[] {
  const layers: number[] = [];
  for (let z = Z_MIN; z <= Z_MAX; z += 1) {
    if (isLayerFull(grid, z)) layers.push(z);
  }
  return layers;
}

export function isGridEmpty(grid: Grid): boolean {
  for (const cell of grid) {
    if (cell !== null) return false;
  }
  return true;
}

function readLayer(grid: Grid, z: number): (string | null)[] {
  const layer: (string | null)[] = [];
  for (let y = Y_MIN; y <= Y_MAX; y += 1) {
    for (let x = X_MIN; x <= X_MAX; x += 1) {
      layer.push(getCell(grid, x, y, z));
    }
  }
  return layer;
}

export function collapseLayers(grid: Grid, layers: readonly number[]): Grid {
  const remove = new Set(layers);
  const kept: (string | null)[][] = [];

  for (let z = Z_MIN; z <= Z_MAX; z += 1) {
    if (!remove.has(z)) kept.push(readLayer(grid, z));
  }

  while (kept.length < PIT_DEPTH) {
    kept.push(Array.from({ length: LAYER_CELL_COUNT }, () => null));
  }

  const next = createEmptyGrid();
  for (let layerIndex = 0; layerIndex < kept.length; layerIndex += 1) {
    const layer = kept[layerIndex];
    if (!layer) continue;
    for (let cell = 0; cell < layer.length; cell += 1) {
      const color = layer[cell];
      if (!color) continue;
      const x = X_MIN + (cell % PIT_WIDTH);
      const y = Y_MIN + Math.floor(cell / PIT_WIDTH);
      next[cellIndex(x, y, Z_MIN + layerIndex)] = color;
    }
  }

  return next;
}

export function occupiedCells(grid: Grid): OccupiedCell[] {
  const cells: OccupiedCell[] = [];
  for (let z = Z_MIN; z <= Z_MAX; z += 1) {
    for (let y = Y_MIN; y <= Y_MAX; y += 1) {
      for (let x = X_MIN; x <= X_MAX; x += 1) {
        const color = getCell(grid, x, y, z);
        if (color !== null) cells.push({ x, y, z, color });
      }
    }
  }
  return cells;
}
