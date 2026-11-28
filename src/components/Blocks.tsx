"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { occupiedCells } from "@/game/board";
import { dropDistance } from "@/game/collision";
import { layerColor } from "@/game/color";
import {
  CELL_SIZE,
  CLEAR_HIGHLIGHT,
  CLEAR_HIGHLIGHT_MIX,
  FALLING_WIRE_COLOR,
  GHOST_COLOR,
  GHOST_OPACITY,
  PIT_CELL_COUNT,
  VOXEL_EDGE_COLOR,
  VOXEL_EDGE_THICKNESS,
} from "@/game/constants";
import { worldCells } from "@/game/pieces";
import { useGameStore } from "@/store/gameStore";
import type { CellCoord, OccupiedCell } from "@/types/game";

const EDGES_PER_CELL = 4;

interface EdgeAxis {
  args: [number, number, number];
  offsets: Array<[number, number, number]>;
}

function buildVoxelEdges(): EdgeAxis[] {
  const half = CELL_SIZE / 2;
  const thick = VOXEL_EDGE_THICKNESS;
  const span = CELL_SIZE - thick;
  const sizes: Array<[number, number, number]> = [
    [span, thick, thick],
    [thick, span, thick],
    [thick, thick, span],
  ];
  const signs = [-half, half];
  const axes: EdgeAxis[] = [];

  for (let axis = 0; axis < sizes.length; axis += 1) {
    const args = sizes[axis] ?? [span, thick, thick];
    const offsets: Array<[number, number, number]> = [];
    for (const a of signs) {
      for (const b of signs) {
        const position: [number, number, number] = [0, 0, 0];
        position[(axis + 1) % 3] = a;
        position[(axis + 2) % 3] = b;
        offsets.push(position);
      }
    }
    axes.push({ args, offsets });
  }

  return axes;
}

const VOXEL_EDGES = buildVoxelEdges();

function fallingWirePositions(): Float32Array {
  const half = CELL_SIZE / 2;
  const corners: Array<[number, number, number]> = [
    [-half, -half, -half],
    [half, -half, -half],
    [half, half, -half],
    [-half, half, -half],
    [-half, -half, half],
    [half, -half, half],
    [half, half, half],
    [-half, half, half],
  ];
  const links: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const positions: number[] = [];
  for (const [from, to] of links) {
    const start = corners[from];
    const end = corners[to];
    if (!start || !end) continue;
    positions.push(start[0], start[1], start[2], end[0], end[1], end[2]);
  }
  return new Float32Array(positions);
}

const FALLING_WIRE_POSITIONS = fallingWirePositions();

function paintLockedCells(
  mesh: THREE.InstancedMesh,
  cells: readonly OccupiedCell[],
  clearing: ReadonlySet<number>,
): void {
  if (!mesh.instanceColor) {
    mesh.instanceColor = new THREE.InstancedBufferAttribute(
      new Float32Array(PIT_CELL_COUNT * 3),
      3,
    );
  }

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  cells.forEach((cell, index) => {
    dummy.position.set(cell.x, cell.y, cell.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    color.set(layerColor(cell.z));
    if (clearing.has(cell.z)) color.lerp(new THREE.Color(CLEAR_HIGHLIGHT), CLEAR_HIGHLIGHT_MIX);
    mesh.setColorAt(index, color);
  });
  mesh.count = cells.length;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function paintEdges(
  mesh: THREE.InstancedMesh,
  cells: readonly CellCoord[],
  offsets: readonly (readonly [number, number, number])[],
): void {
  const dummy = new THREE.Object3D();
  let index = 0;
  for (const cell of cells) {
    for (const [ox, oy, oz] of offsets) {
      dummy.position.set(cell.x + ox, cell.y + oy, cell.z + oz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      index += 1;
    }
  }
  mesh.count = index;
  mesh.instanceMatrix.needsUpdate = true;
}

export function Blocks() {
  const grid = useGameStore((state) => state.grid);
  const active = useGameStore((state) => state.active);
  const clearingLayers = useGameStore((state) => state.clearingLayers);
  const cells = useMemo(() => occupiedCells(grid), [grid]);
  const clearing = useMemo(() => new Set(clearingLayers), [clearingLayers]);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgeXRef = useRef<THREE.InstancedMesh>(null);
  const edgeYRef = useRef<THREE.InstancedMesh>(null);
  const edgeZRef = useRef<THREE.InstancedMesh>(null);
  const landing = active ? dropDistance(grid, active) : null;
  const edgeX = VOXEL_EDGES[0];
  const edgeY = VOXEL_EDGES[1];
  const edgeZ = VOXEL_EDGES[2];

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh) paintLockedCells(mesh, cells, clearing);
    const edgeMeshes = [edgeXRef.current, edgeYRef.current, edgeZRef.current];
    VOXEL_EDGES.forEach((axis, index) => {
      const edgeMesh = edgeMeshes[index];
      if (edgeMesh) paintEdges(edgeMesh, cells, axis.offsets);
    });
  }, [cells, clearing]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PIT_CELL_COUNT]} frustumCulled={false}>
        <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
        <meshStandardMaterial roughness={0.42} metalness={0.08} />
      </instancedMesh>
      {edgeX ? (
        <instancedMesh
          ref={edgeXRef}
          args={[undefined, undefined, PIT_CELL_COUNT * EDGES_PER_CELL]}
          frustumCulled={false}
          renderOrder={2}
        >
          <boxGeometry args={edgeX.args} />
          <EdgeMaterial />
        </instancedMesh>
      ) : null}
      {edgeY ? (
        <instancedMesh
          ref={edgeYRef}
          args={[undefined, undefined, PIT_CELL_COUNT * EDGES_PER_CELL]}
          frustumCulled={false}
          renderOrder={2}
        >
          <boxGeometry args={edgeY.args} />
          <EdgeMaterial />
        </instancedMesh>
      ) : null}
      {edgeZ ? (
        <instancedMesh
          ref={edgeZRef}
          args={[undefined, undefined, PIT_CELL_COUNT * EDGES_PER_CELL]}
          frustumCulled={false}
          renderOrder={2}
        >
          <boxGeometry args={edgeZ.args} />
          <EdgeMaterial />
        </instancedMesh>
      ) : null}
      {active
        ? worldCells(active).map((cell) => <FallingMino key={keyOf(cell)} cell={cell} />)
        : null}
      {landing && landing.distance > 0
        ? worldCells(landing.piece).map((cell) => (
            <LandingGhost key={`ghost-${keyOf(cell)}`} cell={cell} />
          ))
        : null}
    </group>
  );
}

function keyOf(cell: CellCoord): string {
  return `${cell.x}:${cell.y}:${cell.z}`;
}

function EdgeMaterial() {
  return (
    <meshBasicMaterial
      color={VOXEL_EDGE_COLOR}
      toneMapped={false}
      polygonOffset
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
    />
  );
}

function FallingMino({ cell }: { cell: CellCoord }) {
  return (
    <lineSegments position={[cell.x, cell.y, cell.z]} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[FALLING_WIRE_POSITIONS, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={FALLING_WIRE_COLOR} toneMapped={false} />
    </lineSegments>
  );
}

function LandingGhost({ cell }: { cell: CellCoord }) {
  return (
    <lineSegments position={[cell.x, cell.y, cell.z]} renderOrder={1}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[FALLING_WIRE_POSITIONS, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color={GHOST_COLOR}
        transparent
        opacity={GHOST_OPACITY}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}
