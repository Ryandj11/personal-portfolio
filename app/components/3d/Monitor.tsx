"use client";

import { useRef, useState } from "react";
import { Group } from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Html } from "@react-three/drei";
import { BrowserWindow } from "../browser/BrowserWindow";

interface CurvedMonitorProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  showLabel?: boolean;
  isHighlighted?: boolean;
}

export function CurvedMonitor({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onClick,
  showLabel = false,
  isHighlighted = false,
}: CurvedMonitorProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const monitorRef = useRef<Group>(null);

  // Monitor Physical Dimensions (units)
  // Scaled to be proportional to the desk scene
  const screenWidth = 1.1;
  const screenHeight = 0.45; // 16:9 aspect ratio
  const bezelSize = 0.01;
  const monitorThickness = 0.005;
  const monitorCenterY = 0.4;

  // Resolution for the browser content (pixels)
  // We map CSS pixels -> world units via drei's <Html transform distanceFactor>
  const pixelWidth = 1600;
  // Derive height from world aspect ratio so the Html content exactly matches the screen plane.
  const pixelHeight = Math.round((screenHeight / screenWidth) * pixelWidth); // e.g. 650
  // In drei's Html(transform) implementation, the effective ratio is (distanceFactor / 400).
  // We want: pixelWidth * ratio === screenWidth  =>  distanceFactor === (screenWidth / pixelWidth) * 400
  const distanceFactor = (screenWidth / pixelWidth) * 400; // 0.4

  // Subtle idle animation
  useFrame((state) => {
    if (monitorRef.current) {
      monitorRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.2) * 0.002;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (onClick) document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* Stand */}
      <MonitorStand
        monitorHeight={monitorCenterY}
        monitorThickness={monitorThickness}
      />

      {/* Monitor Head */}
      <group ref={monitorRef} position={[0, monitorCenterY, 0]}>
        {/* Interactive Browser Content */}
        {/* Rendered as a 3D transformed plane on top of the screen */}
        <Html
          transform
          occlude="blending"
          position={[0, 0, 0.001]} // Adjusted offset to prevent z-fighting
          distanceFactor={distanceFactor}
          style={{
            width: `${pixelWidth}px`,
            height: `${pixelHeight}px`,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              width: `${pixelWidth}px`,
              height: `${pixelHeight}px`,
              backgroundColor: "#202124",
              overflow: "hidden",
              position: "relative",
              cursor: showLabel ? "pointer" : "default",
            }}
            onMouseEnter={() => { if (showLabel) setHovered(true); }}
            onMouseLeave={() => { setHovered(false); }}
            onClick={(e) => {
              if (showLabel && onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            <div style={{ pointerEvents: showLabel ? "none" : "auto", height: "100%" }}>
              <BrowserWindow />
            </div>
            {/* Screen hover overlay */}
            {((hovered && showLabel) || isHighlighted) && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255, 255, 255, 0.06)",
                  pointerEvents: "none",
                  transition: "opacity 0.3s ease",
                }}
              />
            )}
          </div>
        </Html>

        {/* 3. Bezel Frame */}
        {/* Surrounds the screen */}
        <RoundedBox
          args={[
            screenWidth + bezelSize * 2,
            screenHeight + bezelSize * 2,
            monitorThickness,
          ]}
          radius={0.005}
          smoothness={4}
          position={[0, 0, -monitorThickness / 2]}
        >
          <meshStandardMaterial
            color="#111111"
            roughness={0.6}
            metalness={0.4}
            emissive={(hovered && showLabel) || isHighlighted ? "#ffffff" : "#000000"}
            emissiveIntensity={(hovered && showLabel) || isHighlighted ? 0.15 : 0}
          />
        </RoundedBox>

        {/* 4. Solid Back Panel */}
        <RoundedBox
          args={[
            screenWidth + bezelSize * 2,
            screenHeight + bezelSize * 2,
            0.02,
          ]}
          radius={0.005}
          smoothness={4}
          position={[0, 0, -monitorThickness - 0.01]}
        >
          <meshStandardMaterial
            color="#1a1a1a"
            roughness={0.7}
            metalness={0.3}
            emissive={(hovered && showLabel) || isHighlighted ? "#ffffff" : "#000000"}
            emissiveIntensity={(hovered && showLabel) || isHighlighted ? 0.1 : 0}
          />
        </RoundedBox>

        {/* 5. Power LED */}
        <mesh position={[0, -screenHeight / 2 - bezelSize * 0.5, 0.002]}>
          <circleGeometry args={[0.002, 16]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

// Monitor Stand Component
interface MonitorStandProps {
  monitorHeight: number;
  monitorThickness: number;
}

function MonitorStand({ monitorHeight, monitorThickness }: MonitorStandProps) {
  const backZ = -monitorThickness - 0.02; // Position at back of monitor
  const columnZ = backZ - 0.05;

  return (
    <group>
      {/* Base plate - center piece where legs meet column */}
      <RoundedBox
        args={[0.12, 0.02, 0.12]}
        radius={0.005}
        smoothness={4}
        position={[0, 0.01, columnZ]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </RoundedBox>

      {/* Left Leg - connected to base plate */}
      <mesh
        position={[-0.12, 0.01, columnZ + 0.12]}
        rotation={[0, Math.PI * 0.25, 0]}
        castShadow
      >
        <boxGeometry args={[0.28, 0.015, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Right Leg - connected to base plate */}
      <mesh
        position={[0.12, 0.01, columnZ + 0.12]}
        rotation={[0, -Math.PI * 0.25, 0]}
        castShadow
      >
        <boxGeometry args={[0.28, 0.015, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Vertical Column - connects base to monitor */}
      <RoundedBox
        args={[0.05, monitorHeight, 0.05]}
        radius={0.01}
        smoothness={4}
        position={[0, monitorHeight / 2, columnZ]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </RoundedBox>

      {/* Connector plate - attaches directly to back of monitor */}
      <RoundedBox
        args={[0.15, 0.15, 0.02]}
        radius={0.01}
        smoothness={4}
        position={[0, monitorHeight, backZ]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </RoundedBox>

      {/* Neck connecting column to plate */}
      <RoundedBox
        args={[0.05, 0.08, 0.05]}
        radius={0.01}
        smoothness={4}
        position={[0, monitorHeight, backZ - 0.025]}
        castShadow
      >
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.5} />
      </RoundedBox>
    </group>
  );
}
