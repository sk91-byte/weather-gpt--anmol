import { WeatherData } from '../types';

export interface LocationDetectionResult {
  weather: WeatherData;
  method: 'gps-satellite' | 'gps-wifi' | 'ip-network';
  coordinates: {
    lat: number;
    lon: number;
  };
  accuracyMeters?: number;
  city: string;
  state: string;
}

export interface PinpointLocationItem {
  displayName: string;
  name: string;
  locality?: string;
  city: string;
  state: string;
  postcode?: string;
  lat: number;
  lon: number;
}

/**
 * High-Precision GPS Multi-Sample Collector
 * Listens to GPS satellite fixes and converges on the most accurate position reading (lowest accuracy error in meters).
 */
function acquireBestGPSFix(
  highAccuracy: boolean,
  timeoutMs: number,
  onProgress?: (status: string) => void
): Promise<{ lat: number; lon: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported by this browser'));
      return;
    }

    let bestFix: { lat: number; lon: number; accuracy: number } | null = null;
    let watchId: number | null = null;
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    timer = setTimeout(() => {
      cleanup();
      if (bestFix) {
        resolve(bestFix);
      } else {
        reject(new Error(`GPS acquisition timed out after ${Math.round(timeoutMs / 1000)}s`));
      }
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = Math.round(pos.coords.accuracy);
        const currentFix = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy
        };

        if (!bestFix || accuracy < bestFix.accuracy) {
          bestFix = currentFix;
          onProgress?.(`Refining GPS accuracy (current: ±${accuracy}m)...`);
        }

        // Pinpoint target: If accuracy is 25 meters or better (true GPS satellite lock), resolve immediately!
        if (accuracy <= 25) {
          cleanup();
          resolve(bestFix);
        }
      },
      (err) => {
        // If an error occurs but we already gathered a previous position fix, use it!
        if (bestFix) {
          cleanup();
          resolve(bestFix);
        } else {
          cleanup();
          reject(err);
        }
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: 0, // Never accept stale cached coordinates
        timeout: timeoutMs
      }
    );
  });
}

/**
 * Robust Multi-Tier High-Precision Location Detector
 * 1. Tier 1: Hardware GPS Satellite (enableHighAccuracy: true) with progressive accuracy convergence (up to 10s)
 * 2. Tier 2: Low-power Wi-Fi/Cellular Triangulation (enableHighAccuracy: false)
 * 3. Tier 3: ISP IP Geolocation fallback (if browser permissions are blocked)
 * 4. Hyper-Local Reverse Geocoding & Real-Time Open-Meteo Doppler Telemetry
 */
export async function detectLiveLocation(
  onProgress?: (statusText: string) => void
): Promise<LocationDetectionResult> {
  let lat: number | null = null;
  let lon: number | null = null;
  let accuracyMeters: number | undefined = undefined;
  let detectedCity: string | null = null;
  let detectedState: string | null = null;
  let method: 'gps-satellite' | 'gps-wifi' | 'ip-network' = 'gps-satellite';

  // Tier 1: High-Accuracy GPS Lock
  try {
    onProgress?.('Locking onto GPS satellites for pinpoint accuracy...');
    const fix = await acquireBestGPSFix(true, 10000, onProgress);
    lat = fix.lat;
    lon = fix.lon;
    accuracyMeters = fix.accuracy;
    method = fix.accuracy <= 100 ? 'gps-satellite' : 'gps-wifi';
    onProgress?.(`GPS locked! Accuracy: ±${fix.accuracy}m`);
  } catch (errHigh: any) {
    console.warn('High-accuracy GPS lock failed or denied:', errHigh);

    // If permission was denied by user explicitly (code 1), don't waste time on Tier 2
    if (errHigh?.code === 1) {
      console.warn('Geolocation permission denied by user.');
    } else {
      // Tier 2: Network / Wi-Fi Geolocation
      try {
        onProgress?.('Acquiring network Wi-Fi positioning fix...');
        const fix = await acquireBestGPSFix(false, 6000, onProgress);
        lat = fix.lat;
        lon = fix.lon;
        accuracyMeters = fix.accuracy;
        method = 'gps-wifi';
      } catch (errLow: any) {
        console.warn('Network geolocation unavailable:', errLow);
      }
    }
  }

  // Tier 3: IP Geolocation Fallback if GPS/Wi-Fi positioning was blocked or timed out
  if (lat === null || lon === null) {
    onProgress?.('Detecting regional network coordinates...');
    try {
      // Primary IP Geo: ipwho.is
      const ipRes = await fetch('https://ipwho.is/', {
        signal: AbortSignal.timeout(4500)
      });
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.success && typeof ipData.latitude === 'number') {
          lat = ipData.latitude;
          lon = ipData.longitude;
          detectedCity = ipData.city || null;
          detectedState = ipData.region || null;
          method = 'ip-network';
        }
      }
    } catch (e) {
      console.warn('ipwho.is failed, trying secondary IP geo provider:', e);
    }

    // Secondary IP Geo backup: freeipapi.com
    if (lat === null || lon === null) {
      try {
        const backupRes = await fetch('https://freeipapi.com/api/json', {
          signal: AbortSignal.timeout(4500)
        });
        if (backupRes.ok) {
          const bData = await backupRes.json();
          if (bData && typeof bData.latitude === 'number') {
            lat = bData.latitude;
            lon = bData.longitude;
            detectedCity = bData.cityName || null;
            detectedState = bData.regionName || null;
            method = 'ip-network';
          }
        }
      } catch (e) {
        console.warn('Secondary IP geo provider also failed:', e);
      }
    }
  }

  // If still completely unresolved, throw error
  if (lat === null || lon === null) {
    throw new Error('Location access was denied or unavailable. Please enable browser location or search your city/PIN code.');
  }

  // Step 4: Fetch verified hyper-local weather & reverse-geocoded locality from backend
  onProgress?.('Resolving hyper-local neighborhood & Doppler radar...');
  const queryParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString()
  });
  if (accuracyMeters !== undefined) queryParams.set('accuracy', accuracyMeters.toString());
  if (method) queryParams.set('method', method);
  if (detectedCity) queryParams.set('city', detectedCity);
  if (detectedState) queryParams.set('state', detectedState);

  const res = await fetch(`/api/weather/live-location?${queryParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Weather service returned HTTP ${res.status}`);
  }

  const liveWeather: WeatherData = await res.json();
  if (!liveWeather || !liveWeather.city) {
    throw new Error('Weather data payload was invalid');
  }

  // Ensure precision attributes are present
  liveWeather.coordinates = { lat, lon };
  liveWeather.accuracyMeters = accuracyMeters;
  liveWeather.locationMethod = method;

  // Persist to localStorage
  try {
    localStorage.setItem('weathergpt_location', JSON.stringify(liveWeather));
  } catch (e) {
    console.warn('Could not cache live location weather to localStorage:', e);
  }

  return {
    weather: liveWeather,
    method,
    accuracyMeters,
    coordinates: { lat, lon },
    city: liveWeather.city,
    state: liveWeather.state
  };
}

/**
 * Search any Indian locality, colony, sector, city or 6-digit PIN code for pinpoint weather
 */
export async function searchPinpointLocations(query: string): Promise<PinpointLocationItem[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const res = await fetch(`/api/weather/search-location?q=${encodeURIComponent(trimmed)}`, {
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Pinpoint location search API failed:', err);
  }

  return [];
}

