import { WeatherData } from '../types';

/**
 * Register the Service Worker for offline capability & weather data caching
 */
export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[SW] Service Worker registered successfully with scope:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[SW] New content available; please refresh.');
              } else {
                console.log('[SW] Content cached for offline use.');
              }
            }
          });
        }
      });

      return registration;
    })
    .catch((err) => {
      console.warn('[SW] Service Worker registration failed:', err);
      return null;
    });
}

/**
 * Proactively cache weather data into the Service Worker cache
 * This ensures that even if a response was constructed client-side or retrieved before SW took control,
 * the Service Worker has the latest weather ready for offline viewing.
 */
export function syncWeatherToServiceWorker(weather: WeatherData): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_WEATHER_DATA',
        payload: weather
      });
    } catch (e) {
      console.warn('[SW] Could not message Service Worker:', e);
    }
  } else {
    // If not controlled yet, wait for controller or ready
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'CACHE_WEATHER_DATA',
          payload: weather
        });
      }
    }).catch(() => {});
  }
}
