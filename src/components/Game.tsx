"use client";

import { GameCanvas } from "@/components/GameCanvas";
import { Hud } from "@/components/Hud";
import { PhaseOverlay } from "@/components/PhaseOverlay";
import { useGameInput } from "@/components/useGameInput";
import { useGameLoop } from "@/components/useGameLoop";

export default function Game() {
  useGameInput();
  useGameLoop();

  return (
    <main
      tabIndex={-1}
      className="flex h-dvh flex-col overflow-hidden bg-[#07080f] text-[#e7e2d8] outline-none lg:flex-row"
    >
      <section className="relative min-h-0 flex-1" aria-label="우물">
        <div className="absolute inset-0">
          <GameCanvas />
        </div>
        <PhaseOverlay />
      </section>
      <Hud />
    </main>
  );
}
