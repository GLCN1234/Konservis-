import { useEffect, useState } from 'react';
import { useDryerStore } from '../store/dryerStore';

/**
 * Fetches real weather from Open-Meteo API (free, no API key)
 * Location: Lagos, Nigeria (6.5244°N, 3.3792°E)
 * Updates every 10 minutes
 * Maps real conditions to our weather model
 */
export function useRealWeather() {
  const { setWeather, updateRealWeather } = useDryerStore();
  const [realData, setRealData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=6.5244&longitude=3.3792' +
          '&current=temperature_2m,relative_humidity_2m,precipitation,weathercode,windspeed_10m' +
          '&timezone=Africa%2FLagos'
        );
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        const cur = data.current;

        const realWeather = {
          temperature:  cur.temperature_2m,
          humidity:     cur.relative_humidity_2m,
          precipitation:cur.precipitation,
          windspeed:    cur.windspeed_10m,
          weathercode:  cur.weathercode,
          fetchedAt:    new Date().toISOString(),
        };

        setRealData(realWeather);

        // Map WMO weather code to our model
        // WMO codes: 0=clear, 1-3=partly cloudy, 45-48=fog
        // 51-67=drizzle/rain, 71-77=snow, 80-82=showers, 95-99=thunderstorm
        const code = cur.weathercode;
        const rh   = cur.relative_humidity_2m;

        let weatherKey;
        if (cur.precipitation > 0.5 || (code >= 51 && code <= 99)) {
          weatherKey = 'rainy';
        } else if (rh < 30 && cur.windspeed_10m > 10) {
          weatherKey = 'harmattan';
        } else if (code === 0 || code === 1) {
          weatherKey = 'sunny';
        } else {
          weatherKey = 'cloudy';
        }

        setWeather(weatherKey);

        // Push real ambient temp + humidity into store for physics
        if (updateRealWeather) {
          updateRealWeather({
            ambientTemp: cur.temperature_2m,
            ambientHumidity: cur.relative_humidity_2m,
          });
        }
      } catch (e) {
        setError(e.message);
        // Silently fall back to manual mode — don't crash the app
        console.warn('Weather API unavailable, using manual mode:', e.message);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000); // every 10 min
    return () => clearInterval(interval);
  }, [setWeather, updateRealWeather]);

  return { realData, error };
}
