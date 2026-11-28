"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_LOOK_X,
  CAMERA_LOOK_Y,
  CAMERA_LOOK_Z,
  CAMERA_X,
  CAMERA_Y,
  CAMERA_Z,
} from "@/game/constants";
import { cameraFovDegrees } from "@/game/view";

export function FitCamera() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(size.height, 1);
    // R3F refreshes aspect on resize. Field of view, position, and look-at stay on this camera.
    /* eslint-disable react-hooks/immutability -- Three.js cameras are updated in place. */
    camera.fov = cameraFovDegrees(aspect);
    camera.position.set(CAMERA_X, CAMERA_Y, CAMERA_Z);
    camera.lookAt(CAMERA_LOOK_X, CAMERA_LOOK_Y, CAMERA_LOOK_Z);
    camera.updateProjectionMatrix();
    /* eslint-enable react-hooks/immutability */
  }, [camera, size]);

  return null;
}
