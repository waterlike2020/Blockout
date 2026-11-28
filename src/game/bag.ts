import { ADVANCED_KINDS, STANDARD_KINDS } from "@/game/pieces";
import type { GameMode, PieceKind } from "@/types/game";

export function kindsForMode(mode: GameMode): PieceKind[] {
  if (mode === "advanced") return [...STANDARD_KINDS, ...ADVANCED_KINDS];
  return [...STANDARD_KINDS];
}

export function shuffleBag(kinds: readonly PieceKind[], rng: () => number): PieceKind[] {
  const next = kinds.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.floor(rng() * (index + 1)));
    const current = next[index];
    const swapped = next[swapIndex];
    if (current === undefined || swapped === undefined) continue;
    next[index] = swapped;
    next[swapIndex] = current;
  }
  return next;
}

export function pullKind(
  bag: readonly PieceKind[],
  mode: GameMode,
  rng: () => number,
): { kind: PieceKind; bag: PieceKind[] } {
  const source = bag.length > 0 ? bag.slice() : shuffleBag(kindsForMode(mode), rng);
  const kind = source[0];
  if (kind === undefined) {
    throw new Error("Piece bag was empty.");
  }
  return { kind, bag: source.slice(1) };
}
