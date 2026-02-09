"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Get current time in PST and return hour as decimal (0-24)
export function getPSTHour(): number {
  const now = new Date();
  const pstOffset = -8; // PST is UTC-8
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const pst = new Date(utc + 3600000 * pstOffset);
  return pst.getHours() + pst.getMinutes() / 60;
}

// Smooth lerp function for colors
function lerpColor(color1: string, color2: string, t: number): THREE.Color {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t);
}

// Get interpolated sky colors based on exact hour (smooth transitions)
export function getSkyColors(hour: number) {
  // Key times and their colors (blue-dominant sky, golden-amber accents near horizon during sunset/sunrise)
  const timePoints = [
    { hour: 0,    top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },    // Midnight
    { hour: 5,    top: "#0a1628", middle: "#162442", bottom: "#1e3050", ambient: 0.15, sunsetColor: "#c89060", sunsetIntensity: 0.08 },   // Late night (faint warm hint)
    { hour: 6,    top: "#4a6fa5", middle: "#8aa8c8", bottom: "#d4b088", ambient: 0.4,  sunsetColor: "#d4a060", sunsetIntensity: 0.5 },    // Dawn - blue sky, golden horizon
    { hour: 7,    top: "#6ba3d6", middle: "#a0c0d8", bottom: "#d8c8a8", ambient: 0.6,  sunsetColor: "#d8b878", sunsetIntensity: 0.2 },    // Early morning - warming up
    { hour: 10,   top: "#87CEEB", middle: "#a8d4e8", bottom: "#c8e6f0", ambient: 0.9,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },    // Mid-morning
    { hour: 12,   top: "#87CEEB", middle: "#87CEEB", bottom: "#b8dff5", ambient: 1.0,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },    // Noon
    { hour: 14,   top: "#87CEEB", middle: "#87CEEB", bottom: "#b8dff5", ambient: 1.0,  sunsetColor: "#d8c090", sunsetIntensity: 0.0 },    // Afternoon
    { hour: 17,   top: "#5a90c0", middle: "#88a8c0", bottom: "#d0b890", ambient: 0.7,  sunsetColor: "#d0a060", sunsetIntensity: 0.25 },   // Late afternoon - blue with warm horizon
    { hour: 18,   top: "#4070a8", middle: "#6890b0", bottom: "#c8a070", ambient: 0.5,  sunsetColor: "#d89050", sunsetIntensity: 0.55 },   // Sunset - deeper blue, golden-amber streaks
    { hour: 19,   top: "#283c6a", middle: "#3c5880", bottom: "#687888", ambient: 0.35, sunsetColor: "#a08060", sunsetIntensity: 0.25 },   // Dusk - dark blue, fading warm glow
    { hour: 19.5, top: "#162850", middle: "#1e3458", bottom: "#2a3c5a", ambient: 0.22, sunsetColor: "#3a4868", sunsetIntensity: 0.05 },   // Late dusk - deep blue
    { hour: 20,   top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },    // Night
    { hour: 24,   top: "#0a1628", middle: "#162442", bottom: "#1a2d4d", ambient: 0.15, sunsetColor: "#162442", sunsetIntensity: 0.0 },    // Midnight
  ];

  // Find the two time points to interpolate between
  let prevPoint = timePoints[0];
  let nextPoint = timePoints[1];
  
  for (let i = 0; i < timePoints.length - 1; i++) {
    if (hour >= timePoints[i].hour && hour < timePoints[i + 1].hour) {
      prevPoint = timePoints[i];
      nextPoint = timePoints[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const t = (hour - prevPoint.hour) / (nextPoint.hour - prevPoint.hour);
  
  return {
    top: lerpColor(prevPoint.top, nextPoint.top, t),
    middle: lerpColor(prevPoint.middle, nextPoint.middle, t),
    bottom: lerpColor(prevPoint.bottom, nextPoint.bottom, t),
    ambient: prevPoint.ambient + (nextPoint.ambient - prevPoint.ambient) * t,
    sunsetColor: lerpColor(prevPoint.sunsetColor, nextPoint.sunsetColor, t),
    sunsetIntensity: prevPoint.sunsetIntensity + (nextPoint.sunsetIntensity - prevPoint.sunsetIntensity) * t,
  };
}

// Get interpolated grass colors
function getGrassColors(hour: number) {
  const isNight = hour < 6 || hour >= 20;
  const isDawn = hour >= 6 && hour < 8;
  const isDusk = hour >= 18 && hour < 20;
  
  if (isNight) {
    return { near: "#1a2d1a", mid: "#1e331e", far: "#243324", horizon: "#2a3d2a" };
  } else if (isDawn) {
    const t = (hour - 6) / 2;
    return {
      near: lerpColor("#1a2d1a", "#3d6b1e", t).getStyle(),
      mid: lerpColor("#1e331e", "#4a7c23", t).getStyle(),
      far: lerpColor("#243324", "#5a8a35", t).getStyle(),
      horizon: lerpColor("#2a3d2a", "#7aa85a", t).getStyle(),
    };
  } else if (isDusk) {
    const t = (hour - 18) / 2;
    return {
      near: lerpColor("#3d6b1e", "#1a2d1a", t).getStyle(),
      mid: lerpColor("#4a7c23", "#1e331e", t).getStyle(),
      far: lerpColor("#5a8a35", "#243324", t).getStyle(),
      horizon: lerpColor("#7aa85a", "#2a3d2a", t).getStyle(),
    };
  }
  return { near: "#3d6b1e", mid: "#4a7c23", far: "#5a8a35", horizon: "#7aa85a" };
}

// Get time of day for discrete states
function getTimeOfDay(hour: number): "night" | "dawn" | "day" | "dusk" {
  if (hour < 6 || hour >= 20) return "night";
  if (hour < 8) return "dawn";
  if (hour < 18) return "day";
  return "dusk";
}

// Sun position - always visible in window, moves in arc
function getSunPosition(hour: number): [number, number, number] {
  // Sun visible from 6am to 7pm, positioned to always show in window
  if (hour < 6 || hour >= 20) return [0, -100, 150]; // Below horizon
  
  // Progress from 6am (0) to 7pm (1)
  const progress = (hour - 6) / 13;
  
  // Arc: starts right, peaks center, ends left - but constrained to window view
  const angle = progress * Math.PI;
  const x = Math.cos(angle) * 25; // Reduced x range to stay in window
  const y = Math.sin(angle) * 30 + 15; // Y from 15 to 45
  const z = 120; // Closer to camera
  
  return [x, y, z];
}

// Moon position - rises during dusk, visible all night
function getMoonPosition(hour: number): [number, number, number] {
  // Moon visible from 7pm (dusk) to 6am
  if (hour >= 6 && hour < 19) return [0, -100, 150]; // Below horizon
  
  // Progress from 7pm (0) to 6am (1)
  let progress: number;
  if (hour >= 19) {
    progress = (hour - 19) / 11; // 7pm-midnight: 0-0.45
  } else {
    progress = (hour + 5) / 11; // midnight-6am: 0.45-1.0
  }
  
  const angle = progress * Math.PI;
  const x = Math.cos(angle) * 20; // Keep centered in window
  const y = Math.sin(angle) * 25 + 20;
  const z = 120;
  
  return [x, y, z];
}

interface CloudProps {
  position: [number, number, number];
  scale?: number;
  speed?: number;
  opacity?: number;
  hour: number;
}

function Cloud({ position, scale = 1, speed = 0.02, opacity = 0.85, hour }: CloudProps) {
  const meshRef = useRef<THREE.Group>(null);
  const initialX = position[0];
  const timeOfDay = getTimeOfDay(hour);
  
  // Cloud colors based on time - smooth transition
  const cloudColor = useMemo(() => {
    if (hour < 6 || hour >= 20) return "#3a4a5a"; // Night
    if (hour < 8) {
      const t = (hour - 6) / 2;
      return lerpColor("#3a4a5a", "#fff8f0", t).getStyle();
    }
    if (hour >= 18) {
      const t = (hour - 18) / 2;
      return lerpColor("#ffccaa", "#3a4a5a", t).getStyle();
    }
    if (hour >= 17) {
      const t = (hour - 17) / 1;
      return lerpColor("#fff8f0", "#ffccaa", t).getStyle();
    }
    return "#fff8f0"; // Day
  }, [hour]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = initialX + Math.sin(state.clock.elapsedTime * speed) * 2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.3;
    }
  });

  const cloudOpacity = timeOfDay === "night" ? opacity * 0.4 : opacity;

  return (
    <group ref={meshRef} position={position}>
      <mesh position={[0, 0, 0]} scale={[1.8 * scale, 0.8 * scale, 1 * scale]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={cloudOpacity} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[-0.8 * scale, 0.2 * scale, 0.2 * scale]} scale={[1.2 * scale, 0.7 * scale, 0.9 * scale]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={cloudOpacity * 0.9} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.9 * scale, 0.1 * scale, -0.1 * scale]} scale={[1.3 * scale, 0.6 * scale, 0.8 * scale]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={cloudOpacity * 0.95} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0.3 * scale, 0.4 * scale, 0]} scale={[1 * scale, 0.5 * scale, 0.7 * scale]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={cloudColor} transparent opacity={cloudOpacity * 0.85} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// Stars component for nighttime
function Stars({ hour }: { hour: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const isNight = hour < 6 || hour >= 20;
  
  // Star opacity fades in/out during transitions
  const starOpacity = useMemo(() => {
    if (hour >= 6 && hour < 20) return 0;
    if (hour >= 5 && hour < 6) return 1 - (hour - 5);
    if (hour >= 20 && hour < 21) return hour - 20;
    return 0.9;
  }, [hour]);
  
  const [positions, sizes] = useMemo(() => {
    const count = 400; // More stars
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Position stars across more of the sky, with more on the right side
      const theta = (Math.random() - 0.3) * Math.PI * 1.4; // Biased toward right side
      const phi = Math.random() * Math.PI * 0.5; // Upper sky
      const radius = 180 + Math.random() * 100; // More depth variation
      
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * 0.9; // Wider x spread
      pos[i * 3 + 1] = radius * Math.cos(phi) * 0.5 + 25; // Spread across height
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) + 140;
      
      // Vary star sizes for more natural look
      siz[i] = Math.random() * 2.5 + 0.3;
    }
    
    return [pos, siz];
  }, []);

  useFrame((state) => {
    if (starsRef.current && isNight) {
      const sizes = starsRef.current.geometry.attributes.size;
      if (sizes) {
        for (let i = 0; i < sizes.count; i++) {
          (sizes.array as Float32Array)[i] = (Math.sin(state.clock.elapsedTime * 2 + i) * 0.3 + 1) * (1 + Math.random() * 0.5);
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
      <pointsMaterial size={2} color="#ffffff" transparent opacity={starOpacity} sizeAttenuation />
    </points>
  );
}

// Sun component with glow
function Sun({ position, hour }: { position: [number, number, number]; hour: number }) {
  const timeOfDay = getTimeOfDay(hour);
  
  // Sun color changes through day (golden-amber tones at sunset)
  const sunColor = useMemo(() => {
    if (hour < 7) return "#e8a050"; // Dawn golden
    if (hour < 8) return lerpColor("#e8a050", "#FFD700", hour - 7).getStyle();
    if (hour >= 18) return lerpColor("#FFD700", "#e08040", (hour - 18) / 2).getStyle(); // Gold to deep amber
    return "#FFD700"; // Midday gold
  }, [hour]);
  
  const glowColor = useMemo(() => {
    if (hour < 8) return "#e8b878";
    if (hour >= 17) return "#e0a060"; // Warm amber glow at sunset
    return "#FFA500";
  }, [hour]);
  
  // Sun visibility (fade in at dawn, fade out at dusk)
  const visibility = useMemo(() => {
    if (hour < 6) return 0;
    if (hour < 7) return hour - 6;
    if (hour >= 19) return Math.max(0, 20 - hour);
    return 1;
  }, [hour]);
  
  if (visibility <= 0) return null;
  
  return (
    <group position={position}>
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color={sunColor} transparent opacity={visibility} />
      </mesh>
      {/* Sun glow */}
      <mesh>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={visibility * 0.3} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[14, 32, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={visibility * 0.15} />
      </mesh>
    </group>
  );
}

// Moon component
function Moon({ position, hour }: { position: [number, number, number]; hour: number }) {
  // Moon visibility - starts fading in during dusk (hour 19)
  const visibility = useMemo(() => {
    if (hour >= 6 && hour < 19) return 0;
    if (hour >= 5 && hour < 6) return 6 - hour;
    if (hour >= 19 && hour < 20.5) return (hour - 19) / 1.5; // Gradual fade-in over 1.5 hours
    return 1;
  }, [hour]);
  
  if (visibility <= 0) return null;
  
  return (
    <group position={position}>
      {/* Moon */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#f5f5dc" transparent opacity={visibility} />
      </mesh>
      {/* Moon glow */}
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#e8e8d0" transparent opacity={visibility * 0.25} />
      </mesh>
    </group>
  );
}

export function ArtisticSky() {
  const skyRef = useRef<THREE.Mesh>(null);
  const [hour, setHour] = useState(getPSTHour());
  
  const skyColors = getSkyColors(hour);
  const grassColors = getGrassColors(hour);
  const sunPosition = getSunPosition(hour);
  const moonPosition = getMoonPosition(hour);
  
  // Check for URL parameter to override time (for testing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testHour = params.get('hour');
      if (testHour !== null) {
        const parsedHour = parseFloat(testHour);
        if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour < 24) {
          setHour(parsedHour);
          console.log(`🌅 Testing time: ${Math.floor(parsedHour)}:${Math.round((parsedHour % 1) * 60).toString().padStart(2, '0')} (${getTimeOfDay(parsedHour)})`);
          return;
        }
      }
    }
    
    const interval = setInterval(() => {
      setHour(getPSTHour());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Create gradient sky material with interpolated colors and sunset streaks
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

        // Hash function for noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        // Smooth value noise
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

        // Fractal Brownian Motion
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

          // Base sky gradient (unchanged)
          vec3 color;
          if (height < 0.0) {
            color = bottomColor;
          } else if (height < 0.4) {
            color = mix(bottomColor, middleColor, height / 0.4);
          } else {
            color = mix(middleColor, topColor, (height - 0.4) / 0.6);
          }

          // --- Sunset/sunrise streaks ---
          if (sunsetIntensity > 0.0) {
            // Horizontally-stretched noise for wide streak shapes
            vec2 streakUV = vec2(vWorldPosition.x * 0.003, vWorldPosition.y * 0.025);
            float streaks = fbm(streakUV * 3.0);
            streaks = smoothstep(0.3, 0.7, streaks);

            // Secondary finer streaks at a different scale for wispy detail
            vec2 fineUV = vec2(vWorldPosition.x * 0.006, vWorldPosition.y * 0.04);
            float fineStreaks = fbm(fineUV * 5.0 + vec2(42.0, 17.0));
            fineStreaks = smoothstep(0.35, 0.65, fineStreaks);

            // Combine broad and fine streaks
            float combinedStreaks = mix(streaks, fineStreaks, 0.4);

            // Height mask: confine streaks to lower sky near horizon (realistic)
            float heightMask = smoothstep(-0.1, 0.05, height) * smoothstep(0.45, 0.15, height);

            // Blend sunset streaks into base color
            color = mix(color, sunsetColor, combinedStreaks * sunsetIntensity * heightMask);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, [skyColors]);

  // Grass uniforms
  const grassUniforms = useMemo(() => ({
    nearColor: { value: new THREE.Color(grassColors.near) },
    midColor: { value: new THREE.Color(grassColors.mid) },
    farColor: { value: new THREE.Color(grassColors.far) },
    horizonColor: { value: new THREE.Color(grassColors.horizon) },
  }), [grassColors]);

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
      <Sun position={sunPosition} hour={hour} />
      
      {/* Moon */}
      <Moon position={moonPosition} hour={hour} />
      
      {/* Stars */}
      <Stars hour={hour} />
      
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
            
            // Hash functions for noise
            float hash(vec2 p) {
              return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }
            
            float hash2(vec2 p) {
              return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453);
            }
            
            // Smooth value noise
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
            
            // Fractal Brownian Motion for more natural noise
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
            
            // Grass blade-like pattern
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
              
              // Base color gradient with power curve for smoother transition
              vec3 color;
              float t1 = smoothstep(0.0, 0.35, dist);
              float t2 = smoothstep(0.35, 0.65, dist);
              float t3 = smoothstep(0.65, 1.0, dist);
              
              color = mix(nearColor, midColor, t1);
              color = mix(color, farColor, t2);
              color = mix(color, horizonColor, t3);
              
              // Multi-scale noise for natural variation
              float microNoise = noise(vUv * 400.0) * 0.04;
              float fineNoise = noise(vUv * 150.0) * 0.06;
              float medNoise = fbm(vUv * 40.0) * 0.08;
              float largeNoise = fbm(vUv * 12.0) * 0.06;
              float megaNoise = fbm(vUv * 4.0) * 0.04;
              
              // Combine noise layers with distance-based intensity
              float noiseIntensity = mix(1.0, 0.3, smoothstep(0.0, 0.8, dist));
              float totalNoise = (microNoise + fineNoise + medNoise + largeNoise + megaNoise - 0.14) * noiseIntensity;
              
              // Grass blade patterns (stronger in foreground)
              float bladePattern = grassBlades(vUv) * mix(1.0, 0.0, smoothstep(0.0, 0.5, dist));
              
              // Color variation patches (different grass types/conditions)
              float patchNoise = fbm(vUv * 8.0);
              vec3 patchVariation = vec3(
                (patchNoise - 0.5) * 0.08,
                (patchNoise - 0.5) * 0.12,
                (patchNoise - 0.5) * 0.04
              );
              
              // Subtle yellow/brown patches for realism
              float dryPatch = smoothstep(0.6, 0.7, fbm(vUv * 15.0 + vec2(42.0, 17.0)));
              vec3 dryColor = vec3(0.05, -0.02, -0.04) * dryPatch * 0.5;
              
              // Subtle highlights (sun catching grass tips)
              float highlight = smoothstep(0.5, 0.8, fbm(vUv * 100.0)) * 0.04;
              highlight *= mix(1.0, 0.2, smoothstep(0.0, 0.4, dist));
              
              // Combine all effects
              color = color + vec3(totalNoise) + patchVariation + dryColor;
              color = color + vec3(bladePattern * 0.5);
              color = color + vec3(highlight);
              
              // Subtle vignette/darkening at very close range
              color = mix(color * 0.85, color, smoothstep(0.0, 0.15, dist));
              
              // Atmospheric fade towards horizon
              float atmosFade = smoothstep(0.7, 1.0, dist);
              color = mix(color, horizonColor * 1.1, atmosFade * 0.3);
              
              // Clamp to valid range
              color = clamp(color, 0.0, 1.0);
              
              gl_FragColor = vec4(color, 1.0);
            }
          `}
        />
      </mesh>
      
      {/* Clouds */}
      <Cloud position={[-60, 30, 120]} scale={10} speed={0.004} opacity={0.85} hour={hour} />
      <Cloud position={[70, 25, 150]} scale={12} speed={0.003} opacity={0.8} hour={hour} />
      <Cloud position={[0, 40, 200]} scale={8} speed={0.005} opacity={0.7} hour={hour} />
    </group>
  );
}
