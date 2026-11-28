"use client";

import dynamic from "next/dynamic";

const Game = dynamic(() => import("@/components/Game"), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-dvh place-items-center bg-[#07080f] text-[#e7e2d8]">
      우물을 준비하고 있습니다
    </main>
  ),
});

export function GameRoot() {
  return <Game />;
}
