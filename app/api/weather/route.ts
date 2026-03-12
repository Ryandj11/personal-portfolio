import { NextResponse } from "next/server";

// San Jose, CA coordinates
const LATITUDE = 37.3382;
const LONGITUDE = -121.8863;
const TIMEZONE = "America/Los_Angeles";

// WMO Weather interpretation codes -> simplified condition
function wmoToCondition(code: number): string {
  // Clear
  if (code === 0) return "clear";
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) return "cloudy";
  // Overcast
  if (code === 3) return "overcast";
  // Fog / depositing rime fog
  if (code === 45 || code === 48) return "fog";
  // Drizzle (light, moderate, dense)
  if (code >= 51 && code <= 55) return "rain";
  // Freezing drizzle
  if (code === 56 || code === 57) return "rain";
  // Rain (slight, moderate, heavy)
  if (code === 61 || code === 63) return "rain";
  if (code === 65) return "heavyRain";
  // Freezing rain
  if (code === 66 || code === 67) return "rain";
  // Snow fall (slight, moderate, heavy)
  if (code >= 71 && code <= 75) return "snow";
  // Snow grains
  if (code === 77) return "snow";
  // Rain showers (slight, moderate, violent)
  if (code === 80 || code === 81) return "rain";
  if (code === 82) return "heavyRain";
  // Snow showers
  if (code === 85 || code === 86) return "snow";
  // Thunderstorm
  if (code >= 95 && code <= 99) return "thunderstorm";
  return "clear";
}

// Parse ISO time string "2026-02-16T06:52" to decimal hour (6.867)
function isoToDecimalHour(iso: string): number {
  const timePart = iso.split("T")[1];
  if (!timePart) return 0;
  const [hours, minutes] = timePart.split(":").map(Number);
  return hours + minutes / 60;
}

export interface HourlyWeather {
  hour: number;
  weatherCode: number;
  weatherCondition: string;
  cloudCover: number;
  temperature: number;
  rain: number;
  snowfall: number;
  windSpeed: number;
}

export interface WeatherData {
  hourly: HourlyWeather[];
  sunrise: number;
  sunset: number;
}

// Cache the response for 1 hour on the server
export const revalidate = 3600;

export async function GET() {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(LATITUDE));
    url.searchParams.set("longitude", String(LONGITUDE));
    url.searchParams.set(
      "hourly",
      "weather_code,cloud_cover,temperature_2m,rain,snowfall,wind_speed_10m"
    );
    url.searchParams.set("daily", "sunrise,sunset");
    url.searchParams.set("timezone", TIMEZONE);
    url.searchParams.set("forecast_days", "1");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo API returned ${response.status}`);
    }

    const raw = await response.json();

    // Transform Open-Meteo's array format into our structured format
    const hourly: HourlyWeather[] = [];
    const times: string[] = raw.hourly?.time ?? [];

    for (let i = 0; i < times.length; i++) {
      const weatherCode = raw.hourly.weather_code?.[i] ?? 0;
      hourly.push({
        hour: i,
        weatherCode,
        weatherCondition: wmoToCondition(weatherCode),
        cloudCover: raw.hourly.cloud_cover?.[i] ?? 0,
        temperature: raw.hourly.temperature_2m?.[i] ?? 15,
        rain: raw.hourly.rain?.[i] ?? 0,
        snowfall: raw.hourly.snowfall?.[i] ?? 0,
        windSpeed: raw.hourly.wind_speed_10m?.[i] ?? 0,
      });
    }

    // Parse sunrise/sunset to decimal hours
    const sunriseStr: string = raw.daily?.sunrise?.[0] ?? "";
    const sunsetStr: string = raw.daily?.sunset?.[0] ?? "";

    const data: WeatherData = {
      hourly,
      sunrise: sunriseStr ? isoToDecimalHour(sunriseStr) : 6,
      sunset: sunsetStr ? isoToDecimalHour(sunsetStr) : 19,
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Weather API error:", error);

    // Return fallback data so the scene always works
    const fallback: WeatherData = {
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

    return NextResponse.json(fallback, {
      status: 200, // Still 200 so the client works
      headers: {
        "X-Weather-Fallback": "true",
      },
    });
  }
}
