import type { Axis, RotationDirection } from "@/types/game";

export const MOVE_KEYS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/** Column pairs. Upper keys turn counterclockwise (−1); home-row keys turn clockwise (+1, right-hand). */
export const ROTATE_KEYS: Record<string, readonly [Axis, RotationDirection]> = {
  KeyQ: ["z", -1],
  KeyA: ["z", 1],
  KeyW: ["x", -1],
  KeyS: ["x", 1],
  KeyE: ["y", -1],
  KeyD: ["y", 1],
};

export const HARD_DROP_KEYS = ["Enter", "NumpadEnter", "ShiftLeft", "ShiftRight"] as const;

export const SCROLL_KEYS = [
  "Space",
  "Enter",
  "NumpadEnter",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
] as const;

export const SOFT_DROP_KEY = "Space";

export function isHardDropKey(code: string): boolean {
  return (HARD_DROP_KEYS as readonly string[]).includes(code);
}

export function isScrollKey(code: string): boolean {
  return (SCROLL_KEYS as readonly string[]).includes(code);
}

export function isPauseKey(code: string): boolean {
  return code === "KeyP" || code === "Escape";
}

/** Keys that move, rotate, or drop the piece. */
export function isPieceKey(code: string): boolean {
  return (
    Object.prototype.hasOwnProperty.call(MOVE_KEYS, code) ||
    Object.prototype.hasOwnProperty.call(ROTATE_KEYS, code) ||
    code === SOFT_DROP_KEY ||
    isHardDropKey(code)
  );
}
