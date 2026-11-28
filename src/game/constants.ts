/**
 * X and Y are the opening plane. Z is depth: 0 is the floor, 9 is the entrance.
 * Gravity decreases Z. Do not remap this onto Three.js Y-up.
 */
export const X_MIN = -2;
export const X_MAX = 2;
export const Y_MIN = -2;
export const Y_MAX = 2;
export const Z_MIN = 0;
export const Z_MAX = 9;

export const PIT_WIDTH = X_MAX - X_MIN + 1;
export const PIT_HEIGHT = Y_MAX - Y_MIN + 1;
export const PIT_DEPTH = Z_MAX - Z_MIN + 1;
export const LAYER_CELL_COUNT = PIT_WIDTH * PIT_HEIGHT;
export const PIT_CELL_COUNT = LAYER_CELL_COUNT * PIT_DEPTH;

export const SPAWN_X = 0;
export const SPAWN_Y = 0;
export const SPAWN_Z = Z_MAX;

export const CAMERA_X = 0;
export const CAMERA_Y = 0;
export const CAMERA_Z = 15;
export const CAMERA_LOOK_X = 0;
export const CAMERA_LOOK_Y = 0;
export const CAMERA_LOOK_Z = 0;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 80;

/**
 * Drawn size of one voxel. Integer cell centers are one unit apart.
 * A hair over 1 fills the cell and overlaps neighbors by 0.001 so shared
 * faces do not z-fight, without a gap a person can see.
 */
export const CELL_SIZE = 1.001;
export const CELL_HALF = 0.5;
export const PIT_VIEW_PADDING = 1.2;
export const MIN_VIEW_ASPECT = 0.25;
export const PIXEL_RATIO_MIN = 1;
export const PIXEL_RATIO_MAX = 1.75;

export const INITIAL_TICK_MS = 800;
export const MIN_TICK_MS = 200;
/** Slowest base the fall-speed slider can choose. The fast end is MIN_TICK_MS. */
export const SLOWEST_TICK_MS = 1200;
export const TICK_STEP_MS = 50;
export const LAYERS_PER_SPEED_STEP = 10;
export const SOFT_DROP_MS = 50;

export const KEY_REPEAT_DELAY_MS = 170;
export const KEY_REPEAT_INTERVAL_MS = 45;
export const CLEAR_FLASH_MS = 180;

export const SCORE_PER_CELL = 1;
export const SCORE_LAYER_BASE = 100;
export const SCORE_BLOCKOUT = 2000;

export const PIECE_COLORS = {
  I: "#3ec6ff",
  O: "#ffd84a",
  L: "#ff8a2a",
  J: "#4d6bff",
  T: "#c06bff",
  S: "#3ddc6a",
  Z: "#ff4d6a",
  L3: "#ff5ec8",
  Corner: "#2ee6c7",
} as const;

/**
 * Locked voxel colors from the floor upward.
 * Index 0 is Z = 0 (layer 1). Index 9 is Z = 9 (layer 10, the entrance).
 */
export const LAYER_COLORS = [
  "#1E3A8A",
  "#2563EB",
  "#0891B2",
  "#10B981",
  "#84CC16",
  "#FACC15",
  "#F97316",
  "#EF4444",
  "#EC4899",
  "#FFFFFF",
] as const;

export const PIT_GRID_COLOR = "#00FF00";
export const FALLING_WIRE_COLOR = "#FFFFFF";
export const GHOST_COLOR = "#FFFFFF";
export const SCENE_COLOR = "#07080f";
export const CLEAR_HIGHLIGHT = "#fff1c9";
export const CLEAR_HIGHLIGHT_MIX = 0.75;
export const VOXEL_EDGE_COLOR = "#14111a";
export const VOXEL_EDGE_THICKNESS = 0.012;
export const GHOST_OPACITY = 0.35;
