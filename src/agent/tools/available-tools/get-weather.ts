import { type } from "arktype";
import type { AIAgentTool } from "../tool";

const getWeatherSchema = type({
  "+": "reject",
  location: "string",
});

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

async function geocode(
  location: string,
): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    results?: {
      latitude: number;
      longitude: number;
      name: string;
      country: string;
    }[];
  };
  const result = data?.results?.[0];
  if (!result) return null;
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: `${result.name}, ${result.country}`,
  };
}

async function fetchWeather(location: string): Promise<string> {
  const geo = await geocode(location);
  if (!geo) return `Could not find location: ${location}`;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}` +
    `&longitude=${geo.lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    current?: {
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
  };
  const current = data?.current;
  if (!current) return "Weather data unavailable.";

  const condition = WMO_DESCRIPTIONS[current.weather_code] ?? "Unknown";

  return (
    `Weather in ${geo.name}: ${condition}, ` +
    `${current.temperature_2m}°C, ` +
    `humidity ${current.relative_humidity_2m}%, ` +
    `wind ${current.wind_speed_10m} km/h`
  );
}

export const get_weather: AIAgentTool = {
  type: "local_tool",
  name: "get_weather",
  description: "Get the current weather in a given location",
  inputSchema: getWeatherSchema,
  run: async ({ location }: typeof getWeatherSchema.infer) => {
    return await fetchWeather(location);
  },
};
