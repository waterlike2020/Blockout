import { LAYER_COLORS, Z_MIN } from "@/game/constants";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

/**
 * Color of a locked voxel. Depth alone decides it.
 * A piece's own hue is not mixed in.
 */
export function layerColor(z: number): string {
  const index = Math.min(LAYER_COLORS.length - 1, Math.max(0, Math.round(z) - Z_MIN));
  return LAYER_COLORS[index] ?? LAYER_COLORS[0];
}

export function layerRgb(z: number): Rgb {
  return hexToRgb(layerColor(z));
}
