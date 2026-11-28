export type GamePhase = "ready" | "playing" | "paused" | "gameover";

export type GameMode = "standard" | "advanced";

export type Axis = "x" | "y" | "z";

/** Positive is a right-handed quarter turn. Negative is the opposite quarter turn. */
export type RotationDirection = 1 | -1;

export type PieceKind =
  | "I"
  | "O"
  | "L"
  | "J"
  | "T"
  | "S"
  | "Z"
  | "L3"
  | "Corner";

export interface CellCoord {
  x: number;
  y: number;
  z: number;
}

export interface OccupiedCell extends CellCoord {
  color: string;
}

export interface ActivePiece {
  kind: PieceKind;
  color: string;
  pivot: CellCoord;
  cells: CellCoord[];
}

/** Flat occupancy. Null is empty. Index order is defined by the grid module. */
export type Grid = (string | null)[];
