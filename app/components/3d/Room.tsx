"use client";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CurvedMonitor } from "./Monitor";
import { Guitar } from "./Guitar";
import { GuitarWallMount } from "./GuitarWallMount";
import { ViewType } from "./CameraController";
import type { FocusTarget } from "./CameraController";

// Guitar camera preset — position & target for the zoom view
export const GUITAR_FOCUS: FocusTarget = {
  position: new THREE.Vector3(-1.9, 1.6, -1.9),
  target: new THREE.Vector3(-1.9, 1.6, -1.5),
};

interface RoomProps {
  currentView: ViewType;
  focusTarget: FocusTarget | null;
  onViewChange: (view: ViewType) => void;
  onFocusChange: (target: FocusTarget | null) => void;
  hoveredNav?: string | null;
  onBrowserReady?: () => void;
}

export function Room({ currentView, focusTarget, onViewChange, onFocusChange, hoveredNav, onBrowserReady }: RoomProps) {
  const { scene } = useGLTF("/models/Room.glb");

  const isRoomView = currentView === "room" && focusTarget === null;

  return (
    <group>
      <primitive object={scene} />
      <CurvedMonitor
        position={[0, 0.86, -0.27]}
        rotation={[0, Math.PI, 0]}
        onClick={isRoomView ? () => onViewChange("monitor") : undefined}
        showLabel={isRoomView}
        isHighlighted={hoveredNav === "monitor" && currentView !== "monitor"}
        onReady={onBrowserReady}
      />
      <GuitarWallMount
        position={[-2.18, 2, -0.1]}
        rotation={[0, 0, 0]}
        scale={2}
      />
      <Guitar
        position={[-1.3, 1.3, -0.45]}
        rotation={[0, -Math.PI, 0]}
        scale={1.2}
        onClick={isRoomView ? () => onFocusChange(GUITAR_FOCUS) : undefined}
        showLabel={isRoomView}
        isHighlighted={hoveredNav === "guitar" && focusTarget !== GUITAR_FOCUS}
      />
    </group>
  );
}

useGLTF.preload("/models/Room.glb");

