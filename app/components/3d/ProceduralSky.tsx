"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { WeatherCondition, InterpolatedWeather } from "../../hooks/useWeather";

// ─── Time helpers ────────────────────────────────────────────────────────────

/** Current decimal hour in America/Los_Angeles (handles PST ↔ PDT automatically) */
export function getLAHour(): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour + minute / 60;
}

/** @deprecated Use getLAHour instead */
export const getPSTHour = getLAHour;

// ─── Color helpers ───────────────────────────────────────────────────────────

function lerpColor(color1: string, color2: string, t: number): THREE.Color {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t);
}

// ─── Sky color system (now sunrise/sunset-aware) ─────────────────────────────

export function getSkyColors(hour: number, sunrise = 6, sunset = 19) {
  // Dynamically build time keyframes around actual sunrise/sunset
  const dawnStart = sunrise - 1;
  const dawnEnd = sunrise + 1;
  const duskStart = sunset - 2;
  const duskMid = sunset;
  const duskEnd = sunset + 1;
  const nightStart = sunset + 1.5;

  const timePoints = [
    { hour: 0,          top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },
    { hour: dawnStart,  top: "#0a1628", middle: "#162442", bottom: "#1e3050", ambient: 0.15, sunsetColor: "#c89060", sunsetIntensity: 0.08 },
    { hour: sunrise,    top: "#4a6fa5", middle: "#8aa8c8", bottom: "#d4b088", ambient: 0.4,  sunsetColor: "#d4a060", sunsetIntensity: 0.5 },
    { hour: dawnEnd,    top: "#6ba3d6", middle: "#a0c0d8", bottom: "#d8c8a8", ambient: 0.6,  sunsetColor: "#d8b878", sunsetIntensity: 0.2 },
    { hour: sunrise + 4,top: "#87CEEB", middle: "#a8d4e8", bottom: "#c8e6f0", ambient: 0.9,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },
    { hour: 12,         top: "#87CEEB", middle: "#87CEEB", bottom: "#b8dff5", ambient: 1.0,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },
    { hour: 14,         top: "#87CEEB", middle: "#87CEEB", bottom: "#b8dff5", ambient: 1.0,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },
    { hour: duskStart,  top: "#5a90c0", middle: "#88a8c0", bottom: "#d0b890", ambient: 0.7,  sunsetColor: "#d0a060", sunsetIntensity: 0.25 },
    { hour: duskMid,    top: "#4070a8", middle: "#6890b0", bottom: "#c8a070", ambient: 0.5,  sunsetColor: "#d89050", sunsetIntensity: 0.55 },
    { hour: duskEnd,    top: "#283c6a", middle: "#3c5880", bottom: "#687888", ambient: 0.35, sunsetColor: "#a08060", sunsetIntensity: 0.25 },
    { hour: nightStart, top: "#162850", middle: "#1e3458", bottom: "#2a3c5a", ambient: 0.22, sunsetColor: "#3a4868", sunsetIntensity: 0.05 },
    { hour: nightStart + 0.5, top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },
    { hour: 24,         top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },
  ];

  // Ensure sorted by hour
  timePoints.sort((a, b) => a.hour - b.hour);

  let prevPoint = timePoints[0];
  let nextPoint = timePoints[1];

  for (let i = 0; i < timePoints.length - 1; i++) {
    if (hour >= timePoints[i].hour && hour < timePoints[i + 1].hour) {
      prevPoint = timePoints[i];
      nextPoint = timePoints[i + 1];
      break;
    }
  }

  const range = nextPoint.hour - prevPoint.hour;
  const t = range > 0 ? (hour - prevPoint.hour) / range : 0;

  return {
    top: lerpColor(prevPoint.top, nextPoint.top, t),
    middle: lerpColor(prevPoint.middle, nextPoint.middle, t),
    bottom: lerpColor(prevPoint.bottom, nextPoint.bottom, t),
    ambient: prevPoint.ambient + (nextPoint.ambient - prevPoint.ambient) * t,
    sunsetColor: lerpColor(prevPoint.sunsetColor, nextPoint.sunsetColor, t),
    sunsetIntensity: prevPoint.sunsetIntensity + (nextPoint.sunsetIntensity - prevPoint.sunsetIntensity) * t,
  };
}

// ─── Grass colors (sunrise/sunset-aware) ─────────────────────────────────────

function getGrassColors(hour: number, sunrise = 6, sunset = 19) {
  const nightStart = sunset + 1.5;
  const grassTimePoints = [
    { hour: 0,          near: "#1e4a2a", mid: "#245530", far: "#2d5e38", horizon: "#3a6d45" },
    { hour: sunrise - 1,near: "#1e4a2a", mid: "#245530", far: "#2d5e38", horizon: "#3a6d45" },
    { hour: sunrise,    near: "#2a6030", mid: "#357238", far: "#408240", horizon: "#5a9a55" },
    { hour: sunrise + 1,near: "#3a7a30", mid: "#4a8c38", far: "#5a9a42", horizon: "#72b060" },
    { hour: sunrise + 4,near: "#4a8c2a", mid: "#55a030", far: "#65ac3e", horizon: "#80c060" },
    { hour: 12,         near: "#4e9028", mid: "#58a530", far: "#68b03c", horizon: "#85c562" },
    { hour: 14,         near: "#4e9028", mid: "#58a530", far: "#68b03c", horizon: "#85c562" },
    { hour: sunset - 2, near: "#488828", mid: "#529a30", far: "#60a538", horizon: "#7ab858" },
    { hour: sunset,     near: "#3d7828", mid: "#488a2e", far: "#559535", horizon: "#6aaa4a" },
    { hour: sunset + 1, near: "#2e6028", mid: "#35702e", far: "#407a35", horizon: "#508a42" },
    { hour: nightStart, near: "#255530", mid: "#2c6035", far: "#346a3a", horizon: "#427a48" },
    { hour: nightStart + 0.5, near: "#1e4a2a", mid: "#245530", far: "#2d5e38", horizon: "#3a6d45" },
    { hour: 24,         near: "#1e4a2a", mid: "#245530", far: "#2d5e38", horizon: "#3a6d45" },
  ];

  grassTimePoints.sort((a, b) => a.hour - b.hour);

  let prevPoint = grassTimePoints[0];
  let nextPoint = grassTimePoints[1];

  for (let i = 0; i < grassTimePoints.length - 1; i++) {
    if (hour >= grassTimePoints[i].hour && hour < grassTimePoints[i + 1].hour) {
      prevPoint = grassTimePoints[i];
      nextPoint = grassTimePoints[i + 1];
      break;
    }
  }

  const range = nextPoint.hour - prevPoint.hour;
  const t = range > 0 ? (hour - prevPoint.hour) / range : 0;

  return {
    near: lerpColor(prevPoint.near, nextPoint.near, t).getStyle(),
    mid: lerpColor(prevPoint.mid, nextPoint.mid, t).getStyle(),
    far: lerpColor(prevPoint.far, nextPoint.far, t).getStyle(),
    horizon: lerpColor(prevPoint.horizon, nextPoint.horizon, t).getStyle(),
  };
}

// ─── Time-of-day (sunrise/sunset-aware) ──────────────────────────────────────

export function getTimeOfDay(
  hour: number,
  sunrise = 6,
  sunset = 19
): "night" | "dawn" | "day" | "dusk" {
  const nightStart = sunset + 1.5;
  if (hour < sunrise || hour >= nightStart) return "night";
  if (hour < sunrise + 2) return "dawn";
  if (hour < sunset - 1) return "day";
  return "dusk";
}

// ─── Sun position (sunrise/sunset-aware) ─────────────────────────────────────

function getSunPosition(
  hour: number,
  sunrise = 6,
  sunset = 19
): [number, number, number] {
  const nightStart = sunset + 1.5;
  if (hour < sunrise || hour >= nightStart) return [0, -100, 150];

  const dayLength = nightStart - sunrise;
  const progress = (hour - sunrise) / dayLength;

  const angle = progress * Math.PI;
  const x = Math.cos(angle) * 25;
  const y = Math.sin(angle) * 30 + 15;
  const z = 120;

  return [x, y, z];
}

// ─── Moon position (sunrise/sunset-aware) ────────────────────────────────────

function getMoonPosition(
  hour: number,
  sunrise = 6,
  sunset = 19
): [number, number, number] {
  if (hour >= sunrise && hour < sunset) return [0, -100, 150];

  let progress: number;
  if (hour >= sunset) {
    progress = (hour - sunset) / (24 - sunset + sunrise);
  } else {
    progress = (hour + 24 - sunset) / (24 - sunset + sunrise);
  }

  const angle = progress * Math.PI;
  const x = Math.cos(angle) * 20;
  const y = Math.sin(angle) * 25 + 20;
  const z = 120;

  return [x, y, z];
}

// ─── Cloud component ─────────────────────────────────────────────────────────

interface CloudProps {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  opacity?: number;
  hour: number;
  sunrise?: number;
  sunset?: number;
}

function Cloud({
  position,
  scale = 1,
  speed = 0.02,
  opacity = 0.85,
  hour,
  sunrise = 6,
  sunset = 19,
}: CloudProps) {
  const meshRef = useRef<THREE.Group>(null);
  const initialX = position[0];
  const timeOfDay = getTimeOfDay(hour, sunrise, sunset);

  const cloudColor = useMemo(() => {
    if (hour < sunrise || hour >= sunset + 1.5) return "#3a4a5a";
    if (hour < sunrise + 2) {
      const t = (hour - sunrise) / 2;
      return lerpColor("#3a4a5a", "#fff8f0", t).getStyle();
    }
    if (hour >= sunset) {
      const t = (hour - sunset) / 1.5;
      return lerpColor("#ffccaa", "#3a4a5a", t).getStyle();
    }
    if (hour >= sunset - 1) {
      const t = (hour - (sunset - 1)) / 1;
      return lerpColor("#fff8f0", "#ffccaa", t).getStyle();
    }
    return "#fff8f0";
  }, [hour, sunrise, sunset]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x =
        initialX + Math.sin(state.clock.elapsedTime * speed) * 2;
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
    }
  });

  const cloudOpacity = timeOfDay === "night" ? opacity * 0.4 : opacity;

  return (
    <group ref={meshRef} position={position}>
      <mesh
        position={[0, 0, 0]}
        scale={[1.8 * scale, 0.8 * scale, 1 * scale]}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color={cloudColor}
          transparent
          opacity={cloudOpacity}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <mesh
        position={[-0.8 * scale, 0.2 * scale, 0.2 * scale]}
        scale={[1.2 * scale, 0.7 * scale, 0.9 * scale]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color={cloudColor}
          transparent
          opacity={cloudOpacity * 0.9}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <mesh
        position={[0.9 * scale, 0.1 * scale, -0.1 * scale]}
        scale={[1.3 * scale, 0.6 * scale, 0.8 * scale]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color={cloudColor}
          transparent
          opacity={cloudOpacity * 0.95}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <mesh
        position={[0.3 * scale, 0.4 * scale, 0]}
        scale={[1 * scale, 0.5 * scale, 0.7 * scale]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          color={cloudColor}
          transparent
          opacity={cloudOpacity * 0.85}
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

// ─── Dynamic clouds based on cloud cover ─────────────────────────────────────

const CLOUD_SLOTS: { position: [number, number, number]; scale: number; speed: number; baseOpacity: number }[] = [
  { position: [-60, 30, 120], scale: 10, speed: 0.004, baseOpacity: 0.85 },
  { position: [70, 25, 150], scale: 12, speed: 0.003, baseOpacity: 0.8 },
  { position: [0, 40, 200], scale: 8, speed: 0.005, baseOpacity: 0.7 },
  { position: [-90, 35, 180], scale: 9, speed: 0.0035, baseOpacity: 0.75 },
  { position: [40, 45, 160], scale: 11, speed: 0.0045, baseOpacity: 0.8 },
  { position: [-30, 50, 220], scale: 7, speed: 0.006, baseOpacity: 0.65 },
  { position: [100, 38, 190], scale: 10, speed: 0.004, baseOpacity: 0.7 },
  { position: [-120, 42, 170], scale: 13, speed: 0.003, baseOpacity: 0.75 },
];

function DynamicClouds({
  hour,
  cloudCover,
  sunrise,
  sunset,
}: {
  hour: number;
  cloudCover: number;
  sunrise: number;
  sunset: number;
}) {
  // Cloud cover 0-100 -> show 1-8 clouds, opacity scales too
  const numClouds = Math.max(1, Math.min(8, Math.round((cloudCover / 100) * 8)));
  const opacityScale = 0.5 + (cloudCover / 100) * 0.5;

  return (
    <>
      {CLOUD_SLOTS.slice(0, numClouds).map((slot, i) => (
        <Cloud
          key={i}
          position={slot.position}
          scale={slot.scale}
          speed={slot.speed}
          opacity={slot.baseOpacity * opacityScale}
          hour={hour}
          sunrise={sunrise}
          sunset={sunset}
        />
      ))}
    </>
  );
}

// ─── Stars component (sunrise/sunset-aware) ──────────────────────────────────

function Stars({
  hour,
  sunrise = 6,
  sunset = 19,
}: {
  hour: number;
  sunrise?: number;
  sunset?: number;
}) {
  const starsRef = useRef<THREE.Points>(null);
  const nightStart = sunset + 1.5;
  const isNight = hour < sunrise || hour >= nightStart;

  const starOpacity = useMemo(() => {
    if (hour >= sunrise && hour < nightStart) return 0;
    if (hour >= sunrise - 1 && hour < sunrise) return 1 - (hour - (sunrise - 1));
    if (hour >= nightStart && hour < nightStart + 1) return hour - nightStart;
    return 0.9;
  }, [hour, sunrise, nightStart]);

  const [positions, sizes] = useMemo(() => {
    const count = 400;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = (Math.random() - 0.3) * Math.PI * 1.4;
      const phi = Math.random() * Math.PI * 0.5;
      const radius = 180 + Math.random() * 100;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * 0.9;
      pos[i * 3 + 1] = radius * Math.cos(phi) * 0.5 + 25;
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) + 140;

      siz[i] = Math.random() * 2.5 + 0.3;
    }

    return [pos, siz];
  }, []);

  useFrame((state) => {
    if (starsRef.current && isNight) {
      const sizes = starsRef.current.geometry.attributes.size;
      if (sizes) {
        for (let i = 0; i < sizes.count; i++) {
          (sizes.array as Float32Array)[i] =
            (Math.sin(state.clock.elapsedTime * 2 + i) * 0.3 + 1) *
            (1 + Math.random() * 0.5);
        }
        sizes.needsUpdate = true;
      }
    }
  });

  if (starOpacity <= 0) return null;

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        color="#ffffff"
        transparent
        opacity={starOpacity}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Sun component (sunrise/sunset-aware) ────────────────────────────────────

function Sun({
  position,
  hour,
  sunrise = 6,
  sunset = 19,
  cloudCover = 0,
}: {
  position: [number, number, number];
  hour: number;
  sunrise?: number;
  sunset?: number;
  cloudCover?: number;
}) {
  const sunColor = useMemo(() => {
    if (hour < sunrise + 1) return "#e8a050";
    if (hour < sunrise + 2)
      return lerpColor("#e8a050", "#FFD700", hour - (sunrise + 1)).getStyle();
    if (hour >= sunset)
      return lerpColor("#FFD700", "#e08040", (hour - sunset) / 2).getStyle();
    return "#FFD700";
  }, [hour, sunrise, sunset]);

  const glowColor = useMemo(() => {
    if (hour < sunrise + 2) return "#e8b878";
    if (hour >= sunset - 1) return "#e0a060";
    return "#FFA500";
  }, [hour, sunrise, sunset]);

  const visibility = useMemo(() => {
    if (hour < sunrise) return 0;
    if (hour < sunrise + 1) return hour - sunrise;
    if (hour >= sunset + 1) return Math.max(0, sunset + 2 - hour);
    return 1;
  }, [hour, sunrise, sunset]);

  // Dim the sun when overcast
  const overcastDim = 1 - (cloudCover / 100) * 0.5;

  if (visibility <= 0) return null;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial
          color={sunColor}
          transparent
          opacity={visibility * overcastDim}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={visibility * 0.3 * overcastDim}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[14, 32, 32]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={visibility * 0.15 * overcastDim}
        />
      </mesh>
    </group>
  );
}

// ─── Moon component (sunrise/sunset-aware) ───────────────────────────────────

function Moon({
  position,
  hour,
  sunrise = 6,
  sunset = 19,
}: {
  position: [number, number, number];
  hour: number;
  sunrise?: number;
  sunset?: number;
}) {
  const visibility = useMemo(() => {
    if (hour >= sunrise && hour < sunset) return 0;
    if (hour >= sunrise - 1 && hour < sunrise) return sunrise - hour;
    if (hour >= sunset && hour < sunset + 1.5) return (hour - sunset) / 1.5;
    return 1;
  }, [hour, sunrise, sunset]);

  if (visibility <= 0) return null;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#f5f5dc" transparent opacity={visibility} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#e8e8d0"
          transparent
          opacity={visibility * 0.25}
        />
      </mesh>
    </group>
  );
}

// ─── Rain particle system ────────────────────────────────────────────────────

function Rain({ intensity }: { intensity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = Math.min(2000, Math.round(intensity * 500 + 400));

  // Rain only outside the window. Parent group is at [0, -2, 80].
  // The room/window is at roughly world Z=0, so local Z = -80.
  // Keep rain at local Z >= -70 so it stays beyond the window.
  const { offsets, speeds, lengths } = useMemo(() => {
    const off = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const len = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      off[i * 3] = (Math.random() - 0.5) * 200;      // X: wide spread outdoors
      off[i * 3 + 1] = Math.random() * 60 + 10;      // Y: 10 to 70
      off[i * 3 + 2] = Math.random() * 200 - 70;     // Z: -70 to 130 (all outside window)
      spd[i] = 1.0 + Math.random() * 0.6 + intensity * 0.4;
      len[i] = 0.8 + Math.random() * 1.0 + intensity * 0.4;
    }
    return { offsets: off, speeds: spd, lengths: len };
  }, [count, intensity]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      dummy.position.set(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);
      dummy.scale.set(1, lengths[i], 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, offsets, lengths, dummy]);

  useFrame(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < count; i++) {
      offsets[i * 3 + 1] -= speeds[i];
      offsets[i * 3] += 0.02;

      if (offsets[i * 3 + 1] < -5) {
        offsets[i * 3 + 1] = Math.random() * 60 + 10;
        offsets[i * 3] = (Math.random() - 0.5) * 200;
        offsets[i * 3 + 2] = Math.random() * 200 - 70;
      }

      dummy.position.set(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);
      dummy.scale.set(1, lengths[i], 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const opacity = Math.min(0.65, 0.3 + intensity * 0.08);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <cylinderGeometry args={[0.015, 0.015, 1, 3, 1]} />
      <meshBasicMaterial
        color="#b0c4de"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

// ─── Snow particle system ────────────────────────────────────────────────────

function Snow({ intensity }: { intensity: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = Math.min(1000, Math.round(intensity * 300 + 100));

  const [positions, driftSeeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = Math.random() * 60 + 10;
      pos[i * 3 + 2] = Math.random() * 200 - 70;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    return [pos, seeds];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const speed = 0.15 + intensity * 0.1;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speed;
      arr[i * 3] += Math.sin(time * 0.5 + driftSeeds[i]) * 0.08;

      if (arr[i * 3 + 1] < -5) {
        arr[i * 3 + 1] = Math.random() * 60 + 10;
        arr[i * 3] = (Math.random() - 0.5) * 200;
        arr[i * 3 + 2] = Math.random() * 200 - 70;
      }
    }
    posAttr.needsUpdate = true;
  });

  const opacity = Math.min(1, 0.5 + intensity * 0.2);

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={1.5}
        color="#e8eaf0"
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Fog effect ──────────────────────────────────────────────────────────────

function WeatherFog({ active }: { active: boolean }) {
  const { scene } = useThree();

  useEffect(() => {
    if (active) {
      scene.fog = new THREE.FogExp2("#8899aa", 0.003);
    } else {
      scene.fog = null;
    }
    return () => {
      scene.fog = null;
    };
  }, [active, scene]);

  return null;
}

// ─── Overcast sky modifier ───────────────────────────────────────────────────
// Applies grey overlay proportional to cloud cover. Modifies the sky shader
// uniforms in-place. This is handled inside ArtisticSky via the overcast factor.

function applyOvercast(
  skyColors: ReturnType<typeof getSkyColors>,
  cloudCover: number,
  weatherCondition: WeatherCondition
) {
  // Factor: how much to grey out the sky (0 = clear, 1 = fully overcast)
  let greyFactor = 0;
  if (cloudCover > 40) {
    greyFactor = (cloudCover - 40) / 60; // 0 at 40%, 1 at 100%
  }
  // Extra dimming for active precipitation
  if (
    weatherCondition === "rain" ||
    weatherCondition === "heavyRain" ||
    weatherCondition === "thunderstorm"
  ) {
    greyFactor = Math.min(1, greyFactor + 0.25);
  }
  if (weatherCondition === "snow") {
    greyFactor = Math.min(1, greyFactor + 0.15);
  }

  if (greyFactor <= 0) return skyColors;

  const grey = new THREE.Color("#7a8898");
  const greyDark = new THREE.Color("#4a5868");

  return {
    top: skyColors.top.clone().lerp(greyDark, greyFactor * 0.6),
    middle: skyColors.middle.clone().lerp(grey, greyFactor * 0.5),
    bottom: skyColors.bottom.clone().lerp(grey, greyFactor * 0.4),
    ambient: skyColors.ambient * (1 - greyFactor * 0.35),
    sunsetColor: skyColors.sunsetColor
      .clone()
      .lerp(grey, greyFactor * 0.5),
    sunsetIntensity: skyColors.sunsetIntensity * (1 - greyFactor * 0.7),
  };
}

// ─── Main ArtisticSky component ──────────────────────────────────────────────

export interface ArtisticSkyProps {
  sunrise?: number;
  sunset?: number;
  weather?: InterpolatedWeather;
}

export function ArtisticSky({
  sunrise = 6,
  sunset = 19,
  weather,
}: ArtisticSkyProps) {
  const skyRef = useRef<THREE.Mesh>(null);
  const [hour, setHour] = useState(getPSTHour());

  const currentWeather: InterpolatedWeather = weather ?? {
    weatherCondition: "clear",
    cloudCover: 0,
    temperature: 15,
    rain: 0,
    snowfall: 0,
    windSpeed: 0,
  };

  // URL parameter overrides for testing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const testHour = params.get("hour");
      if (testHour !== null) {
        const parsedHour = parseFloat(testHour);
        if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour < 24) {
          setHour(parsedHour);
          console.log(
            `Testing time: ${Math.floor(parsedHour)}:${Math.round((parsedHour % 1) * 60)
              .toString()
              .padStart(2, "0")} (${getTimeOfDay(parsedHour, sunrise, sunset)})`
          );
          return;
        }
      }
    }

    const interval = setInterval(() => {
      setHour(getPSTHour());
    }, 60000);
    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  // Compute sky colors with overcast applied
  const rawSkyColors = getSkyColors(hour, sunrise, sunset);
  const skyColors = applyOvercast(
    rawSkyColors,
    currentWeather.cloudCover,
    currentWeather.weatherCondition
  );
  const grassColors = getGrassColors(hour, sunrise, sunset);
  const sunPosition = getSunPosition(hour, sunrise, sunset);
  const moonPosition = getMoonPosition(hour, sunrise, sunset);

  // Determine which weather effects to show
  const showRain =
    currentWeather.weatherCondition === "rain" ||
    currentWeather.weatherCondition === "heavyRain" ||
    currentWeather.weatherCondition === "thunderstorm";
  const showSnow = currentWeather.weatherCondition === "snow";
  const showFog = currentWeather.weatherCondition === "fog";
  const rainIntensity =
    currentWeather.weatherCondition === "heavyRain"
      ? Math.min(5, currentWeather.rain)
      : currentWeather.rain;

  // Sky shader material
  const skyMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: skyColors.top },
        middleColor: { value: skyColors.middle },
        bottomColor: { value: skyColors.bottom },
        sunsetColor: { value: skyColors.sunsetColor },
        sunsetIntensity: { value: skyColors.sunsetIntensity },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 middleColor;
        uniform vec3 bottomColor;
        uniform vec3 sunsetColor;
        uniform float sunsetIntensity;
        varying vec3 vWorldPosition;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }

        void main() {
          float height = normalize(vWorldPosition).y;

          vec3 color;
          if (height < 0.0) {
            color = bottomColor;
          } else if (height < 0.4) {
            color = mix(bottomColor, middleColor, height / 0.4);
          } else {
            color = mix(middleColor, topColor, (height - 0.4) / 0.6);
          }

          if (sunsetIntensity > 0.0) {
            vec2 streakUV = vec2(vWorldPosition.x * 0.003, vWorldPosition.y * 0.025);
            float streaks = fbm(streakUV * 3.0);
            streaks = smoothstep(0.3, 0.7, streaks);

            vec2 fineUV = vec2(vWorldPosition.x * 0.006, vWorldPosition.y * 0.04);
            float fineStreaks = fbm(fineUV * 5.0 + vec2(42.0, 17.0));
            fineStreaks = smoothstep(0.35, 0.65, fineStreaks);

            float combinedStreaks = mix(streaks, fineStreaks, 0.4);
            float heightMask = smoothstep(-0.1, 0.05, height) * smoothstep(0.45, 0.15, height);

            color = mix(color, sunsetColor, combinedStreaks * sunsetIntensity * heightMask);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, [skyColors]);

  // Grass uniforms
  const grassUniforms = useMemo(
    () => ({
      nearColor: { value: new THREE.Color(grassColors.near) },
      midColor: { value: new THREE.Color(grassColors.mid) },
      farColor: { value: new THREE.Color(grassColors.far) },
      horizonColor: { value: new THREE.Color(grassColors.horizon) },
    }),
    [grassColors]
  );

  return (
    <group position={[0, -2, 80]} scale={[1, 1, 1]}>
      {/* Ambient light */}
      <ambientLight intensity={skyColors.ambient * 0.5} />

      {/* Sky dome */}
      <mesh ref={skyRef} scale={[300, 150, 300]} position={[0, 40, 100]}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={skyMaterial} attach="material" />
      </mesh>

      {/* Sun */}
      <Sun
        position={sunPosition}
        hour={hour}
        sunrise={sunrise}
        sunset={sunset}
        cloudCover={currentWeather.cloudCover}
      />

      {/* Moon */}
      <Moon
        position={moonPosition}
        hour={hour}
        sunrise={sunrise}
        sunset={sunset}
      />

      {/* Stars */}
      <Stars hour={hour} sunrise={sunrise} sunset={sunset} />

      {/* Ground/Grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -15, 150]}>
        <planeGeometry args={[600, 400, 1, 1]} />
        <shaderMaterial
          uniforms={grassUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 nearColor;
            uniform vec3 midColor;
            uniform vec3 farColor;
            uniform vec3 horizonColor;
            varying vec2 vUv;

            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float hash2(vec2 p) {
              return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453);
            }

            float noise(vec2 p) {
              vec2 i = floor(p);
              vec2 f = fract(p);
              f = f * f * (3.0 - 2.0 * f);
              float a = hash(i);
              float b = hash(i + vec2(1.0, 0.0));
              float c = hash(i + vec2(0.0, 1.0));
              float d = hash(i + vec2(1.0, 1.0));
              return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }

            float fbm(vec2 p) {
              float value = 0.0;
              float amplitude = 0.5;
              float frequency = 1.0;
              for (int i = 0; i < 4; i++) {
                value += amplitude * noise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
              }
              return value;
            }

            float grassBlades(vec2 p) {
              float scale = 80.0;
              vec2 cell = floor(p * scale);
              vec2 local = fract(p * scale);

              float randHeight = hash(cell) * 0.4 + 0.6;
              float randLean = (hash2(cell) - 0.5) * 0.3;

              float blade = smoothstep(0.45 + randLean, 0.5, local.x) *
                           smoothstep(0.55 + randLean, 0.5, local.x);
              blade *= smoothstep(0.0, randHeight, local.y);

              return blade * 0.15;
            }

            void main() {
              float dist = vUv.y;

              vec3 color;
              float t1 = smoothstep(0.0, 0.35, dist);
              float t2 = smoothstep(0.35, 0.65, dist);
              float t3 = smoothstep(0.65, 1.0, dist);

              color = mix(nearColor, midColor, t1);
              color = mix(color, farColor, t2);
              color = mix(color, horizonColor, t3);

              float microNoise = noise(vUv * 400.0) * 0.04;
              float fineNoise = noise(vUv * 150.0) * 0.06;
              float medNoise = fbm(vUv * 40.0) * 0.08;
              float largeNoise = fbm(vUv * 12.0) * 0.06;
              float megaNoise = fbm(vUv * 4.0) * 0.04;

              float noiseIntensity = mix(1.0, 0.3, smoothstep(0.0, 0.8, dist));
              float totalNoise = (microNoise + fineNoise + medNoise + largeNoise + megaNoise - 0.14) * noiseIntensity;

              float bladePattern = grassBlades(vUv) * mix(1.0, 0.0, smoothstep(0.0, 0.5, dist));

              float patchNoise = fbm(vUv * 8.0);
              vec3 patchVariation = vec3(
                (patchNoise - 0.5) * 0.08,
                (patchNoise - 0.5) * 0.12,
                (patchNoise - 0.5) * 0.04
              );

              float dryPatch = smoothstep(0.6, 0.7, fbm(vUv * 15.0 + vec2(42.0, 17.0)));
              vec3 dryColor = vec3(0.05, -0.02, -0.04) * dryPatch * 0.5;

              float highlight = smoothstep(0.45, 0.75, fbm(vUv * 100.0)) * 0.06;
              highlight *= mix(1.0, 0.3, smoothstep(0.0, 0.4, dist));

              color = color + vec3(totalNoise) + patchVariation + dryColor;
              color = color + vec3(bladePattern * 0.5);
              color = color + vec3(highlight);

              color = mix(color * 0.92, color, smoothstep(0.0, 0.12, dist));

              float atmosFade = smoothstep(0.7, 1.0, dist);
              color = mix(color, horizonColor * 1.1, atmosFade * 0.3);

              color = clamp(color, 0.0, 1.0);

              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>

      {/* Dynamic Clouds */}
      <DynamicClouds
        hour={hour}
        cloudCover={currentWeather.cloudCover}
        sunrise={sunrise}
        sunset={sunset}
      />

      {/* Weather Effects */}
      {showRain && <Rain intensity={rainIntensity} />}
      {showSnow && <Snow intensity={currentWeather.snowfall} />}
      <WeatherFog active={showFog} />
    </group>
  );
}
