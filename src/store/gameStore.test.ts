import { beforeEach, describe, expect, it } from "vitest";
import { occupiedCells, setCell } from "@/game/board";
import { dropDistance } from "@/game/collision";
import {
  INITIAL_TICK_MS,
  MIN_TICK_MS,
  SLOWEST_TICK_MS,
  SPAWN_X,
  SPAWN_Y,
  SPAWN_Z,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  Z_MIN,
} from "@/game/constants";
import { createPiece, worldCells } from "@/game/pieces";
import { clearReward, dropScore } from "@/game/scoring";
import type { Grid } from "@/types/game";
import { useGameStore } from "@/store/gameStore";

function fillLayerForTest(grid: Grid, z: number, color: string): Grid {
  let next = grid;
  for (let y = Y_MIN; y <= Y_MAX; y += 1) {
    for (let x = X_MIN; x <= X_MAX; x += 1) {
      next = setCell(next, x, y, z, color);
    }
  }
  return next;
}

function dealtKinds(): string[] {
  const state = useGameStore.getState();
  return [state.nextKind, ...state.bag];
}

describe("game store", () => {
  beforeEach(() => {
    useGameStore.getState().setBaseTickMs(INITIAL_TICK_MS);
    useGameStore.getState().restart();
    useGameStore.getState().setMode("standard");
  });

  it("does not drop a piece until the round starts", () => {
    expect(useGameStore.getState().phase).toBe("ready");
    expect(useGameStore.getState().active).toBeNull();
    useGameStore.getState().tick();
    expect(useGameStore.getState().score).toBe(0);
    useGameStore.getState().start();
    expect(useGameStore.getState().phase).toBe("playing");
    expect(useGameStore.getState().active?.pivot.z).toBe(SPAWN_Z);
  });

  it("deals a fresh 7-bag in standard mode and a 9-bag in advanced mode", () => {
    const standard = dealtKinds();
    expect(new Set(standard).size).toBe(standard.length);
    expect(standard).toHaveLength(7);
    expect(standard).not.toContain("L3");
    expect(standard).not.toContain("Corner");

    useGameStore.getState().setMode("advanced");
    const advanced = dealtKinds();
    expect(new Set(advanced).size).toBe(advanced.length);
    expect(advanced).toHaveLength(9);
    expect(advanced).toContain("L3");
    expect(advanced).toContain("Corner");
  });

  it("ignores mode changes, movement, and ticks while paused or after start", () => {
    useGameStore.getState().start();
    const mode = useGameStore.getState().mode;
    useGameStore.getState().setMode("advanced");
    expect(useGameStore.getState().mode).toBe(mode);

    useGameStore.getState().togglePause();
    const paused = useGameStore.getState().active;
    useGameStore.getState().tick();
    useGameStore.getState().hardDrop();
    useGameStore.getState().move(1, 0);
    useGameStore.getState().rotate("z", 1);
    expect(useGameStore.getState().active).toEqual(paused);
    expect(useGameStore.getState().score).toBe(0);
  });

  it("scores one point for a single step and locks on the next blocked tick", () => {
    useGameStore.setState({
      phase: "playing",
      active: createPiece("O", { x: SPAWN_X, y: SPAWN_Y, z: Z_MIN + 1 }),
      grid: useGameStore.getState().grid,
      clearingLayers: [],
      score: 0,
    });
    useGameStore.getState().tick();
    expect(useGameStore.getState().active?.pivot.z).toBe(Z_MIN);
    expect(useGameStore.getState().score).toBe(dropScore(1));

    useGameStore.getState().tick();
    expect(occupiedCells(useGameStore.getState().grid)).toHaveLength(4);
    expect(useGameStore.getState().score).toBe(dropScore(1));
    expect(useGameStore.getState().active?.pivot.z).toBe(SPAWN_Z);
  });

  it("awards a hard drop once, then the empty-well bonus once", () => {
    let grid = fillLayerForTest(useGameStore.getState().grid, Z_MIN, "#777");
    const landing = createPiece("O", { x: SPAWN_X, y: SPAWN_Y, z: Z_MIN });
    for (const cell of worldCells(landing)) {
      grid = setCell(grid, cell.x, cell.y, cell.z, null);
    }
    const active = createPiece("O");
    const dropped = dropDistance(grid, active);

    useGameStore.setState({
      phase: "playing",
      mode: "standard",
      grid,
      active,
      nextKind: "I",
      bag: ["T", "L", "J", "S", "Z", "O"],
      score: 0,
      linesCleared: 0,
      softDropping: false,
      clearingLayers: [],
    });

    useGameStore.getState().hardDrop();
    expect(useGameStore.getState().score).toBe(dropScore(dropped.distance));
    expect(useGameStore.getState().clearingLayers).toEqual([Z_MIN]);
    useGameStore.getState().hardDrop();
    expect(useGameStore.getState().score).toBe(dropScore(dropped.distance));

    useGameStore.getState().completeClear();
    const cleared = dropScore(dropped.distance) + clearReward(1, true);
    expect(useGameStore.getState().score).toBe(cleared);
    expect(useGameStore.getState().linesCleared).toBe(1);
    expect(useGameStore.getState().phase).toBe("playing");
    useGameStore.getState().completeClear();
    expect(useGameStore.getState().score).toBe(cleared);

    useGameStore.getState().hardDrop();
    expect(useGameStore.getState().score).toBe(cleared + dropScore(dropped.distance));
    expect(useGameStore.getState().linesCleared).toBe(1);
    expect(occupiedCells(useGameStore.getState().grid)).toHaveLength(4);
    expect(useGameStore.getState().active?.pivot.z).toBe(SPAWN_Z);
  });

  it("scores two layers as 400 and does not add a separate single-layer bonus", () => {
    let grid = fillLayerForTest(useGameStore.getState().grid, Z_MIN, "#a");
    grid = fillLayerForTest(grid, Z_MIN + 1, "#b");
    const active = createPiece("O");
    const dropped = dropDistance(grid, active);

    useGameStore.setState({
      phase: "playing",
      grid,
      active,
      nextKind: "I",
      bag: ["T"],
      score: 0,
      linesCleared: 0,
      clearingLayers: [],
      softDropping: false,
    });

    useGameStore.getState().hardDrop();
    useGameStore.getState().completeClear();
    expect(useGameStore.getState().linesCleared).toBe(2);
    expect(useGameStore.getState().score).toBe(dropScore(dropped.distance) + clearReward(2, false));
    expect(useGameStore.getState().score).not.toBe(dropScore(dropped.distance) + clearReward(2, false) + 100);
  });

  it("ends the round when the entrance is blocked and restarts empty", () => {
    let grid = useGameStore.getState().grid;
    for (const cell of worldCells(createPiece("I"))) {
      grid = setCell(grid, cell.x, cell.y, cell.z, "#fff");
    }
    useGameStore.setState({
      phase: "ready",
      grid,
      nextKind: "I",
      score: 40,
      linesCleared: 4,
      active: null,
      clearingLayers: [],
    });
    useGameStore.getState().start();
    expect(useGameStore.getState().phase).toBe("gameover");
    expect(useGameStore.getState().active).toBeNull();

    useGameStore.getState().restart();
    expect(useGameStore.getState().phase).toBe("ready");
    expect(useGameStore.getState().score).toBe(0);
    expect(useGameStore.getState().linesCleared).toBe(0);
    expect(occupiedCells(useGameStore.getState().grid)).toHaveLength(0);
  });

  it("cancels a yaw that would stick out of the entrance", () => {
    const piece = createPiece("I");
    useGameStore.setState({
      phase: "playing",
      active: piece,
      grid: useGameStore.getState().grid,
      clearingLayers: [],
    });
    useGameStore.getState().rotate("y", 1);
    expect(useGameStore.getState().active?.cells).toEqual(piece.cells);
  });

  it("stops at the side wall", () => {
    useGameStore.setState({
      phase: "playing",
      active: createPiece("O", { x: X_MAX - 1, y: Y_MIN, z: 4 }),
      grid: useGameStore.getState().grid,
      clearingLayers: [],
    });
    useGameStore.getState().move(1, 0);
    expect(useGameStore.getState().active?.pivot.x).toBe(X_MAX - 1);
    useGameStore.getState().move(0, -1);
    expect(useGameStore.getState().active?.pivot.y).toBe(Y_MIN);
  });

  it("keeps the fall interval when the piece moves or rotates", () => {
    useGameStore.getState().start();
    useGameStore.getState().setBaseTickMs(SLOWEST_TICK_MS);
    const before = useGameStore.getState();

    useGameStore.getState().move(-1, 0);
    useGameStore.getState().move(0, 1);
    useGameStore.getState().rotate("z", -1);
    useGameStore.getState().rotate("x", 1);
    useGameStore.getState().rotate("y", -1);

    const after = useGameStore.getState();
    expect(after.baseTickMs).toBe(before.baseTickMs);
    expect(after.linesCleared).toBe(before.linesCleared);
    expect(after.phase).toBe("playing");
    expect(after.score).toBe(before.score);
  });

  it("stores the fall base without resetting the piece, score, or grid", () => {
    expect(useGameStore.getState().baseTickMs).toBe(INITIAL_TICK_MS);
    useGameStore.getState().start();
    const before = useGameStore.getState();

    useGameStore.getState().setBaseTickMs(SLOWEST_TICK_MS);
    const slowed = useGameStore.getState();
    expect(slowed.baseTickMs).toBe(SLOWEST_TICK_MS);
    expect(slowed.active).toBe(before.active);
    expect(slowed.score).toBe(before.score);
    expect(slowed.grid).toBe(before.grid);
    expect(slowed.linesCleared).toBe(before.linesCleared);
    expect(slowed.phase).toBe("playing");

    useGameStore.getState().setBaseTickMs(MIN_TICK_MS);
    expect(useGameStore.getState().baseTickMs).toBe(MIN_TICK_MS);
    expect(useGameStore.getState().active).toBe(before.active);
    expect(useGameStore.getState().score).toBe(before.score);
  });
});
