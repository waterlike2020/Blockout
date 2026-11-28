"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  CELL_HALF,
  PIT_GRID_COLOR,
  X_MAX,
  X_MIN,
  Y_MAX,
  Y_MIN,
  Z_MAX,
  Z_MIN,
} from "@/game/constants";

function boundaries(min: number, max: number): number[] {
  const values: number[] = [];
  for (let step = min; step <= max + 1; step += 1) values.push(step - CELL_HALF);
  return values;
}

export function Pit() {
  const lattice = useMemo(() => {
    const positions: number[] = [];
    const x0 = X_MIN - CELL_HALF;
    const x1 = X_MAX + CELL_HALF;
    const y0 = Y_MIN - CELL_HALF;
    const y1 = Y_MAX + CELL_HALF;
    const z0 = Z_MIN - CELL_HALF;
    const z1 = Z_MAX + CELL_HALF;

    const push = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
      positions.push(ax, ay, az, bx, by, bz);
    };

    const xLines = boundaries(X_MIN, X_MAX);
    const yLines = boundaries(Y_MIN, Y_MAX);
    const zLines = boundaries(Z_MIN, Z_MAX);

    for (const x of xLines) {
      push(x, y0, z0, x, y0, z1);
      push(x, y1, z0, x, y1, z1);
    }
    for (const y of yLines) {
      if (y === y0 || y === y1) continue;
      push(x0, y, z0, x0, y, z1);
      push(x1, y, z0, x1, y, z1);
    }

    for (const z of zLines) {
      push(x0, y0, z, x1, y0, z);
      push(x0, y1, z, x1, y1, z);
      push(x0, y0, z, x0, y1, z);
      push(x1, y0, z, x1, y1, z);
    }

    for (const x of xLines) {
      if (x === x0 || x === x1) continue;
      push(x, y0, z0, x, y1, z0);
    }
    for (const y of yLines) {
      if (y === y0 || y === y1) continue;
      push(x0, y, z0, x1, y, z0);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useEffect(() => {
    return () => lattice.dispose();
  }, [lattice]);

  return (
    <lineSegments geometry={lattice}>
      <lineBasicMaterial color={PIT_GRID_COLOR} toneMapped={false} />
    </lineSegments>
  );
}
