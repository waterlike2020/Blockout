"use client";

import { useEffect } from "react";
import {
  isHardDropKey,
  isPauseKey,
  isPieceKey,
  isScrollKey,
  MOVE_KEYS,
  ROTATE_KEYS,
  SOFT_DROP_KEY,
} from "@/game/controls";
import { KEY_REPEAT_DELAY_MS, KEY_REPEAT_INTERVAL_MS } from "@/game/constants";
import { useGameStore } from "@/store/gameStore";

type Repeat = { timeout: number; interval?: number };

function focusPlayfield(): void {
  const main = document.querySelector("main");
  if (!(main instanceof HTMLElement)) return;
  if (document.activeElement === main) return;
  main.focus({ preventScroll: true });
}

function rememberPlayingFocus(): void {
  window.setTimeout(focusPlayfield, 0);
  window.requestAnimationFrame(focusPlayfield);
}

function sliderOwnsGameKey(event: KeyboardEvent): boolean {
  const active = document.activeElement;
  // Only a connected, focused range may take these keys, and the caller
  // consults this only while a round is not being played. During play the
  // piece swallows them first so a range cannot step its value.
  if (!(active instanceof HTMLInputElement) || !active.isConnected) return false;
  if (active.type !== "range" || event.target !== active) return false;
  return (
    Object.prototype.hasOwnProperty.call(MOVE_KEYS, event.code) ||
    Object.prototype.hasOwnProperty.call(ROTATE_KEYS, event.code)
  );
}

export function useGameInput() {
  useEffect(() => {
    const repeats = new Map<string, Repeat>();

    const clearCode = (code: string) => {
      const repeat = repeats.get(code);
      if (!repeat) return;
      window.clearTimeout(repeat.timeout);
      if (repeat.interval !== undefined) window.clearInterval(repeat.interval);
      repeats.delete(code);
    };

    const clearAll = () => {
      for (const code of [...repeats.keys()]) clearCode(code);
    };

    let phase = useGameStore.getState().phase;
    const unsubscribe = useGameStore.subscribe((state) => {
      if (phase === "playing" && state.phase !== "playing") clearAll();
      if (phase !== "playing" && state.phase === "playing") rememberPlayingFocus();
      phase = state.phase;
    });

    const swallow = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // After Start, focus belongs to the playfield, including when the
      // previous key target was a button that has since unmounted.
      if (!document.activeElement?.isConnected) focusPlayfield();

      const state = useGameStore.getState();
      const playing = state.phase === "playing";
      // Capture the keys before a focused range input can apply its
      // default action. Arrow keys would step the fall-speed slider.
      if (playing && isPieceKey(event.code)) {
        swallow(event);
        const active = document.activeElement;
        if (active instanceof HTMLInputElement && active.type === "range") focusPlayfield();
      } else if (sliderOwnsGameKey(event)) {
        return;
      }

      const blockScroll =
        state.phase === "playing" || state.phase === "paused" || state.phase === "gameover";

      if (isPauseKey(event.code)) {
        if (blockScroll) swallow(event);
        if (!event.repeat && (state.phase === "playing" || state.phase === "paused")) {
          state.togglePause();
        }
        return;
      }

      if (state.phase !== "playing") {
        if (blockScroll && isScrollKey(event.code)) swallow(event);
        return;
      }

      if (event.code === SOFT_DROP_KEY) {
        swallow(event);
        if (!event.repeat) {
          state.setSoftDrop(true);
          useGameStore.getState().tick();
        }
        return;
      }

      if (isHardDropKey(event.code)) {
        swallow(event);
        if (!event.repeat) state.hardDrop();
        return;
      }

      const rotation = ROTATE_KEYS[event.code];
      if (rotation) {
        swallow(event);
        if (!event.repeat) state.rotate(rotation[0], rotation[1]);
        return;
      }

      const move = MOVE_KEYS[event.code];
      if (!move) return;
      swallow(event);
      if (event.repeat || repeats.has(event.code)) return;
      state.move(move[0], move[1]);
      const timeout = window.setTimeout(() => {
        const interval = window.setInterval(() => {
          const live = useGameStore.getState();
          if (live.phase !== "playing" || live.clearingLayers.length > 0) return;
          live.move(move[0], move[1]);
        }, KEY_REPEAT_INTERVAL_MS);
        const current = repeats.get(event.code);
        if (!current) {
          window.clearInterval(interval);
          return;
        }
        current.interval = interval;
      }, KEY_REPEAT_DELAY_MS);
      repeats.set(event.code, { timeout });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === SOFT_DROP_KEY) useGameStore.getState().setSoftDrop(false);
      clearCode(event.code);
    };

    const release = () => {
      clearAll();
      const state = useGameStore.getState();
      state.setSoftDrop(false);
      if (state.phase === "playing") state.togglePause();
    };

    const onVisibility = () => {
      if (document.hidden) release();
    };

    // A mouse click must not leave focus on a button. Start unmounts that
    // button, and the browser then moves focus to the next control — the
    // fall-speed slider — so later arrows and rotation keys never reach
    // the piece. Pointer use of the slider still keeps those keys.
    let pointerOnSlider = false;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      pointerOnSlider =
        target instanceof Element && target.closest("input[type='range']") !== null;
    };

    const onPointerUp = () => {
      window.setTimeout(() => {
        pointerOnSlider = false;
      }, 0);
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("button")) return;
      event.preventDefault();
      focusPlayfield();
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      // Removing Start sends focus to the next control with no relatedTarget.
      // That control is the speed slider, which would then swallow movement.
      if (!(target instanceof HTMLInputElement) || target.type !== "range") return;
      if (pointerOnSlider) return;
      if (event.relatedTarget instanceof Element) return;
      focusPlayfield();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("pointercancel", onPointerUp, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    if (phase === "playing") rememberPlayingFocus();

    return () => {
      clearAll();
      unsubscribe();
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("pointercancel", onPointerUp, true);
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
    };
  }, []);
}
