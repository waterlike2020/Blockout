"use client";

import { useRef, type PointerEvent } from "react";
import { NextPreview } from "@/components/NextPreview";
import { panelButton, primaryButton } from "@/components/styles";
import { isPieceKey } from "@/game/controls";
import { MIN_TICK_MS, SLOWEST_TICK_MS, TICK_STEP_MS } from "@/game/constants";
import { gravityInterval } from "@/game/scoring";
import { useGameStore } from "@/store/gameStore";
import type { GamePhase } from "@/types/game";

const PHASE_LABEL: Record<GamePhase, string> = {
  ready: "준비",
  playing: "플레이",
  paused: "일시정지",
  gameover: "게임 오버",
};

export function Hud() {
  const phase = useGameStore((state) => state.phase);
  const mode = useGameStore((state) => state.mode);
  const score = useGameStore((state) => state.score);
  const linesCleared = useGameStore((state) => state.linesCleared);
  const nextKind = useGameStore((state) => state.nextKind);
  const start = useGameStore((state) => state.start);
  const restart = useGameStore((state) => state.restart);
  const togglePause = useGameStore((state) => state.togglePause);
  const setMode = useGameStore((state) => state.setMode);
  const baseTickMs = useGameStore((state) => state.baseTickMs);
  const setBaseTickMs = useGameStore((state) => state.setBaseTickMs);
  const effectiveMs = gravityInterval(linesCleared, baseTickMs);
  const speedSteps = (SLOWEST_TICK_MS - MIN_TICK_MS) / TICK_STEP_MS;
  const speedValue = (SLOWEST_TICK_MS - baseTickMs) / TICK_STEP_MS;
  const pointerTuning = useRef(false);

  const releaseSlider = (event: PointerEvent<HTMLInputElement>) => {
    const slider = event.currentTarget;
    const restore = () => {
      if (document.activeElement === slider) slider.blur();
      const main = document.querySelector("main");
      if (main instanceof HTMLElement && document.activeElement !== main) {
        main.focus({ preventScroll: true });
      }
    };
    // The click that follows pointerup focuses the range again. Restore
    // the playfield after that default action, or arrows stay on the slider.
    restore();
    window.setTimeout(() => {
      pointerTuning.current = false;
      restore();
    }, 0);
  };

  return (
    <aside className="flex max-h-[42dvh] w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/10 bg-[#10131a] px-4 py-4 lg:h-dvh lg:max-h-none lg:w-[320px] lg:border-t-0 lg:border-l lg:px-5">
      <div>
        <p className="text-xs tracking-[0.22em] text-[#9aa3b5] uppercase">3D Tetris</p>
        <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#f3efe6]">BlockOut</h1>
        <p className="mt-1 text-sm text-[#9aa3b5]">{PHASE_LABEL[phase]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#9aa3b5]">점수</p>
          <p className="font-mono text-3xl tabular-nums text-[#ffb15a]">
            {score.toLocaleString("ko-KR")}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#9aa3b5]">지운 층</p>
          <p className="font-mono text-3xl tabular-nums text-[#f3efe6]">
            {linesCleared.toLocaleString("ko-KR")}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-[#9aa3b5]">다음</p>
        <NextPreview kind={nextKind} />
      </div>

      <div>
        <p className="mb-2 text-xs text-[#9aa3b5]">모드</p>
        {phase === "ready" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className={mode === "standard" ? primaryButton : panelButton}
              aria-pressed={mode === "standard"}
              onClick={() => setMode("standard")}
            >
              표준
            </button>
            <button
              type="button"
              className={mode === "advanced" ? primaryButton : panelButton}
              aria-pressed={mode === "advanced"}
              onClick={() => setMode("advanced")}
            >
              고급
            </button>
          </div>
        ) : (
          <p className="text-sm text-[#f3efe6]">{mode === "standard" ? "표준" : "고급"}</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor="fall-speed" className="text-xs text-[#9aa3b5]">
            낙하 속도
          </label>
          <span className="font-mono text-sm tabular-nums text-[#f3efe6]">{effectiveMs}ms</span>
        </div>
        <input
          id="fall-speed"
          type="range"
          min={0}
          max={speedSteps}
          step={1}
          value={speedValue}
          aria-valuetext={`${effectiveMs}ms`}
          className="w-full cursor-pointer accent-[#ffb15a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb15a]"
          onPointerDown={() => {
            pointerTuning.current = true;
          }}
          onKeyDown={(event) => {
            // If a game key reaches this focused range during play, cancel
            // the browser's default step before it rewrites the fall speed.
            if (phase !== "playing" || !isPieceKey(event.code)) return;
            event.preventDefault();
          }}
          onChange={(event) => {
            if (phase === "playing" && !pointerTuning.current) {
              event.currentTarget.value = String(speedValue);
              return;
            }
            setBaseTickMs(SLOWEST_TICK_MS - Number(event.target.value) * TICK_STEP_MS);
          }}
          onPointerUp={releaseSlider}
          onPointerCancel={releaseSlider}
        />
        <div className="mt-1 flex justify-between text-xs text-[#9aa3b5]">
          <span>느림</span>
          <span>빠름</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {phase === "ready" ? (
          <button type="button" className={primaryButton} onClick={start}>
            시작
          </button>
        ) : null}
        {phase === "playing" ? (
          <button type="button" className={panelButton} onClick={togglePause}>
            일시정지
          </button>
        ) : null}
        {phase === "paused" ? (
          <button type="button" className={primaryButton} onClick={togglePause}>
            이어서 하기
          </button>
        ) : null}
        {phase !== "ready" ? (
          <button type="button" className={panelButton} onClick={restart}>
            다시 하기
          </button>
        ) : null}
      </div>

      <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 text-sm text-[#c9c3b6]">
        <dt>이동</dt>
        <dd className="font-mono text-[#f3efe6]">← ↑ → ↓</dd>
        <dt className="col-span-2">회전</dt>
        <dd className="col-span-2 text-[#f3efe6]">
          Q/A는 Z축 반시계·시계, W/S는 X축 반시계·시계, E/D는 Y축 반시계·시계.
        </dd>
        <dt>소프트 드롭</dt>
        <dd className="font-mono text-[#f3efe6]">Space</dd>
        <dt>하드 드롭</dt>
        <dd className="font-mono text-[#f3efe6]">Enter / Shift</dd>
        <dt>일시정지</dt>
        <dd className="font-mono text-[#f3efe6]">P / Esc</dd>
      </dl>
    </aside>
  );
}
