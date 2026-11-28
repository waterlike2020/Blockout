"use client";

import { useEffect } from "react";
import { CLEAR_FLASH_MS, SOFT_DROP_MS } from "@/game/constants";
import { gravityInterval } from "@/game/scoring";
import { useGameStore } from "@/store/gameStore";

export function useGameLoop() {
  const phase = useGameStore((state) => state.phase);
  const softDropping = useGameStore((state) => state.softDropping);
  const linesCleared = useGameStore((state) => state.linesCleared);
  const clearing = useGameStore((state) => state.clearingLayers.length > 0);
  const baseTickMs = useGameStore((state) => state.baseTickMs);
  // Numeric pace only. A sideways move or a rotation updates the active
  // piece and must not appear here — restarting this wait would drop the
  // piece sooner or later than the speed the player chose.
  const fallMs =
    phase === "playing" && !clearing
      ? softDropping
        ? SOFT_DROP_MS
        : gravityInterval(linesCleared, baseTickMs)
      : 0;

  useEffect(() => {
    if (fallMs === 0) return;
    const id = window.setInterval(() => {
      useGameStore.getState().tick();
    }, fallMs);
    return () => window.clearInterval(id);
  }, [fallMs]);

  useEffect(() => {
    if (!clearing) return;
    if (phase !== "playing" && phase !== "paused") return;
    const id = window.setTimeout(() => {
      useGameStore.getState().completeClear();
    }, CLEAR_FLASH_MS);
    return () => window.clearTimeout(id);
  }, [phase, clearing]);
}
