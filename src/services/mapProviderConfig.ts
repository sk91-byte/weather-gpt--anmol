export type MapProviderType = 'carto' | 'traveltime' | 'osm';

export interface MapProviderConfig {
  provider: MapProviderType;
  name: string;
  description: string;
  tileUrl: string;
  traveltimePositronUrl: string;
  traveltimeOsmBrightUrl: string;
  voyagerTileUrl: string;
  directVoyagerTileUrl?: string;
  satelliteTileUrl: string;
  attribution: string;
  subdomains: string;
  maxZoom: number;
  minZoom: number;
  requiresApiKey: boolean;
  routingEngine: 'traveltime-routes' | 'osm-backend';
  geocodingEngine: 'traveltime-geocoding' | 'osm-nominatim';
  isochroneEngine: 'traveltime-timemap';
  cartoConfig?: {
    voyagerStyle?: string;
    positronStyle?: string;
    darkStyle?: string;
  };
  travelTimeConfig?: {
    appId?: string;
    apiKey?: string;
  };
}

/**
 * Active Map Provider Configuration.
 * Powered by CARTO (MapLibre GL JS) & TravelTime Geospatial Routing Platform.
 */
export const ACTIVE_MAP_PROVIDER: MapProviderConfig = {
  provider: 'carto',
  name: 'CARTO Vector Basemaps & TravelTime',
  description: 'Interactive weather routing powered by CARTO vector basemaps and TravelTime turn-by-turn routing engine.',
  tileUrl: '/api/carto/tiles/voyager/{z}/{x}/{y}.png',
  traveltimePositronUrl: '/api/traveltime/tiles/positron/{z}/{x}/{y}.png',
  traveltimeOsmBrightUrl: '/api/traveltime/tiles/osm-bright/{z}/{x}/{y}.png',
  voyagerTileUrl: '/api/carto/tiles/voyager/{z}/{x}/{y}.png',
  directVoyagerTileUrl: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  satelliteTileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '&copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a> &copy; <a href="https://traveltime.com" target="_blank" rel="noreferrer">TravelTime</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  subdomains: 'abcd',
  maxZoom: 19,
  minZoom: 3,
  requiresApiKey: false,
  routingEngine: 'traveltime-routes',
  geocodingEngine: 'traveltime-geocoding',
  isochroneEngine: 'traveltime-timemap',
  cartoConfig: {
    voyagerStyle: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    positronStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    darkStyle: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  }
};

