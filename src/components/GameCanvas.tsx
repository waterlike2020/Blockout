"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  CAMERA_FAR,
  CAMERA_LOOK_X,
  CAMERA_LOOK_Y,
  CAMERA_LOOK_Z,
  CAMERA_NEAR,
  CAMERA_X,
  CAMERA_Y,
  CAMERA_Z,
  PIXEL_RATIO_MAX,
  PIXEL_RATIO_MIN,
  SCENE_COLOR,
} from "@/game/constants";
import { cameraFovDegrees } from "@/game/view";
import { Blocks } from "@/components/Blocks";
import { FitCamera } from "@/components/FitCamera";
import { Pit } from "@/components/Pit";

export function GameCanvas() {
  const fov = useMemo(() => cameraFovDegrees(1), []);

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = SCENE_COLOR;
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[PIXEL_RATIO_MIN, PIXEL_RATIO_MAX]}
      gl={{ antialias: true, alpha: false }}
      camera={{
        position: [CAMERA_X, CAMERA_Y, CAMERA_Z],
        fov,
        near: CAMERA_NEAR,
        far: CAMERA_FAR,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(CAMERA_LOOK_X, CAMERA_LOOK_Y, CAMERA_LOOK_Z);
      }}
    >
      <color attach="background" args={[SCENE_COLOR]} />
      <FitCamera />
      <hemisphereLight args={["#d5e2ff", "#ffb07a", 0.85]} />
      <ambientLight intensity={0.4} color="#d5def2" />
      <directionalLight position={[2.5, 4.5, 16]} intensity={2.3} color="#f7f4ff" />
      <Pit />
      <Blocks />
    </Canvas>
  );
}
