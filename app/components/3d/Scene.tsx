"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { Room, GUITAR_FOCUS } from "./Room";
import { CameraController, ViewType } from "./CameraController";
import { Home, Monitor as MonitorIcon, Music } from "lucide-react";
import type { FocusTarget } from "./CameraController";
import { ArtisticSky, getPSTHour, getSkyColors, getTimeOfDay } from "./ProceduralSky";
import { useWeather, getWeatherForHour } from "../../hooks/useWeather";
import type { WeatherCondition } from "../../hooks/useWeather";

// Dynamic room lighting component (now weather-aware)
function RoomLighting({
  sunrise = 6,
  sunset = 19,
  weatherCondition = "clear" as WeatherCondition,
  cloudCover = 0,
}: {
  sunrise?: number;
  sunset?: number;
  weatherCondition?: WeatherCondition;
  cloudCover?: number;
}) {
  const [hour, setHour] = useState(getPSTHour());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const testHour = params.get("hour");
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

  const skyColors = getSkyColors(hour, sunrise, sunset);
  const baseIntensity = skyColors.ambient;

  const timeOfDay = getTimeOfDay(hour, sunrise, sunset);

  let lightColor = "#ffffff";
  if (timeOfDay === "night") {
    lightColor = "#4466aa";
  } else if (timeOfDay === "dawn") {
    lightColor = "#ffcc99";
  } else if (timeOfDay === "dusk") {
    lightColor = "#ffaa77";
  } else if (hour >= 10 && hour <= 14) {
    lightColor = "#ffffff";
  } else {
    lightColor = "#fff8e8";
  }

  // Weather-based intensity adjustments
  let weatherIntensityMod = 1;
  let weatherColorShift = lightColor;

  if (
    weatherCondition === "rain" ||
    weatherCondition === "heavyRain" ||
    weatherCondition === "thunderstorm"
  ) {
    weatherIntensityMod = 0.6;
    weatherColorShift = "#ccccdd";
  } else if (weatherCondition === "overcast" || cloudCover > 70) {
    weatherIntensityMod = 0.75;
    weatherColorShift = "#dddde8";
  } else if (weatherCondition === "fog") {
    weatherIntensityMod = 0.7;
    weatherColorShift = "#bbbbcc";
  } else if (weatherCondition === "snow") {
    weatherIntensityMod = 0.7;
    weatherColorShift = "#d8d8e8";
  }

  // Blend the weather color shift with the time-of-day color
  const isActiveWeather = weatherIntensityMod < 1;
  const finalColor = isActiveWeather ? weatherColorShift : lightColor;
  const finalIntensity = baseIntensity * weatherIntensityMod;

  // Fog: reduce point light distance
  const pointDistance = weatherCondition === "fog" ? 5 : 8;

  return (
    <>
      <directionalLight
        position={[5, 10, -5]}
        intensity={finalIntensity * 1.5}
        color={finalColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-3, 5, 3]}
        intensity={finalIntensity * 0.3}
        color={finalColor}
      />
      <ambientLight
        intensity={finalIntensity * (weatherCondition === "fog" ? 0.6 : 0.4)}
        color={finalColor}
      />
      <pointLight
        position={[0, 2, 2]}
        intensity={finalIntensity * 0.8}
        color={finalColor}
        distance={pointDistance}
        decay={2}
      />
    </>
  );
}

// Wrapper that lives inside the Canvas and provides weather to 3D components
function SceneContent({
  currentView,
  onViewChange,
  focusTarget,
  onFocusChange,
  hoveredNav,
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  focusTarget: FocusTarget | null;
  onFocusChange: (target: FocusTarget | null) => void;
  hoveredNav: string | null;
}) {
  const { data: weatherData } = useWeather();
  const [hour, setHour] = useState(getPSTHour());

  // URL overrides for weather testing
  const [weatherOverride, setWeatherOverride] = useState<WeatherCondition | null>(null);
  const [sunriseOverride, setSunriseOverride] = useState<number | null>(null);
  const [sunsetOverride, setSunsetOverride] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      // Weather override: ?weather=rain
      const testWeather = params.get("weather");
      if (testWeather) {
        const valid: WeatherCondition[] = [
          "clear", "cloudy", "overcast", "rain", "heavyRain", "snow", "fog", "thunderstorm",
        ];
        if (valid.includes(testWeather as WeatherCondition)) {
          setWeatherOverride(testWeather as WeatherCondition);
        }
      }

      // Sunrise/sunset overrides: ?sunrise=6.5&sunset=17.5
      const testSunrise = params.get("sunrise");
      if (testSunrise) {
        const val = parseFloat(testSunrise);
        if (!isNaN(val) && val >= 0 && val < 24) setSunriseOverride(val);
      }
      const testSunset = params.get("sunset");
      if (testSunset) {
        const val = parseFloat(testSunset);
        if (!isNaN(val) && val >= 0 && val < 24) setSunsetOverride(val);
      }

      // Hour override
      const testHour = params.get("hour");
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

  const sunrise = sunriseOverride ?? weatherData.sunrise;
  const sunset = sunsetOverride ?? weatherData.sunset;

  // Get interpolated weather for current hour
  const currentWeather = getWeatherForHour(weatherData, hour);

  // Apply weather override if present
  const effectiveWeather = weatherOverride
    ? {
        ...currentWeather,
        weatherCondition: weatherOverride,
        // Simulate realistic values for the override
        cloudCover:
          weatherOverride === "clear"
            ? 0
            : weatherOverride === "cloudy"
            ? 50
            : weatherOverride === "overcast"
            ? 90
            : weatherOverride === "fog"
            ? 100
            : weatherOverride === "rain"
            ? 80
            : weatherOverride === "heavyRain"
            ? 95
            : weatherOverride === "snow"
            ? 85
            : weatherOverride === "thunderstorm"
            ? 95
            : currentWeather.cloudCover,
        rain:
          weatherOverride === "rain"
            ? 2
            : weatherOverride === "heavyRain"
            ? 8
            : weatherOverride === "thunderstorm"
            ? 5
            : 0,
        snowfall: weatherOverride === "snow" ? 2 : 0,
      }
    : currentWeather;

  return (
    <>
      <ArtisticSky
        sunrise={sunrise}
        sunset={sunset}
        weather={effectiveWeather}
      />
      <RoomLighting
        sunrise={sunrise}
        sunset={sunset}
        weatherCondition={effectiveWeather.weatherCondition}
        cloudCover={effectiveWeather.cloudCover}
      />
      <Room currentView={currentView} focusTarget={focusTarget} onViewChange={onViewChange} onFocusChange={onFocusChange} hoveredNav={hoveredNav} />
      <Environment preset="apartment" environmentIntensity={0.3} />
    </>
  );
}

export function Scene() {
  const [currentView, setCurrentView] = useState<ViewType>("room");
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <Canvas
        camera={{ position: [0, 1.5, -4], fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <SceneContent
            currentView={currentView}
            onViewChange={setCurrentView}
            focusTarget={focusTarget}
            onFocusChange={setFocusTarget}
            hoveredNav={hoveredNav}
          />
        </Suspense>
        <CameraController view={currentView} focusTarget={focusTarget} />
      </Canvas>

      {/* Scalable Bottom Navigation Bar */}
      <div
        style={{
          position: "absolute", 
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10000000, // Must exceed the canvas z-index (~8.3M set by @react-three/fiber)
          display: "flex",
          gap: "1rem",
          padding: "0.5rem",
          background: "rgba(20, 20, 20, 0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "9999px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
          // Responsive layout for many items
          maxWidth: "90vw",
          overflowX: "auto",
        }}
        className="scrollbar-hide" // Hides scrollbar if it needs to scroll
      >
        {/* Navigation Items Configuration */}
        {[
          {
            id: "room",
            label: "Home",
            icon: <Home size={20} strokeWidth={2.5} />,
            isActive: currentView === "room" && focusTarget === null,
            onClick: () => {
              setCurrentView("room");
              setFocusTarget(null);
            },
          },
          {
            id: "monitor",
            label: "Monitor",
            icon: <MonitorIcon size={20} strokeWidth={2.5} />,
            isActive: currentView === "monitor",
            onClick: () => {
              setCurrentView("monitor");
              setFocusTarget(null);
            },
          },
          {
            id: "guitar",
            label: "Guitar",
            icon: <Music size={20} strokeWidth={2.5} />,
            isActive: focusTarget !== null,
            onClick: () => {
              setCurrentView("room");
              setFocusTarget(GUITAR_FOCUS);
            },
          },
        ].map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              background: item.isActive ? "rgba(255, 255, 255, 0.9)" : "transparent",
              color: item.isActive ? "#000" : "rgba(255, 255, 255, 0.6)",
              fontWeight: 600,
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              setHoveredNav(item.id);
              if (!item.isActive) {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
              }
            }}
            onMouseLeave={(e) => {
              setHoveredNav(null);
              if (!item.isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              }
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <p
        style={{
          position: "absolute",
          bottom: "0.6rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10000000,
          margin: 0,
          fontSize: "11px",
          fontStyle: "italic",
          color: "rgba(255, 255, 255, 0.35)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        *Time & Weather Currently in Bay Area
      </p>
    </div>
  );
}
