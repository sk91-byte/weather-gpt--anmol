import { NWPComparisonData, NWPModelId } from '../types';

// In-memory cache to prevent duplicate fetches when switching models or views
const nwpCache = new Map<string, { data: NWPComparisonData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchNWPModelComparison(
  city: string,
  lat?: number,
  lon?: number
): Promise<NWPComparisonData> {
  const cacheKey = `${city.toLowerCase()}_${lat?.toFixed(2) ?? ''}_${lon?.toFixed(2) ?? ''}`;
  const cached = nwpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const queryParams = new URLSearchParams();
  queryParams.set('city', city);
  if (lat !== undefined && !isNaN(lat)) queryParams.set('lat', lat.toString());
  if (lon !== undefined && !isNaN(lon)) queryParams.set('lon', lon.toString());

  const response = await fetch(`/api/weather/nwp-models?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch NWP data: ${response.statusText}`);
  }

  const data: NWPComparisonData = await response.json();
  nwpCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

export function getModelColor(modelId: NWPModelId): string {
  switch (modelId) {
    case 'consensus':
      return '#10b981'; // Emerald
    case 'wrf':
      return '#2563eb'; // Blue
    case 'gfs':
      return '#4f46e5'; // Indigo
    case 'ecmwf':
      return '#7c3aed'; // Violet
    case 'icon':
      return '#d97706'; // Amber
    default:
      return '#64748b';
  }
}
