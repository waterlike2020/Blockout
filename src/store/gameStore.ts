import { create } from "zustand";
import { pullKind } from "@/game/bag";
import { collapseLayers, createEmptyGrid, fullLayers, isGridEmpty } from "@/game/board";
import { canPlace, dropDistance, lockPiece, tryRotate, tryTranslate } from "@/game/collision";
import { INITIAL_TICK_MS, MIN_TICK_MS, SLOWEST_TICK_MS, TICK_STEP_MS } from "@/game/constants";
import { createPiece, worldCells } from "@/game/pieces";
import { clearReward, dropScore } from "@/game/scoring";
import type {
  ActivePiece,
  Axis,
  GameMode,
  GamePhase,
  Grid,
  PieceKind,
  RotationDirection,
} from "@/types/game";

export interface GameData {
  phase: GamePhase;
  mode: GameMode;
  grid: Grid;
  active: ActivePiece | null;
  nextKind: PieceKind;
  bag: PieceKind[];
  score: number;
  linesCleared: number;
  softDropping: boolean;
  clearingLayers: number[];
  baseTickMs: number;
}

interface GameActions {
  start: () => void;
  restart: () => void;
  togglePause: () => void;
  setMode: (mode: GameMode) => void;
  setBaseTickMs: (baseTickMs: number) => void;
  move: (dx: number, dy: number) => void;
  rotate: (axis: Axis, direction: RotationDirection) => void;
  setSoftDrop: (held: boolean) => void;
  hardDrop: () => void;
  tick: () => void;
  completeClear: () => void;
}

export type GameStore = GameData & GameActions;

let rng: () => number = Math.random;
let resolving = false;

export function setGameRng(next: () => number): void {
  rng = next;
}

function fresh(mode: GameMode, baseTickMs = INITIAL_TICK_MS): GameData {
  const pulled = pullKind([], mode, rng);
  return {
    phase: "ready",
    mode,
    grid: createEmptyGrid(),
    active: null,
    nextKind: pulled.kind,
    bag: pulled.bag,
    score: 0,
    linesCleared: 0,
    softDropping: false,
    clearingLayers: [],
    baseTickMs,
  };
}

function controllable(state: GameData): state is GameData & { active: ActivePiece } {
  return state.phase === "playing" && state.clearingLayers.length === 0 && state.active !== null;
}

export const useGameStore = create<GameStore>((set, get) => {
  const placeNext = (
    grid: Grid,
    score: number,
    linesCleared: number,
    bag: PieceKind[],
    nextKind: PieceKind,
    mode: GameMode,
    phase: "playing" | "paused",
  ) => {
    const piece = createPiece(nextKind);
    const pulled = pullKind(bag, mode, rng);
    if (!canPlace(grid, worldCells(piece))) {
      set({
        grid,
        score,
        linesCleared,
        active: null,
        phase: "gameover",
        clearingLayers: [],
        nextKind: pulled.kind,
        bag: pulled.bag,
        softDropping: false,
      });
      return;
    }

    set({
      grid,
      score,
      linesCleared,
      active: piece,
      phase,
      clearingLayers: [],
      nextKind: pulled.kind,
      bag: pulled.bag,
    });
  };

  const settle = (
    grid: Grid,
    piece: ActivePiece,
    score: number,
    linesCleared: number,
    bag: PieceKind[],
    nextKind: PieceKind,
    mode: GameMode,
  ) => {
    const locked = lockPiece(grid, piece);
    if (locked.aboveCeiling) {
      set({
        grid: locked.grid,
        active: null,
        score,
        phase: "gameover",
        clearingLayers: [],
        softDropping: false,
      });
      return;
    }

    const layers = fullLayers(locked.grid);
    if (layers.length === 0) {
      placeNext(locked.grid, score, linesCleared, bag, nextKind, mode, "playing");
      return;
    }

    set({
      grid: locked.grid,
      active: null,
      score,
      clearingLayers: layers,
    });
  };

  const withResolve = (run: () => void) => {
    if (resolving) return;
    resolving = true;
    try {
      run();
    } finally {
      resolving = false;
    }
  };

  return {
    ...fresh("standard"),

    start: () => {
      const state = get();
      if (state.phase !== "ready") return;
      placeNext(
        state.grid,
        state.score,
        state.linesCleared,
        state.bag,
        state.nextKind,
        state.mode,
        "playing",
      );
    },

    restart: () => {
      set(fresh(get().mode, get().baseTickMs));
    },

    togglePause: () => {
      const phase = get().phase;
      if (phase === "playing") set({ phase: "paused", softDropping: false });
      else if (phase === "paused") set({ phase: "playing" });
    },

    setMode: (mode) => {
      const state = get();
      if (state.phase !== "ready" || state.mode === mode) return;
      set(fresh(mode, state.baseTickMs));
    },

    setBaseTickMs: (baseTickMs) => {
      if (!Number.isFinite(baseTickMs)) return;
      const snapped = Math.round(baseTickMs / TICK_STEP_MS) * TICK_STEP_MS;
      const clamped = Math.min(SLOWEST_TICK_MS, Math.max(MIN_TICK_MS, snapped));
      if (get().baseTickMs === clamped) return;
      set({ baseTickMs: clamped });
    },

    move: (dx, dy) => {
      const state = get();
      if (!controllable(state)) return;
      const next = tryTranslate(state.grid, state.active, dx, dy, 0);
      if (next) set({ active: next });
    },

    rotate: (axis, direction) => {
      const state = get();
      if (!controllable(state)) return;
      const next = tryRotate(state.grid, state.active, axis, direction);
      if (next) set({ active: next });
    },

    setSoftDrop: (held) => {
      if (!held) {
        set({ softDropping: false });
        return;
      }
      if (get().phase !== "playing") return;
      set({ softDropping: true });
    },

    hardDrop: () => {
      withResolve(() => {
        const state = get();
        if (!controllable(state)) return;
        const dropped = dropDistance(state.grid, state.active);
        settle(
          state.grid,
          dropped.piece,
          state.score + dropScore(dropped.distance),
          state.linesCleared,
          state.bag,
          state.nextKind,
          state.mode,
        );
      });
    },

    tick: () => {
      withResolve(() => {
        const state = get();
        if (!controllable(state)) return;
        const next = tryTranslate(state.grid, state.active, 0, 0, -1);
        if (next) {
          set({ active: next, score: state.score + dropScore(1) });
          return;
        }
        settle(
          state.grid,
          state.active,
          state.score,
          state.linesCleared,
          state.bag,
          state.nextKind,
          state.mode,
        );
      });
    },

    completeClear: () => {
      withResolve(() => {
        const state = get();
        if (state.clearingLayers.length === 0) return;
        if (state.phase !== "playing" && state.phase !== "paused") return;
        const grid = collapseLayers(state.grid, state.clearingLayers);
        const reward = clearReward(state.clearingLayers.length, isGridEmpty(grid));
        const phase = state.phase === "paused" ? "paused" : "playing";
        placeNext(
          grid,
          state.score + reward,
          state.linesCleared + state.clearingLayers.length,
          state.bag,
          state.nextKind,
          state.mode,
          phase,
        );
      });
    },
  };
});
