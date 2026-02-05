"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { Room } from "./Room";
import { CameraController, ViewType } from "./CameraController";
import { ArtisticSky, getPSTHour, getSkyColors } from "./ProceduralSky";

// Dynamic room lighting component
function RoomLighting() {
  const [hour, setHour] = useState(getPSTHour());
  
  // Check for URL test parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const testHour = params.get('hour');
      if (testHour !== null) {
        const parsedHour = parseFloat(testHour);
        if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour < 24) {
          setHour(parsedHour);
          return;
        }
      }
    }
    
    const interval = setInterval(() => {
      setHour(getPSTHour());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const skyColors = getSkyColors(hour);
  const baseIntensity = skyColors.ambient;
  
  // Light color based on time of day
  const isNight = hour < 6 || hour >= 20;
  const isDawn = hour >= 6 && hour < 8;
  const isDusk = hour >= 18 && hour < 20;
  
  // Warm light during dawn/dusk, cool during day, blue tint at night
  let lightColor = "#ffffff";
  if (isNight) {
    lightColor = "#4466aa"; // Cool blue night
  } else if (isDawn) {
    lightColor = "#ffcc99"; // Warm orange
  } else if (isDusk) {
    lightColor = "#ffaa77"; // Warm sunset
  } else if (hour >= 10 && hour <= 14) {
    lightColor = "#ffffff"; // Bright white midday
  } else {
    lightColor = "#fff8e8"; // Slightly warm daylight
  }
  
  return (
    <>
      {/* Main directional light simulating sunlight */}
      <directionalLight
        position={[5, 10, -5]}
        intensity={baseIntensity * 1.5}
        color={lightColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* Fill light from opposite direction */}
      <directionalLight
        position={[-3, 5, 3]}
        intensity={baseIntensity * 0.3}
        color={lightColor}
      />
      {/* Ambient fill */}
      <ambientLight intensity={baseIntensity * 0.4} color={lightColor} />
      {/* Point light to simulate window light coming in */}
      <pointLight
        position={[0, 2, 2]}
        intensity={baseIntensity * 0.8}
        color={lightColor}
        distance={8}
        decay={2}
      />
    </>
  );
}

export function Scene() {
  const [currentView, setCurrentView] = useState<ViewType>("room");
  const [showBackButton, setShowBackButton] = useState(false);

  // Effect to manage back button visibility
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (currentView === "monitor") {
      // Wait for zoom animation to finish before showing button
      timeoutId = setTimeout(() => {
        setShowBackButton(true);
      }, 800);
    } else {
      // Hide immediately when leaving monitor view
      setShowBackButton(false);
    }

    return () => clearTimeout(timeoutId);
  }, [currentView]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 1.5, -4], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <ArtisticSky />
          <RoomLighting />
          <Room currentView={currentView} onViewChange={setCurrentView} />
          <Environment preset="apartment" environmentIntensity={0.3} />
        </Suspense>
        <CameraController view={currentView} />
      </Canvas>

      {/* Static 2D Overlay for Back Button */}
      {/* Only show when both currentView is monitor AND delay has passed */}
      {showBackButton && currentView === "monitor" && (
        <div style={{ 
          position: 'absolute', 
          bottom: '5rem', 
          right: '2rem', 
          zIndex: 50,
          opacity: 1,
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-white text-base font-semibold 
                       cursor-pointer transition-all duration-200 hover:bg-black/90 hover:scale-105 whitespace-nowrap shadow-xl"
            onClick={() => setCurrentView("room")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to Room
          </button>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

