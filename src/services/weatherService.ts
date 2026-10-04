import { WeatherContext } from '../types';
import * as Location from 'expo-location';

export interface LiveWeatherData {
  condition: WeatherContext;
  temperatureC: number;
  weatherDescription: string;
  isRaining: boolean;
  precipitationMm: number;
  locationName: string;
  lastUpdated: string;
}

/**
 * Maps WMO Weather Interpretation Codes (0-99) to FitTapp UI conditions
 * Standard defined by World Meteorological Organization
 */
export function interpretWmoCode(code: number): { description: string; isRain: boolean; condition: WeatherContext } {
  switch (code) {
    case 0:
      return { description: 'Clear sky', isRain: false, condition: 'sunny' };
    case 1:
      return { description: 'Mainly clear', isRain: false, condition: 'sunny' };
    case 2:
      return { description: 'Partly cloudy', isRain: false, condition: 'sunny' };
    case 3:
      return { description: 'Overcast', isRain: false, condition: 'sunny' };
    case 45:
      return { description: 'Foggy', isRain: false, condition: 'sunny' };
    case 48:
      return { description: 'Depositing rime fog', isRain: false, condition: 'sunny' };
    case 51:
    case 53:
    case 55:
      return { description: 'Drizzle', isRain: true, condition: 'rain' };
    case 61:
      return { description: 'Slight rain', isRain: true, condition: 'rain' };
    case 63:
      return { description: 'Moderate rain', isRain: true, condition: 'rain' };
    case 65:
      return { description: 'Heavy rain', isRain: true, condition: 'rain' };
    case 71:
    case 73:
    case 75:
      return { description: 'Snow fall', isRain: true, condition: 'rain' };
    case 77:
      return { description: 'Snow grains', isRain: true, condition: 'rain' };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain showers', isRain: true, condition: 'rain' };
    case 85:
    case 86:
      return { description: 'Snow showers', isRain: true, condition: 'rain' };
    case 95:
      return { description: 'Thunderstorm', isRain: true, condition: 'rain' };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', isRain: true, condition: 'rain' };
    default:
      return { description: 'Variable weather', isRain: false, condition: 'sunny' };
  }
}

/**
 * High-precision location detector prioritizing real hardware GPS, then fast IP fallback
 */
export async function detectCurrentLocation(): Promise<{
  lat: number;
  lng: number;
  label: string;
}> {
  // 1. Try real hardware GPS first via expo-location
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    let permitted = status === 'granted';
    if (!permitted) {
      const req = await Location.requestForegroundPermissionsAsync();
      permitted = req.status === 'granted';
    }

    if (permitted) {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (pos && pos.coords) {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let label = 'Current Location';

        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (rev && rev.length > 0) {
            const first = rev[0];
            const city = first.city || first.subregion || first.region || first.name || 'Local Area';
            const country = first.country || 'Poland';
            label = `${city}, ${country}`;
          }
        } catch {}

        return { lat, lng, label };
      }
    }
  } catch (err) {
    console.warn('GPS location detection failed, attempting IP fallback:', err);
  }

  // 2. Fast Tier 1: ip-api.com (50ms response in Europe)
  try {
    const res = await fetch('http://ip-api.com/json/?fields=status,country,city,lat,lon');
    const data = await res.json();
    if (data && data.status === 'success' && data.lat && data.lon) {
      return {
        lat: data.lat,
        lng: data.lon,
        label: `${data.city || 'Local Area'}, ${data.country || 'Poland'}`,
      };
    }
  } catch {}

  // 3. Fast Tier 2: ipwho.is
  try {
    const res2 = await fetch('https://ipwho.is/');
    const data2 = await res2.json();
    if (data2 && data2.success && data2.latitude && data2.longitude) {
      return {
        lat: data2.latitude,
        lng: data2.longitude,
        label: `${data2.city || 'Local Area'}, ${data2.country || 'Poland'}`,
      };
    }
  } catch {}

  // Default fallback (Central Poland)
  return { lat: 50.0697, lng: 19.9422, label: 'Kraków, Poland' };
}

/**
 * Fetches real-time weather from Open-Meteo API using device coordinates.
 * Open-Meteo is free, keyless, and provides hyper-accurate WMO codes & temperature.
 */
export async function fetchLiveWeather(
  lat?: number,
  lng?: number,
  locationName?: string
): Promise<LiveWeatherData> {
  let targetLat = lat;
  let targetLng = lng;
  let targetLabel = locationName;

  if (typeof targetLat !== 'number' || typeof targetLng !== 'number') {
    const detected = await detectCurrentLocation();
    targetLat = detected.lat;
    targetLng = detected.lng;
    targetLabel = targetLabel || detected.label;
  }
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat.toFixed(
      4
    )}&longitude=${targetLng.toFixed(
      4
    )}&current=temperature_2m,precipitation,rain,weather_code&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const temp = Math.round(current.temperature_2m);
    const code = current.weather_code;
    const precipitation = current.precipitation || 0;

    const { description, isRain, condition } = interpretWmoCode(code);

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    return {
      condition,
      temperatureC: temp,
      weatherDescription: description,
      isRaining: isRain,
      precipitationMm: precipitation,
      locationName: targetLabel || 'Local Area',
      lastUpdated: timeStr,
    };
  } catch (error) {
    console.warn('Weather fetch error, falling back to sunny default:', error);
    return {
      condition: 'sunny',
      temperatureC: 14,
      weatherDescription: 'Clear sky (offline mode)',
      isRaining: false,
      precipitationMm: 0,
      locationName: targetLabel || 'Local Area',
      lastUpdated: 'Live',
    };
  }
}
