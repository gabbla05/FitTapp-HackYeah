export interface LiveWeatherData {
  condition: 'rain' | 'sunny';
  temperatureC: number;
  weatherCode: number;
  weatherDescription: string;
  isRaining: boolean;
  precipitationMm: number;
  locationName?: string;
  lastUpdated: string;
}

/**
 * Maps WMO Weather interpretation codes to human-readable English descriptions
 * and determines if it counts as adverse (rainy/stormy) weather for outdoor walks.
 */
export function interpretWmoCode(code: number): { description: string; isRain: boolean } {
  switch (code) {
    case 0:
      return { description: 'Clear sky', isRain: false };
    case 1:
      return { description: 'Mainly clear', isRain: false };
    case 2:
      return { description: 'Partly cloudy', isRain: false };
    case 3:
      return { description: 'Overcast', isRain: false };
    case 45:
    case 48:
      return { description: 'Foggy', isRain: false };
    case 51:
    case 53:
    case 55:
      return { description: 'Light drizzle', isRain: true };
    case 56:
    case 57:
      return { description: 'Freezing drizzle', isRain: true };
    case 61:
      return { description: 'Slight rain', isRain: true };
    case 63:
      return { description: 'Moderate rain', isRain: true };
    case 65:
      return { description: 'Heavy rain', isRain: true };
    case 66:
    case 67:
      return { description: 'Freezing rain', isRain: true };
    case 71:
    case 73:
    case 75:
      return { description: 'Snow fall', isRain: true };
    case 77:
      return { description: 'Snow grains', isRain: true };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain showers', isRain: true };
    case 85:
    case 86:
      return { description: 'Snow showers', isRain: true };
    case 95:
      return { description: 'Thunderstorm', isRain: true };
    case 96:
    case 99:
      return { description: 'Thunderstorm with hail', isRain: true };
    default:
      return { description: 'Variable weather', isRain: false };
  }
}

/**
 * Fetches real-time weather from Open-Meteo API using device coordinates.
 * Open-Meteo is free, keyless, and provides hyper-accurate WMO codes & temperature.
 */
export async function fetchLiveWeather(
  lat: number = 51.7972,
  lng: number = 18.3401,
  locationName?: string
): Promise<LiveWeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(
      4
    )}&longitude=${lng.toFixed(
      4
    )}&current=temperature_2m,precipitation,rain,weather_code&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const weatherCode = current?.weather_code ?? 0;
    const precipitation = current?.precipitation ?? 0;
    const { description, isRain: codeIsRain } = interpretWmoCode(weatherCode);

    // If precipitation > 0.1 mm or WMO code represents rain/snow
    const isRaining = codeIsRain || precipitation > 0.1;
    const condition = isRaining ? 'rain' : 'sunny';
    const temperatureC = Math.round(current?.temperature_2m ?? 18);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    return {
      condition,
      temperatureC,
      weatherCode,
      weatherDescription: description,
      isRaining,
      precipitationMm: precipitation,
      locationName: locationName || 'Local Area',
      lastUpdated: timeStr,
    };
  } catch (error) {
    console.warn('Live weather fetch failed, using fallback:', error);
    return {
      condition: 'sunny',
      temperatureC: 18,
      weatherCode: 0,
      weatherDescription: 'Clear sky (Offline)',
      isRaining: false,
      precipitationMm: 0,
      locationName: locationName || 'Local Area',
      lastUpdated: 'Just now',
    };
  }
}
