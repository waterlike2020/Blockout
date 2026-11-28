import {
  CAMERA_Z,
  CELL_HALF,
  MIN_VIEW_ASPECT,
  PIT_VIEW_PADDING,
  X_MAX,
  X_MIN,
  Z_MAX,
} from "@/game/constants";

/** Vertical field of view, in degrees, that keeps the whole well inside the frame. */
export function cameraFovDegrees(aspect: number): number {
  const nearDistance = CAMERA_Z - (Z_MAX + CELL_HALF);
  const halfExtent = (X_MAX - X_MIN + 1) / 2 + PIT_VIEW_PADDING;
  const safeAspect = Math.max(aspect, MIN_VIEW_ASPECT);
  const tanNeeded = halfExtent / nearDistance;
  const tanVertical = Math.max(tanNeeded, tanNeeded / safeAspect);
  return (2 * Math.atan(tanVertical) * 180) / Math.PI;
}
