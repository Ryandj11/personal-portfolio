"use client";

import { useState, useEffect, useRef } from "react";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";

interface GuitarProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  onClick?: () => void;
  showLabel?: boolean;
  isHighlighted?: boolean;
}

export function Guitar({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  showLabel = false,
  isHighlighted = false,
}: GuitarProps) {
  const { scene } = useGLTF("/models/Guitar.glb");
  const [hovered, setHovered] = useState(false);
  const originalEmissives = useRef<Map<THREE.Mesh, { color: THREE.Color; intensity: number }>>(new Map());

  // Store original emissive values on first render
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.emissive) {
          originalEmissives.current.set(mesh, {
            color: mat.emissive.clone(),
            intensity: mat.emissiveIntensity ?? 0,
          });
        }
      }
    });
  }, [scene]);

  // Apply/remove highlight on hover
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat?.emissive) {
          if ((hovered && showLabel) || isHighlighted) {
            mat.emissive.set(0xffffff);
            mat.emissiveIntensity = 0.12;
          } else {
            const orig = originalEmissives.current.get(mesh);
            if (orig) {
              mat.emissive.copy(orig.color);
              mat.emissiveIntensity = orig.intensity;
            }
          }
        }
      }
    });
  }, [hovered, showLabel, isHighlighted, scene]);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={typeof scale === "number" ? [scale, scale, scale] : scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = onClick ? "pointer" : "default";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/Guitar.glb");

