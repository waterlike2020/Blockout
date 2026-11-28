import { describe, expect, it } from "vitest";
import { pullKind, shuffleBag } from "@/game/bag";
import {
  collapseLayers,
  createEmptyGrid,
  fullLayers,
  getCell,
  isGridEmpty,
  isLayerFull,
  occupiedCells,
  setCell,
} from "@/game/board";
import { canPlace, tryRotate, tryTranslate } from "@/game/collision";
import { layerColor, layerRgb } from "@/game/color";
import {
  CAMERA_LOOK_X,
  CAMERA_LOOK_Y,
  CAMERA_LOOK_Z,
  CAMERA_X,
  CAMERA_Y,
  CAMERA_Z,
  INITIAL_TICK_MS,
  LAYER_CELL_COUNT,
  MIN_TICK_MS,
  SLOWEST_TICK_MS,
  SOFT_DROP_MS,
  PIT_CELL_COUNT,
  SCORE_BLOCKOUT,
  SCORE_LAYER_BASE,
  TICK_STEP_MS,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  Z_MAX,
  Z_MIN,
} from "@/game/constants";
import { cellIndex } from "@/game/coords";
import { ADVANCED_KINDS, createPiece, PIECE_SHAPES, STANDARD_KINDS, worldCells } from "@/game/pieces";
import { AXES, rotateOffset } from "@/game/rotation";
import { clearReward, gravityInterval, layerClearScore } from "@/game/scoring";
import { HARD_DROP_KEYS, MOVE_KEYS, ROTATE_KEYS, SOFT_DROP_KEY } from "@/game/controls";
import { cameraFovDegrees } from "@/game/view";
import type { CellCoord, Grid, PieceKind } from "@/types/game";

function sorted(cells: readonly CellCoord[]): string[] {
  return cells.map((cell) => `${cell.x},${cell.y},${cell.z}`).sort();
}

function fillLayer(grid: Grid, z: number, color = "#abc"): Grid {
  let next = grid;
  for (let y = Y_MIN; y <= Y_MAX; y += 1) {
    for (let x = X_MIN; x <= X_MAX; x += 1) {
      next = setCell(next, x, y, z, color);
    }
  }
  return next;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function volume(cells: readonly CellCoord[]): number {
  const origin = cells[0];
  if (!origin || cells.length < 4) return 0;
  const vectors = cells.slice(1, 4).map((cell) => ({
    x: cell.x - origin.x,
    y: cell.y - origin.y,
    z: cell.z - origin.z,
  }));
  const a = vectors[0];
  const b = vectors[1];
  const c = vectors[2];
  if (!a || !b || !c) return 0;
  return (
    a.x * (b.y * c.z - b.z * c.y) -
    a.y * (b.x * c.z - b.z * c.x) +
    a.z * (b.x * c.y - b.y * c.x)
  );
}

describe("coordinates and camera", () => {
  it("keeps the spec camera and axis ranges", () => {
    expect(CAMERA_X).toBe(0);
    expect(CAMERA_Y).toBe(0);
    expect(CAMERA_Z).toBe(15);
    expect(CAMERA_LOOK_X).toBe(0);
    expect(CAMERA_LOOK_Y).toBe(0);
    expect(CAMERA_LOOK_Z).toBe(0);
    expect(X_MIN).toBe(-2);
    expect(X_MAX).toBe(2);
    expect(Y_MIN).toBe(-2);
    expect(Y_MAX).toBe(2);
    expect(Z_MIN).toBe(0);
    expect(Z_MAX).toBe(9);
  });

  it("addresses every cell exactly once", () => {
    const seen = new Set<number>();
    for (let z = Z_MIN; z <= Z_MAX; z += 1) {
      for (let y = Y_MIN; y <= Y_MAX; y += 1) {
        for (let x = X_MIN; x <= X_MAX; x += 1) {
          seen.add(cellIndex(x, y, z));
        }
      }
    }
    expect(seen.size).toBe(PIT_CELL_COUNT);
    expect(cellIndex(X_MIN, Y_MIN, Z_MIN)).toBe(0);
    expect(cellIndex(X_MAX, Y_MAX, Z_MAX)).toBe(PIT_CELL_COUNT - 1);
  });

  it("widens the field of view when the frame gets narrower", () => {
    expect(cameraFovDegrees(0.5)).toBeGreaterThan(cameraFovDegrees(1));
    expect(cameraFovDegrees(1)).toBeGreaterThan(0);
  });
});

describe("pieces and rotation", () => {
  it("uses four distinct integer cells, flat in standard mode", () => {
    for (const kind of STANDARD_KINDS) {
      const cells = PIECE_SHAPES[kind];
      expect(new Set(sorted(cells)).size).toBe(cells.length);
      expect(cells.every((cell) => cell.z === 0)).toBe(true);
      expect(volume(cells)).toBe(0);
    }
  });

  it("keeps advanced pieces out of the standard set and off a single plane", () => {
    expect(STANDARD_KINDS).not.toContain("L3");
    expect(STANDARD_KINDS).not.toContain("Corner");
    expect(volume(PIECE_SHAPES.L3)).not.toBe(0);
    expect(volume(PIECE_SHAPES.Corner)).not.toBe(0);
  });

  it("returns to the original cells after four quarter turns on every axis", () => {
    const kinds: PieceKind[] = [...STANDARD_KINDS, ...ADVANCED_KINDS];
    for (const kind of kinds) {
      for (const axis of AXES) {
        let cells = PIECE_SHAPES[kind].map((cell) => ({ ...cell }));
        const start = sorted(cells);
        for (const cell of cells) {
          expect(Number.isInteger(cell.x)).toBe(true);
          expect(Number.isInteger(cell.y)).toBe(true);
          expect(Number.isInteger(cell.z)).toBe(true);
        }
        for (let turn = 0; turn < 4; turn += 1) {
          cells = cells.map((cell) => rotateOffset(cell, axis, 1));
        }
        expect(sorted(cells)).toEqual(start);
      }
    }
  });

  it("rolls clockwise and counterclockwise on opposite Z turns", () => {
    expect(rotateOffset({ x: 1, y: 0, z: 0 }, "z", -1)).toEqual({ x: 0, y: -1, z: 0 });
    expect(rotateOffset({ x: 1, y: 0, z: 0 }, "z", 1)).toEqual({ x: 0, y: 1, z: 0 });
  });

  it("cancels a rotation that leaves the well or hits a locked cell", () => {
    const grid = createEmptyGrid();
    const spawned = createPiece("I");
    expect(tryRotate(grid, spawned, "y", 1)).toBeNull();
    expect(spawned.cells).toEqual(PIECE_SHAPES.I.map((cell) => ({ ...cell })));

    const piece = createPiece("T", { x: 0, y: 0, z: 4 });
    const blocked = setCell(grid, 0, -1, 4, "#fff");
    expect(tryRotate(blocked, piece, "z", 1)).toBeNull();
    expect(piece.cells).toEqual(PIECE_SHAPES.T.map((cell) => ({ ...cell })));
  });

  it("spawns every kind in an empty well and fails when the entrance is occupied", () => {
    const empty = createEmptyGrid();
    for (const kind of [...STANDARD_KINDS, ...ADVANCED_KINDS]) {
      expect(canPlace(empty, worldCells(createPiece(kind)))).toBe(true);
    }

    let blocked = empty;
    for (const cell of worldCells(createPiece("I"))) {
      blocked = setCell(blocked, cell.x, cell.y, cell.z, "#fff");
    }
    expect(canPlace(blocked, worldCells(createPiece("I")))).toBe(false);
  });
});

describe("movement and layers", () => {
  it("refuses a move through the wall", () => {
    const piece = createPiece("O", { x: X_MAX - 1, y: 0, z: 4 });
    expect(tryTranslate(createEmptyGrid(), piece, 1, 0, 0)).toBeNull();
    expect(tryTranslate(createEmptyGrid(), piece, -1, 0, 0)?.pivot.x).toBe(X_MAX - 2);
  });

  it("leaves a 24-cell layer in place and removes only a full layer", () => {
    let grid = fillLayer(createEmptyGrid(), Z_MIN);
    grid = setCell(grid, X_MIN, Y_MIN, Z_MIN, null);
    expect(isLayerFull(grid, Z_MIN)).toBe(false);
    expect(fullLayers(grid)).toEqual([]);

    grid = setCell(grid, X_MIN, Y_MIN, Z_MIN, "#abc");
    expect(fullLayers(grid)).toEqual([Z_MIN]);
  });

  it("drops cells above a cleared middle layer without a gap", () => {
    let grid = createEmptyGrid();
    grid = setCell(grid, 0, 0, Z_MIN, "#low");
    grid = fillLayer(grid, Z_MIN + 1, "#full");
    grid = setCell(grid, 1, 1, Z_MIN + 3, "#high");

    const next = collapseLayers(grid, [Z_MIN + 1]);
    expect(getCell(next, 0, 0, Z_MIN)).toBe("#low");
    expect(getCell(next, 1, 1, Z_MIN + 2)).toBe("#high");
    expect(occupiedCells(next)).toHaveLength(2);
  });

  it("clears separated layers in one pass and stacks what remains", () => {
    let grid = fillLayer(createEmptyGrid(), Z_MIN, "#a");
    grid = setCell(grid, 0, 0, Z_MIN + 1, "#mid");
    grid = fillLayer(grid, Z_MIN + 2, "#b");
    grid = setCell(grid, 1, 0, Z_MIN + 3, "#top");

    const next = collapseLayers(grid, [Z_MIN, Z_MIN + 2]);
    expect(getCell(next, 0, 0, Z_MIN)).toBe("#mid");
    expect(getCell(next, 1, 0, Z_MIN + 1)).toBe("#top");
    expect(isGridEmpty(collapseLayers(fillLayer(createEmptyGrid(), Z_MIN), [Z_MIN]))).toBe(true);
  });
});

describe("score, speed, and bag", () => {
  it("scores N layers as 100 N squared and adds the empty-well bonus once", () => {
    expect(layerClearScore(1)).toBe(SCORE_LAYER_BASE);
    expect(clearReward(1, false)).toBe(100);
    expect(clearReward(2, false)).toBe(400);
    expect(clearReward(3, false)).toBe(900);
    expect(clearReward(4, false)).toBe(1600);
    expect(clearReward(1, true)).toBe(100 + SCORE_BLOCKOUT);
    expect(clearReward(0, true)).toBe(0);
    expect(SCORE_BLOCKOUT).toBe(2000);
  });

  it("starts at 800ms and steps down by 50ms every 10 layers, never under 200ms", () => {
    expect(gravityInterval(0)).toBe(INITIAL_TICK_MS);
    expect(gravityInterval(9)).toBe(INITIAL_TICK_MS);
    expect(gravityInterval(10)).toBe(INITIAL_TICK_MS - TICK_STEP_MS);
    expect(gravityInterval(20)).toBe(INITIAL_TICK_MS - TICK_STEP_MS * 2);
    expect(gravityInterval(10_000)).toBe(MIN_TICK_MS);
  });

  it("applies the slider base, then steps down by 50ms every 10 layers, never under 200ms", () => {
    expect(gravityInterval(0, SLOWEST_TICK_MS)).toBe(SLOWEST_TICK_MS);
    expect(gravityInterval(9, SLOWEST_TICK_MS)).toBe(SLOWEST_TICK_MS);
    expect(gravityInterval(10, SLOWEST_TICK_MS)).toBe(SLOWEST_TICK_MS - TICK_STEP_MS);
    expect(gravityInterval(20, SLOWEST_TICK_MS)).toBe(SLOWEST_TICK_MS - TICK_STEP_MS * 2);
    const mid = MIN_TICK_MS + TICK_STEP_MS * 6;
    expect(gravityInterval(0, mid)).toBe(mid);
    expect(gravityInterval(10, mid)).toBe(mid - TICK_STEP_MS);
    expect(gravityInterval(0, MIN_TICK_MS)).toBe(MIN_TICK_MS);
    expect(gravityInterval(10, MIN_TICK_MS)).toBe(MIN_TICK_MS);
    expect(gravityInterval(10_000, SLOWEST_TICK_MS)).toBe(MIN_TICK_MS);
    expect(SOFT_DROP_MS).toBeLessThan(MIN_TICK_MS);
  });

  it("deals each standard piece once per bag", () => {
    const rng = mulberry32(7);
    let bag: PieceKind[] = [];
    const first: PieceKind[] = [];
    for (let count = 0; count < STANDARD_KINDS.length; count += 1) {
      const pulled = pullKind(bag, "standard", rng);
      bag = pulled.bag;
      first.push(pulled.kind);
    }
    expect(new Set(first)).toEqual(new Set(STANDARD_KINDS));

    const second: PieceKind[] = [];
    for (let count = 0; count < STANDARD_KINDS.length; count += 1) {
      const pulled = pullKind(bag, "standard", rng);
      bag = pulled.bag;
      second.push(pulled.kind);
    }
    expect(new Set(second)).toEqual(new Set(STANDARD_KINDS));
    expect(shuffleBag(STANDARD_KINDS, rng)).toHaveLength(STANDARD_KINDS.length);
  });

  it("maps the spec keys onto four moves, three axes, and both drops", () => {
    expect(Object.values(MOVE_KEYS)).toEqual([
      [-1, 0],
      [1, 0],
      [0, 1],
      [0, -1],
    ]);
    expect(ROTATE_KEYS.KeyQ).toEqual(["z", -1]);
    expect(ROTATE_KEYS.KeyA).toEqual(["z", 1]);
    expect(ROTATE_KEYS.KeyW).toEqual(["x", -1]);
    expect(ROTATE_KEYS.KeyS).toEqual(["x", 1]);
    expect(ROTATE_KEYS.KeyE).toEqual(["y", -1]);
    expect(ROTATE_KEYS.KeyD).toEqual(["y", 1]);
    expect(SOFT_DROP_KEY).toBe("Space");
    expect(HARD_DROP_KEYS).toContain("Enter");
    expect(HARD_DROP_KEYS).toContain("ShiftLeft");
    expect(HARD_DROP_KEYS).toContain("ShiftRight");
  });
});

describe("layer color", () => {
  const palette = [
    "#1E3A8A",
    "#2563EB",
    "#0891B2",
    "#10B981",
    "#84CC16",
    "#FACC15",
    "#F97316",
    "#EF4444",
    "#EC4899",
    "#FFFFFF",
  ] as const;

  it("paints each depth with the floor-to-danger palette", () => {
    expect(palette).toHaveLength(Z_MAX - Z_MIN + 1);
    palette.forEach((hex, z) => {
      expect(layerColor(Z_MIN + z)).toBe(hex);
      expect(layerRgb(Z_MIN + z)).toEqual({
        r: Number.parseInt(hex.slice(1, 3), 16),
        g: Number.parseInt(hex.slice(3, 5), 16),
        b: Number.parseInt(hex.slice(5, 7), 16),
      });
    });
    expect(layerColor(Z_MIN)).toBe("#1E3A8A");
    expect(layerColor(Z_MAX)).toBe("#FFFFFF");
  });

  it("keeps neighboring layers on different colors", () => {
    for (let z = Z_MIN; z < Z_MAX; z += 1) {
      expect(layerColor(z)).not.toBe(layerColor(z + 1));
    }
  });

  it("counts a layer as full only at the layer size", () => {
    expect(LAYER_CELL_COUNT).toBe(25);
  });
});
