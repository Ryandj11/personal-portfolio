"use client";

import { useRef, useEffect } from "react";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";

export type ViewType = "room" | "monitor";

interface CameraControllerProps {
  view: ViewType;
}

// Camera presets for each view
const CAMERA_PRESETS = {
  // "View Room" Button Preset
  room: {
    // Camera on -X axis, rotated 90° left from original
    // Camera Position (X, Y, Z). Change this to move the camera's location.
    // Important: Update the "camera" prop in Scene.tsx to match this value!
    position: new THREE.Vector3(0, 1.5, -4),
    // Target: point where camera looks at. Change this to adjust viewing angle:
    // Y: Higher = look UP, Lower = look DOWN
    // Z: Change to look Left/Right
    target: new THREE.Vector3(0, 1.0, 0),
  },
  // "Use Computer" Button Preset
  monitor: {
    // Zoomed in view of the monitor
    // Position: X=0 (centered), Y=1.2 (eye level), Z=-0.6 (close to screen)
    position: new THREE.Vector3(0, 1.2, -1), 
    // Target: Look straight ahead at the monitor screen
    target: new THREE.Vector3(0, 1.2, 0),      
  },
};

export function CameraController({ view }: CameraControllerProps) {
  const cameraControlsRef = useRef<CameraControls>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    const controls = cameraControlsRef.current;
    if (!controls) return;

    const preset = CAMERA_PRESETS[view];
    
    // On initial mount, set camera immediately (no animation)
    // On subsequent changes, animate to the new position
    controls.setLookAt(
      preset.position.x,
      preset.position.y,
      preset.position.z,
      preset.target.x,
      preset.target.y,
      preset.target.z,
      !isInitialMount.current // animate only if not initial mount
    );
    
    isInitialMount.current = false;
  }, [view]);

  return (
    <CameraControls
      ref={cameraControlsRef}
      // Limit user controls based on view
      enabled={view === "room"}
      // Smooth damping
      smoothTime={0.5}
      
      // === FIRST-PERSON LOOK-AROUND CONSTRAINTS ===
      // Disable zoom and panning - only allow looking around
      dollySpeed={0}
      truckSpeed={0}
      
      // Lock distance so camera stays in place
      minDistance={3}
      maxDistance={3}
      
      // Vertical look constraints (Top/Bottom Limits)
      // To tune these:
      // minPolarAngle = Top limit. Increase to restrict looking UP. (0 = straight up, PI/2 = horizon)
      minPolarAngle={Math.PI / 2.5}     // ~72° from top (limited upward view)
      
      // maxPolarAngle = Bottom limit. Decrease to restrict looking DOWN. (PI/2 = horizon, PI = straight down)
      maxPolarAngle={Math.PI / 2.08}     // ~112° from top (enough to see controls)
      
      // Horizontal look constraints
      // Camera is at Z=-4 looking at Z=0.
      // 0 azimuth = looking at -Z (from +Z). PI azimuth = looking at +Z (from -Z).
      // Since we are at -Z looking at +Z, our center is PI.
      minAzimuthAngle={Math.PI - Math.PI / 4}    // 180° - 45° = 135° (look left limit)
      maxAzimuthAngle={Math.PI + Math.PI / 4}    // 180° + 45° = 225° (look right limit)
    />
  );
}
