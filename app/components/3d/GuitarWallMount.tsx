"use client";

import * as THREE from "three";
import { useMemo } from "react";

interface GuitarWallMountProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export function GuitarWallMount({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: GuitarWallMountProps) {
  // Materials
  const woodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8B6914"),
        roughness: 0.7,
        metalness: 0.05,
      }),
    []
  );

  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#3a3a3a"),
        roughness: 0.35,
        metalness: 0.8,
      }),
    []
  );

  const rubberMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#1a1a1a"),
        roughness: 0.95,
        metalness: 0.0,
      }),
    []
  );

  // All geometry extends in -Z direction (toward camera/viewer)
  // Backplate sits flush against wall at z=0, everything else goes into -Z
  const backplateDepth = 0.012;
  const backplateHalfDepth = backplateDepth / 2; // 0.0125
  const rodLength = 0.02; // shorter rod as requested
  const rodRadius = 0.005;

  // Rod extends from the front face of the backplate into -Z
  const rodStartZ = -backplateHalfDepth; // front face of backplate
  const rodEndZ = rodStartZ - rodLength; // end of rod

  // U-shaped hook — curves in XZ plane, opens toward viewer (-Z)
  // Bottom of U connects exactly at rod end (no gap)
  const hookCurve = useMemo(() => {
    const spread = 0.018; // half-width of the U
    const depth = 0.03; // how far the U prongs extend toward viewer

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-spread, 0, rodEndZ - depth), // left prong tip
      new THREE.Vector3(-spread, 0, rodEndZ - depth * 0.4),
      new THREE.Vector3(0, 0, rodEndZ),               // bottom of U = rod end
      new THREE.Vector3(spread, 0, rodEndZ - depth * 0.4),
      new THREE.Vector3(spread, 0, rodEndZ - depth),   // right prong tip
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.005, 8, false);
  }, [rodEndZ]);

  const prongTipZ = rodEndZ - 0.03; // Z of prong tips

  return (
    <group
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Wooden backplate — flush against wall at z=0 */}
      <mesh material={woodMat} position={[0, 0, 0]}>
        <boxGeometry args={[0.06, 0.08, backplateDepth]} />
      </mesh>

      {/* Support rod — extends from backplate front face into -Z */}
      <mesh
        material={metalMat}
        position={[0, 0, rodStartZ - rodLength / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[rodRadius, rodRadius, rodLength, 12]} />
      </mesh>

      {/* U-shaped hook — opens toward viewer, bottom at rod end */}
      <mesh geometry={hookCurve} material={metalMat} />

      {/* Left prong rubber tip */}
      <group position={[-0.018, 0, prongTipZ]}>
        <mesh material={rubberMat}>
          <cylinderGeometry args={[0.007, 0.007, 0.007, 12]} />
        </mesh>
        <mesh material={rubberMat} position={[0, 0, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.007, 10, 10]} />
        </mesh>
      </group>

      {/* Right prong rubber tip */}
      <group position={[0.018, 0, prongTipZ]}>
        <mesh material={rubberMat}>
          <cylinderGeometry args={[0.007, 0.007, 0.007, 12]} />
        </mesh>
        <mesh material={rubberMat} position={[0, 0, -0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.007, 10, 10]} />
        </mesh>
      </group>
    </group>
  );
}
