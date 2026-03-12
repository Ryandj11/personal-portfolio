"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WeatherData, HourlyWeather } from "../api/weather/route";

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "overcast"
  | "rain"
  | "heavyRain"
  | "snow"
  | "fog"
  | "thunderstorm";

export interface InterpolatedWeather {
  weatherCondition: WeatherCondition;
  cloudCover: number;
  temperature: number;
  rain: number;
  snowfall: number;
  windSpeed: number;
}

const DEFAULT_WEATHER: WeatherData = {
  hourly: Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    weatherCode: 0,
    weatherCondition: "clear",
    cloudCover: 0,
    temperature: 15,
    rain: 0,
    snowfall: 0,
    windSpeed: 0,
  })),
  sunrise: 6,
  sunset: 19,
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Pick the dominant condition between two hours based on interpolation factor
function interpolateCondition(
  a: string,
  b: string,
  t: number
): WeatherCondition {
  return (t < 0.5 ? a : b) as WeatherCondition;
}

export function getWeatherForHour(
  data: WeatherData,
  hour: number
): InterpolatedWeather {
  const clampedHour = Math.max(0, Math.min(23.99, hour));
  const floorHour = Math.floor(clampedHour);
  const ceilHour = Math.min(23, floorHour + 1);
  const t = clampedHour - floorHour;

  const a = data.hourly[floorHour];
  const b = data.hourly[ceilHour];

  if (!a || !b) {
    return {
      weatherCondition: "clear",
      cloudCover: 0,
      temperature: 15,
      rain: 0,
      snowfall: 0,
      windSpeed: 0,
    };
  }

  return {
    weatherCondition: interpolateCondition(
      a.weatherCondition,
      b.weatherCondition,
      t
    ),
    cloudCover: lerp(a.cloudCover, b.cloudCover, t),
    temperature: lerp(a.temperature, b.temperature, t),
    rain: lerp(a.rain, b.rain, t),
    snowfall: lerp(a.snowfall, b.snowfall, t),
    windSpeed: lerp(a.windSpeed, b.windSpeed, t),
  };
}

export interface UseWeatherReturn {
  data: WeatherData;
  loading: boolean;
  error: string | null;
  getWeatherForHour: (hour: number) => InterpolatedWeather;
}

export function useWeather(): UseWeatherReturn {
  const [data, setData] = useState<WeatherData>(DEFAULT_WEATHER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: WeatherData = await res.json();

        if (json.hourly && json.hourly.length === 24) {
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch weather:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, []);

  const getForHour = useCallback(
    (hour: number) => getWeatherForHour(data, hour),
    [data]
  );

  return {
    data,
    loading,
    error,
    getWeatherForHour: getForHour,
  };
}
