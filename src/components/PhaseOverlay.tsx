"use client";

import { panelButton, primaryButton } from "@/components/styles";
import { useGameStore } from "@/store/gameStore";

export function PhaseOverlay() {
  const phase = useGameStore((state) => state.phase);
  const score = useGameStore((state) => state.score);
  const start = useGameStore((state) => state.start);
  const restart = useGameStore((state) => state.restart);
  const togglePause = useGameStore((state) => state.togglePause);

  if (phase === "playing") return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-5">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#10131a]/92 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-md">
        {phase === "ready" ? (
          <>
            <h2 className="text-xl font-semibold text-[#f3efe6]">우물 앞에서</h2>
            <p className="mt-1 text-sm leading-6 text-[#c9c3b6]">
              빈 우물이 보입니다. 시작을 누르면 첫 조각이 입구에서 떨어집니다.
            </p>
            <button type="button" className={`${primaryButton} mt-4`} onClick={start}>
              시작
            </button>
          </>
        ) : null}
        {phase === "paused" ? (
          <>
            <h2 className="text-xl font-semibold text-[#f3efe6]">일시정지</h2>
            <p className="mt-1 text-sm text-[#c9c3b6]">조각과 점수는 그대로 멈춰 있습니다.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className={primaryButton} onClick={togglePause}>
                이어서 하기
              </button>
              <button type="button" className={panelButton} onClick={restart}>
                다시 하기
              </button>
            </div>
          </>
        ) : null}
        {phase === "gameover" ? (
          <>
            <h2 className="text-xl font-semibold text-[#f3efe6]">게임 오버</h2>
            <p className="mt-1 text-sm text-[#c9c3b6]">
              최종 점수 {score.toLocaleString("ko-KR")}
            </p>
            <button type="button" className={`${primaryButton} mt-4`} onClick={restart}>
              다시 하기
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
