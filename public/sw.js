// WeatherGPT Progressive Web App Service Worker
// Implements robust offline caching for application shell, static assets, and live meteorology data.

const STATIC_CACHE_NAME = 'weathergpt-static-v5';
const WEATHER_CACHE_NAME = 'weathergpt-weather-cache-v2';

// Essential App Shell assets to precache on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg',
  '/apple-touch-icon.png'
];

// Fallback emergency weather payload if user opens the app completely offline before any live fetch
const DEFAULT_OFFLINE_WEATHER = {
  city: 'Dehradun',
  state: 'Uttarakhand',
  country: 'India',
  location: 'Dehradun, Uttarakhand, India',
  temperature: 28,
  feelsLike: 30,
  feels_like: 30,
  condition: 'Partly Cloudy',
  conditionIcon: 'partly-cloudy',
  humidity: 65,
  windSpeed: 12,
  wind_speed: 12,
  windDirection: 'NE',
  wind_direction: 'NE',
  pressure: 1012,
  rainChance: 40,
  rain_probability: 40,
  rain_spike_evening: 65,
  maxTemp: 32,
  minTemp: 24,
  aqi: 42,
  aqiStatus: 'Good',
  aqi_status: 'Good',
  uvIndex: 6,
  visibility: 8.5,
  lastUpdated: 'Service Worker Cache (Offline)',
  riskScore: 42,
  risk_score: 42,
  riskStatus: 'Moderate Risk',
  risk_status: 'Moderate Risk',
  risks: {
    rain: 'MEDIUM',
    flood: 'LOW',
    lightning: 'LOW',
    heat: 'LOW'
  },
  aiRecommendation: 'You are currently offline. Showing last cached meteorological observation. Connect to internet to sync live radar feed.',
  recommendationExplanation: {
    title: 'Offline Weather Mode',
    factors: [
      'Device connectivity is offline',
      'Served locally from Service Worker Weather Cache',
      'Stored parameters preserved from previous session'
    ],
    confidence: 90,
    modelAgreement: 'Stationary local cache fallback'
  },
  active_alerts: [],
  travel_impact: 'Weather data is cached from your last online session. Proceed with awareness of changing local conditions.',
  farmer_impact: 'Offline mode: Showing cached forecast. Reconnect when possible for real-time precipitation radar.',
  isOfflineCached: true,
  offlineCachedAt: 'Previously Cached'
};

// 1. Install Event: Precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (continuing):', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up legacy caches and take control immediately
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, WEATHER_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Helper to format offline time
function getFormattedTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// 4. Fetch Event: Intelligent multi-tier routing
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests and valid HTTP/HTTPS URLs
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // A. WEATHER API REQUESTS: Network-First with Cache Fallback
  // Matches /api/weather/current, /api/weather/live-location, etc.
  if (url.pathname.startsWith('/api/weather/')) {
    event.respondWith(
      fetch(event.request)
        .then(async (networkResponse) => {
          // If valid response from server, store fresh clone into WEATHER_CACHE
          if (networkResponse && networkResponse.status === 200) {
            try {
              const cache = await caches.open(WEATHER_CACHE_NAME);
              // 1. Cache exact request URL with query parameters (e.g. ?city=Delhi)
              await cache.put(event.request, networkResponse.clone());

              // 2. Also cache under universal 'latest' key for instant offline fallback
              await cache.put(
                new Request('/api/weather/latest-cached'),
                networkResponse.clone()
              );

              // 3. Cache under base route
              await cache.put(
                new Request('/api/weather/current'),
                networkResponse.clone()
              );
            } catch (cacheErr) {
              console.warn('[SW] Could not write weather to cache:', cacheErr);
            }
          }
          return networkResponse;
        })
        .catch(async (fetchError) => {
          console.warn('[SW] Network offline/unavailable for weather request. Reading from Service Worker cache:', url.pathname);
          const cache = await caches.open(WEATHER_CACHE_NAME);

          // 1. Try exact match for requested URL
          let cachedResponse = await cache.match(event.request);

          // 2. If not found, try the universal latest cached weather
          if (!cachedResponse) {
            cachedResponse = await cache.match('/api/weather/latest-cached');
          }

          // 3. If not found, try base /api/weather/current
          if (!cachedResponse) {
            cachedResponse = await cache.match('/api/weather/current');
          }

          // 4. If still not found, check all entries in WEATHER_CACHE_NAME and use the most recent
          if (!cachedResponse) {
            const keys = await cache.keys();
            if (keys.length > 0) {
              cachedResponse = await cache.match(keys[keys.length - 1]);
            }
          }

          // If a cached response exists in the Service Worker cache:
          if (cachedResponse) {
            try {
              const weatherJson = await cachedResponse.json();
              const cachedTime = weatherJson.offlineCachedAt || getFormattedTimestamp();

              // Mark as offline cached and update status label for UI
              const augmentedData = {
                ...weatherJson,
                isOfflineCached: true,
                offlineCachedAt: cachedTime,
                lastUpdated: weatherJson.lastUpdated?.includes('Offline')
                  ? weatherJson.lastUpdated
                  : `${weatherJson.lastUpdated || 'Live'} (Offline Cache)`
              };

              return new Response(JSON.stringify(augmentedData), {
                status: 200,
                statusText: 'OK (Served from Service Worker Cache)',
                headers: {
                  'Content-Type': 'application/json',
                  'X-WeatherGPT-Offline': 'true',
                  'X-WeatherGPT-Cache': 'HIT',
                  'X-WeatherGPT-Cached-At': cachedTime
                }
              });
            } catch (parseErr) {
              console.warn('[SW] Error parsing cached weather JSON, returning raw cached response:', parseErr);
              return cachedResponse;
            }
          }

          // If absolutely nothing was cached yet, return the default offline weather payload
          const defaultData = {
            ...DEFAULT_OFFLINE_WEATHER,
            offlineCachedAt: getFormattedTimestamp()
          };

          return new Response(JSON.stringify(defaultData), {
            status: 200,
            statusText: 'OK (Default Offline Weather Fallback)',
            headers: {
              'Content-Type': 'application/json',
              'X-WeatherGPT-Offline': 'true',
              'X-WeatherGPT-Cache': 'FALLBACK-DEFAULT'
            }
          });
        })
    );
    return;
  }

  // B. Health Check API: Network First, cached fallback
  if (url.pathname === '/api/health') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          status: 'ok',
          app: 'WeatherGPT',
          offline: true,
          source: 'service-worker-cache'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // C. Navigation requests (HTML Pages): Network-First, fallback to cached /index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        if (cachedIndex) return cachedIndex;
        return new Response('WeatherGPT is currently offline. Please reconnect.', {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // D. External CDN or third-party map tiles: Network only
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(event.request));
    return;
  }

  // E. Local Application Scripts & Assets: Network-First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === 'basic' || networkResponse.type === 'cors')
        ) {
          const clone = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return networkResponse;
      })
      .catch(async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        return cache.match(event.request);
      })
  );
});

// 5. Message Event: Explicit client sync and cache management
self.addEventListener('message', async (event) => {
  const data = event.data;
  if (!data) return;

  // Explicitly store weather data into the Service Worker cache
  if (data.type === 'CACHE_WEATHER_DATA' && data.payload) {
    try {
      const cache = await caches.open(WEATHER_CACHE_NAME);
      const timestamp = getFormattedTimestamp();
      const enrichedPayload = {
        ...data.payload,
        isOfflineCached: true,
        offlineCachedAt: timestamp
      };

      const jsonResponse = new Response(JSON.stringify(enrichedPayload), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-WeatherGPT-Offline': 'true',
          'X-WeatherGPT-Cache': 'CLIENT-SYNC'
        }
      });

      // Save under universal keys
      await cache.put(new Request('/api/weather/latest-cached'), jsonResponse.clone());
      await cache.put(new Request('/api/weather/current'), jsonResponse.clone());

      // If city name is present, also cache with query parameter
      if (data.payload.city) {
        const cityKey = `/api/weather/current?city=${encodeURIComponent(data.payload.city)}`;
        await cache.put(new Request(cityKey), jsonResponse.clone());
      }

      console.log('[SW] Successfully cached weather data via client sync for:', data.payload.city);

      // Notify caller if port available
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true, timestamp });
      }
    } catch (err) {
      console.warn('[SW] Error caching weather data via postMessage:', err);
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: false, error: String(err) });
      }
    }
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
