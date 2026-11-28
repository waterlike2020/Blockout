import {
  INITIAL_TICK_MS,
  LAYERS_PER_SPEED_STEP,
  MIN_TICK_MS,
  SCORE_BLOCKOUT,
  SCORE_LAYER_BASE,
  SCORE_PER_CELL,
  TICK_STEP_MS,
} from "@/game/constants";

/** Effective fall interval. The chosen base steps down 50ms every 10 layers, never under 200ms. */
export function gravityInterval(linesCleared: number, baseTickMs = INITIAL_TICK_MS): number {
  const steps = Math.floor(linesCleared / LAYERS_PER_SPEED_STEP);
  return Math.max(MIN_TICK_MS, baseTickMs - steps * TICK_STEP_MS);
}

export function dropScore(distance: number): number {
  return distance * SCORE_PER_CELL;
}

export function layerClearScore(layerCount: number): number {
  return SCORE_LAYER_BASE * layerCount * layerCount;
}

/** Layer reward is only 100 * N^2. A single layer is not scored a second time. */
export function clearReward(layerCount: number, emptied: boolean): number {
  if (layerCount <= 0) return 0;
  const lines = layerClearScore(layerCount);
  return emptied ? lines + SCORE_BLOCKOUT : lines;
}
