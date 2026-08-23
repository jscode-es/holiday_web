export type DailyForecast = {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
};

export type WeatherInfo = {
  location: string;
  temperature: number;
  weatherCode: number;
  daily: DailyForecast[];
};

const LOCATIONS: { location: string; lat: number; lon: number }[] = [
  { location: "Barcelona", lat: 41.3851, lon: 2.1734 },
  { location: "Tokio", lat: 35.6762, lon: 139.6503 },
];

export async function getWeather(): Promise<WeatherInfo[]> {
  const results = await Promise.all(
    LOCATIONS.map(async ({ location, lat, lon }): Promise<WeatherInfo | null> => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { next: { revalidate: 1800 } }
        );
        if (!res.ok) return null;
        const data = await res.json();

        const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
          date,
          weatherCode: data.daily.weathercode[i],
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
        }));

        return {
          location,
          temperature: Math.round(data.current_weather.temperature),
          weatherCode: data.current_weather.weathercode,
          daily,
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((r): r is WeatherInfo => r !== null);
}

/** Maps WMO weather codes (https://open-meteo.com/en/docs) to a rough category. */
export function weatherCategory(code: number): "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm" {
  if (code === 0) return "clear";
  if (code === 1 || code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}
