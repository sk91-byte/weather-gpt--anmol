import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import { LiveMapRoute } from '../../types';
import { fetchCartoConfig, fetchRadarMetadata, RadarFrameInfo } from '../../services/mapService';
import { Loader2, Navigation, Layers, AlertCircle, RefreshCw, Plus, Minus, LocateFixed, CloudRain, Play, Pause, ChevronLeft, ChevronRight, X } from '../Icons';

export interface CartoMapViewProps {
  routes: LiveMapRoute[];
  activeRouteId: string;
  onSelectRoute?: (id: string) => void;
  destinationName: string;
  originName: string;
  isNavigating?: boolean;
  vehicleProgress?: number;
  userCoords: [number, number]; // [lat, lon]
  destinationCoords: [number, number]; // [lat, lon]
  onMapClickCoordinates?: (lat: number, lon: number) => void;
  onStartDragEnd?: (lat: number, lon: number) => void;
  onDestDragEnd?: (lat: number, lon: number) => void;
  originWeather?: {
    temp: number;
    condition: string;
    rainProb: number;
    windKmh: number;
  };
  destWeather?: {
    temp: number;
    condition: string;
    rainProb: number;
  };
  onMapClick?: () => void;
  className?: string;
  routingSource?: 'traveltime' | 'simulated';
  hasBottomCard?: boolean;
  mapEngine?: 'osm' | 'carto';
  onSwitchMapEngine?: (engine: 'osm' | 'carto') => void;
  showRadarOverlay?: boolean;
  onToggleRadar?: () => void;
}

const CARTO_STYLES = {
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
};

export const CartoMapView: React.FC<CartoMapViewProps> = ({
  routes,
  activeRouteId,
  destinationName,
  originName,
  isNavigating = false,
  vehicleProgress = 0,
  userCoords,
  destinationCoords,
  onMapClickCoordinates,
  onStartDragEnd,
  onDestDragEnd,
  originWeather,
  destWeather,
  onMapClick,
  className = '',
  routingSource = 'traveltime',
  hasBottomCard = false,
  mapEngine = 'carto',
  onSwitchMapEngine,
  showRadarOverlay = false,
  onToggleRadar
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<'voyager' | 'positron' | 'dark'>('voyager');
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [showLayerPicker, setShowLayerPicker] = useState<boolean>(false);

  // Radar Doppler states for CARTO MapLibre
  const [radarFrames, setRadarFrames] = useState<RadarFrameInfo[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(-1);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [radarLoading, setRadarLoading] = useState<boolean>(false);

  // Fetch real-time RainViewer radar frames when radar is activated
  useEffect(() => {
    if (!showRadarOverlay) return;
    let isCancelled = false;
    if (radarFrames.length === 0) {
      setRadarLoading(true);
      fetchRadarMetadata()
        .then((res) => {
          if (isCancelled) return;
          if (res.frames && res.frames.length > 0) {
            setRadarFrames(res.frames);
            const pastCount = res.pastFrames ? res.pastFrames.length : 0;
            const targetIdx = pastCount > 0 ? pastCount - 1 : res.frames.length - 1;
            setActiveFrameIndex(targetIdx >= 0 ? targetIdx : 0);
          }
        })
        .finally(() => {
          if (!isCancelled) setRadarLoading(false);
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [showRadarOverlay, radarFrames.length]);

  // Animate radar playback loop
  useEffect(() => {
    if (!showRadarOverlay || !isRadarPlaying || radarFrames.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 750);
    return () => clearInterval(interval);
  }, [showRadarOverlay, isRadarPlaying, radarFrames.length]);

  // Add or update radar raster tiles on MapLibre GL
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const sourceId = 'carto-rainviewer-source';
    const layerId = 'carto-rainviewer-layer';

    const safeRemove = () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch (e) {}
    };

    if (!showRadarOverlay) {
      safeRemove();
      return;
    }

    if (radarFrames.length > 0 && activeFrameIndex >= 0 && activeFrameIndex < radarFrames.length) {
      const frame = radarFrames[activeFrameIndex];
      if (frame && frame.tileUrl) {
        if (!map.isStyleLoaded()) {
          map.once('styledata', () => {
            safeRemove();
            try {
              map.addSource(sourceId, {
                type: 'raster',
                tiles: [frame.tileUrl],
                tileSize: 256
              });
              map.addLayer({
                id: layerId,
                type: 'raster',
                source: sourceId,
                paint: { 'raster-opacity': 0.70 }
              });
            } catch (e) {}
          });
          return;
        }

        safeRemove();
        try {
          map.addSource(sourceId, {
            type: 'raster',
            tiles: [frame.tileUrl],
            tileSize: 256
          });
          map.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': 0.70 }
          });
        } catch (e) {
          console.warn('MapLibre radar add error:', e);
        }
      }
    }
  }, [showRadarOverlay, radarFrames, activeFrameIndex]);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenterGps = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [userCoords[1], userCoords[0]],
        zoom: 14,
        speed: 1.5
      });
    }
  };

  // Helper to create custom HTML element for markers
  const createMarkerElement = (type: 'start' | 'destination') => {
    const el = document.createElement('div');
    el.className = 'group relative flex flex-col items-center cursor-grab active:cursor-grabbing select-none';
    
    if (type === 'start') {
      el.innerHTML = `
        <div class="px-2 py-0.5 mb-1 bg-emerald-600 text-white font-black text-[10px] rounded-md shadow-md flex items-center space-x-1 whitespace-nowrap pointer-events-none">
          <span>🟢</span><span>START</span>
        </div>
        <div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="px-2 py-0.5 mb-1 bg-rose-600 text-white font-black text-[10px] rounded-md shadow-md flex items-center space-x-1 whitespace-nowrap pointer-events-none">
          <span>🎯</span><span>DESTINATION</span>
        </div>
        <div class="w-8 h-8 rounded-full bg-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white transform group-hover:scale-110 transition-transform">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
      `;
    }
    return el;
  };

  // Update Markers (Start Location & Destination)
  const updateMarkers = useCallback((map: maplibregl.Map) => {
    if (!map) return;

    try {
      // 1. Start Marker (Green, Draggable)
      const startLng = userCoords[1];
      const startLat = userCoords[0];

      if (startMarkerRef.current) {
        startMarkerRef.current.setLngLat([startLng, startLat]);
      } else {
        const startEl = createMarkerElement('start');
        const startPopup = new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(
          `<div style="font-family: sans-serif; padding: 6px; min-width: 140px;">
            <div style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase;">🟢 START LOCATION</div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${originName}</div>
            ${originWeather ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">🌡️ ${originWeather.temp}°C • 🌧️ ${originWeather.rainProb}% Rain</div>` : ''}
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Drag pin or tap map to move</div>
          </div>`
        );

        const marker = new maplibregl.Marker({
          element: startEl,
          anchor: 'bottom',
          draggable: true
        })
          .setLngLat([startLng, startLat])
          .setPopup(startPopup)
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onStartDragEnd?.(lngLat.lat, lngLat.lng);
        });

        startMarkerRef.current = marker;
      }

      // 2. Destination Marker (Red, Draggable)
      const destLng = destinationCoords[1];
      const destLat = destinationCoords[0];

      if (destMarkerRef.current) {
        destMarkerRef.current.setLngLat([destLng, destLat]);
      } else {
        const destEl = createMarkerElement('destination');
        const destPopup = new maplibregl.Popup({ offset: 30, closeButton: false }).setHTML(
          `<div style="font-family: sans-serif; padding: 6px; min-width: 140px;">
            <div style="font-size: 11px; font-weight: 800; color: #dc2626; text-transform: uppercase;">🎯 DESTINATION</div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${destinationName}</div>
            ${destWeather ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">🌡️ ${destWeather.temp}°C • 🌧️ ${destWeather.rainProb}% Rain</div>` : ''}
            <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Drag pin or tap map to move</div>
          </div>`
        );

        const marker = new maplibregl.Marker({
          element: destEl,
          anchor: 'bottom',
          draggable: true
        })
          .setLngLat([destLng, destLat])
          .setPopup(destPopup)
          .addTo(map);

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          onDestDragEnd?.(lngLat.lat, lngLat.lng);
        });

        destMarkerRef.current = marker;
      }
    } catch (e) {
      console.warn('Marker update error:', e);
    }
  }, [userCoords, destinationCoords, originName, destinationName, originWeather, destWeather, onStartDragEnd, onDestDragEnd]);

  // Render or update route polyline
  const renderRoutePolyline = useCallback((map: maplibregl.Map, route: LiveMapRoute | undefined) => {
    if (!map || !route || !route.geoPoints || route.geoPoints.length < 2) return;

    try {
      // MapLibre requires [longitude, latitude] GeoJSON coordinates
      const coordinates = route.geoPoints.map((pt) => [pt[1], pt[0]]);

      const geoJsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        properties: {
          name: route.name,
          safetyScore: route.safetyScore
        },
        geometry: {
          type: 'LineString',
          coordinates
        }
      };

      // WeatherGPT safety-coded color
      let routeColor = '#2563eb'; // Default Blue
      let glowColor = '#60a5fa';
      if (route.safetyScore >= 80) {
        routeColor = '#10b981'; // Green (Safe)
        glowColor = '#34d399';
      } else if (route.safetyScore >= 60) {
        routeColor = '#f59e0b'; // Amber (Moderate)
        glowColor = '#fbbf24';
      } else {
        routeColor = '#ef4444'; // Red (High Risk)
        glowColor = '#f87171';
      }

      // Add or update source
      const existingSource = map.getSource('carto-route-source') as maplibregl.GeoJSONSource | undefined;
      if (existingSource) {
        existingSource.setData(geoJsonData);
      } else {
        map.addSource('carto-route-source', {
          type: 'geojson',
          data: geoJsonData
        });

        // 1. Soft Route Glow Halo Layer
        map.addLayer({
          id: 'carto-route-glow',
          type: 'line',
          source: 'carto-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': glowColor,
            'line-width': 12,
            'line-opacity': 0.4
          }
        });

        // 2. High-Contrast Outer Casing Layer
        map.addLayer({
          id: 'carto-route-casing',
          type: 'line',
          source: 'carto-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0f172a',
            'line-width': 6.5,
            'line-opacity': 0.85
          }
        });

        // 3. Primary Route Stroke Layer
        map.addLayer({
          id: 'carto-route-primary',
          type: 'line',
          source: 'carto-route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': routeColor,
            'line-width': 4.5
          }
        });
      }

      // Update colors if already added
      if (map.getLayer('carto-route-primary')) {
        map.setPaintProperty('carto-route-primary', 'line-color', routeColor);
      }
      if (map.getLayer('carto-route-glow')) {
        map.setPaintProperty('carto-route-glow', 'line-color', glowColor);
      }

      // Fit map camera bounds to the route coordinates smoothly
      const lngs = coordinates.map((c) => c[0]);
      const lats = coordinates.map((c) => c[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {
          padding: { top: 40, bottom: 40, left: 40, right: 40 },
          maxZoom: 15,
          duration: 900
        }
      );
    } catch (err) {
      console.warn('Polyline render note:', err);
    }
  }, []);

  // Initialize CARTO MapLibre Map
  useEffect(() => {
    let isCancelled = false;

    async function initCartoMap() {
      if (!containerRef.current) return;
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const config = await fetchCartoConfig();
        if (isCancelled) return;

        const centerLng = userCoords[1] || 77.1512;
        const centerLat = userCoords[0] || 28.5283;

        const styleUrl = config.defaultStyle || CARTO_STYLES.voyager;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: styleUrl,
          center: [centerLng, centerLat],
          zoom: 11.5,
          pitch: 0,
          bearing: 0,
          attributionControl: {
            compact: true,
            customAttribution: '© <a href="https://carto.com" target="_blank">CARTO</a> © <a href="https://traveltime.com" target="_blank">TravelTime</a>'
          }
        });

        mapInstanceRef.current = map;

        // Add built-in Navigation Controls (Zoom & Compass)
        const navControl = new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        });
        map.addControl(navControl, 'top-right');

        // Handle Map Clicks to select coordinates
        map.on('click', (e) => {
          if (e && e.lngLat) {
            onMapClick?.();
            onMapClickCoordinates?.(e.lngLat.lat, e.lngLat.lng);
          }
        });

        // Handle Map Load
        map.on('load', () => {
          if (!isCancelled) {
            setIsLoading(false);
            renderRoutePolyline(map, activeRoute);
            updateMarkers(map);
          }
        });

        // Safety timeout fallback
        setTimeout(() => {
          if (!isCancelled) setIsLoading(false);
        }, 1200);

      } catch (err: any) {
        console.error('CARTO MapLibre initialization failure:', err);
        if (!isCancelled) {
          setErrorMessage(err?.message || 'Failed to initialize CARTO Map.');
          setIsLoading(false);
        }
      }
    }

    initCartoMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // cleanup ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // ResizeObserver for responsive behavior on desktop and mobile
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.resize();
        } catch (e) {
          // ignore
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Synchronize route and markers when route or points change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && !isLoading) {
      renderRoutePolyline(map, activeRoute);
      updateMarkers(map);
    }
  }, [activeRoute, destinationCoords, userCoords, isLoading, renderRoutePolyline, updateMarkers]);

  // Live Navigation Vehicle Marker Tracking
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeRoute || !activeRoute.geoPoints || activeRoute.geoPoints.length < 2) return;

    if (isNavigating) {
      const totalPoints = activeRoute.geoPoints.length;
      const index = Math.min(
        totalPoints - 1,
        Math.max(0, Math.floor((vehicleProgress / 100) * (totalPoints - 1)))
      );
      const pt = activeRoute.geoPoints[index];
      const lng = pt[1];
      const lat = pt[0];

      if (!vehicleMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-base animate-pulse';
        el.innerHTML = '🚗';

        const marker = new maplibregl.Marker({
          element: el,
          anchor: 'center'
        })
          .setLngLat([lng, lat])
          .addTo(map);

        vehicleMarkerRef.current = marker;
      } else {
        vehicleMarkerRef.current.setLngLat([lng, lat]);
      }

      // Smoothly pan to vehicle position
      map.easeTo({
        center: [lng, lat],
        duration: 400
      });
    } else {
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.remove();
        vehicleMarkerRef.current = null;
      }
    }
  }, [isNavigating, vehicleProgress, activeRoute]);

  // Recenter Route
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (map && activeRoute) {
      renderRoutePolyline(map, activeRoute);
    }
  };

  // Toggle 3D Tilt View
  const handleToggle3D = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const next3D = !is3DMode;
    setIs3DMode(next3D);
    map.easeTo({
      pitch: next3D ? 55 : 0,
      bearing: next3D ? 20 : 0,
      duration: 800
    });
  };

  // Cycle Basemap Style: Voyager -> Positron -> Dark Matter
  const handleCycleStyle = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const styles: ('voyager' | 'positron' | 'dark')[] = ['voyager', 'positron', 'dark'];
    const currentIndex = styles.indexOf(activeStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setActiveStyle(nextStyle);

    map.setStyle(CARTO_STYLES[nextStyle]);
    map.once('style.load', () => {
      renderRoutePolyline(map, activeRoute);
      updateMarkers(map);
    });
  };

  return (
    <div className={`relative w-full h-full min-h-0 bg-slate-100 overflow-hidden ${className}`}>
      {/* MapLibre Map Container */}
      <div
        id="carto-map-container"
        ref={containerRef}
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-black text-slate-800">Loading CARTO Vector Map</p>
            <p className="text-xs text-slate-500 font-semibold">Calculating routes via TravelTime API...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="absolute top-16 left-4 right-4 z-30 flex justify-center pointer-events-auto">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-lg max-w-md w-full flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-900">Map Service Notice</p>
              <p className="text-amber-700 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 cursor-pointer"
              title="Retry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating CARTO & TravelTime Info Badges (Cleanly placed on top-left below engine switch) */}
      <div className="absolute top-12 left-3 z-20 pointer-events-none flex flex-col space-y-1.5">
        <div className="pointer-events-auto flex items-center space-x-2 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
          <span className="text-[11px] font-black text-slate-800 tracking-tight">CARTO Vector</span>
          <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {routingSource === 'traveltime' ? 'TravelTime Routing' : 'Live Route'}
          </span>
        </div>

        {activeRoute && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm border border-slate-200 text-xs flex items-center space-x-2">
            <span className="text-emerald-600 font-black">
              {activeRoute.safetyScore >= 80 ? '🟢 Safest' : activeRoute.safetyScore >= 60 ? '🟡 Moderate' : '🔴 Caution'}
            </span>
            <span className="font-bold text-slate-700">
              {activeRoute.distanceKm} km • {activeRoute.durationMinutes}m
            </span>
          </div>
        )}
      </div>

      {/* Floating Action Controls on Right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col space-y-2 pointer-events-auto">
        {/* Toggle 3D Pitch */}
        <button
          type="button"
          onClick={handleToggle3D}
          className={`w-10 h-10 rounded-2xl shadow-lg border flex items-center justify-center transition active:scale-95 cursor-pointer font-black text-xs ${
            is3DMode
              ? 'bg-blue-600 border-blue-700 text-white'
              : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Toggle 3D Perspective"
        >
          {is3DMode ? '3D' : '2D'}
        </button>

        {/* Map Layers & Engine Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-slate-700 hover:text-blue-600 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer"
            title="Map Layers & Engine"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase text-slate-500 mt-0.5">
              {activeStyle === 'voyager' ? 'Voy' : activeStyle === 'positron' ? 'Pos' : 'Dark'}
            </span>
          </button>

          {showLayerPicker && (
            <div className="absolute right-12 top-0 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-200 w-56 text-xs z-50 space-y-2 animate-in fade-in zoom-in-95 max-h-[calc(100vh-180px)] overflow-y-auto">
              {/* Map Engine Switcher */}
              {onSwitchMapEngine && (
                <div className="pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Map Engine</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Switchable</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchMapEngine('osm');
                        setShowLayerPicker(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                        mapEngine === 'osm' ? 'bg-white shadow-xs text-blue-700 font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🌍</span>
                      <span>OSM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchMapEngine('carto');
                        setShowLayerPicker(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                        mapEngine === 'carto' ? 'bg-white shadow-xs text-blue-700 font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🗺️</span>
                      <span>CARTO 3D</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between px-2 py-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  CARTO Basemap Style
                </span>
                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Vector 3D</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveStyle('voyager');
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setStyle(CARTO_STYLES['voyager']);
                    mapInstanceRef.current.once('style.load', () => {
                      renderRoutePolyline(mapInstanceRef.current, activeRoute);
                      updateMarkers(mapInstanceRef.current);
                    });
                  }
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeStyle === 'voyager' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🏙️</span>
                <div className="leading-tight">
                  <div className="flex items-center space-x-1">
                    <span>CARTO Voyager</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-black">DEFAULT</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">Rich building footprints & roads</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStyle('positron');
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setStyle(CARTO_STYLES['positron']);
                    mapInstanceRef.current.once('style.load', () => {
                      renderRoutePolyline(mapInstanceRef.current, activeRoute);
                      updateMarkers(mapInstanceRef.current);
                    });
                  }
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeStyle === 'positron' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🗺️</span>
                <div className="leading-tight">
                  <div>CARTO Positron</div>
                  <div className="text-[9px] text-slate-400 font-normal">Clean light-gray minimal map</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStyle('dark');
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setStyle(CARTO_STYLES['dark']);
                    mapInstanceRef.current.once('style.load', () => {
                      renderRoutePolyline(mapInstanceRef.current, activeRoute);
                      updateMarkers(mapInstanceRef.current);
                    });
                  }
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  activeStyle === 'dark' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🌙</span>
                <div className="leading-tight">
                  <div>CARTO Dark Matter</div>
                  <div className="text-[9px] text-slate-400 font-normal">Night view with glowing paths</div>
                </div>
              </button>

              {/* Live Doppler Radar in Map Layers & Engine */}
              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Live Doppler Radar</span>
                  {showRadarOverlay && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      ACTIVE
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleRadar?.();
                  }}
                  className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
                    showRadarOverlay
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CloudRain className={`w-4 h-4 ${showRadarOverlay ? 'text-white' : 'text-blue-500'}`} />
                    <span>Live Doppler Radar</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    showRadarOverlay ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {showRadarOverlay ? 'ON' : 'OFF'}
                  </span>
                </button>

                {showRadarOverlay && (
                  <div className="bg-slate-900 text-white p-2 rounded-xl text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {radarFrames[activeFrameIndex]?.timeFormatted || 'Live Now'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recenter Route */}
        <button
          type="button"
          onClick={handleRecenter}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-slate-700 hover:text-blue-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Recenter Route"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Current Location GPS Re-center */}
        <button
          type="button"
          onClick={handleRecenterGps}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer active:scale-95"
          title="Re-center on My Location"
        >
          <LocateFixed className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Zoom In & Zoom Out Buttons */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition border-b border-slate-100 cursor-pointer active:scale-95"
            title="Zoom In"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Bottom Interactive Guidance */}
      <div className={`absolute z-10 pointer-events-none transition-all duration-300 ${hasBottomCard ? 'bottom-[230px] sm:bottom-[215px]' : 'bottom-3'} left-3.5`}>
        <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
          💡 Tap map or drag markers to update Start or Destination
        </span>
      </div>

      {/* Floating Doppler Rain Radar Interactive HUD & Timeline Bar - shifted to Map Layers & Engine Section */}
      {showRadarOverlay && (
        <div className="absolute top-14 left-3 right-16 sm:right-auto sm:left-3 z-30 pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-2.5 shadow-2xl border border-slate-700/80 max-w-xs sm:max-w-sm animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-white">Live Doppler Radar</span>
              {radarLoading && (
                <span className="text-[10px] text-blue-400 animate-pulse">Syncing...</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                {radarFrames[activeFrameIndex]?.timeFormatted || 'Live Now'}
              </span>
              <button
                type="button"
                onClick={() => onToggleRadar?.()}
                className="w-5 h-5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Hide Radar Overlay"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Frame Controls & Scrubber */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsRadarPlaying((prev) => !prev)}
              disabled={radarFrames.length <= 1}
              className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50"
              title={isRadarPlaying ? 'Pause Radar Loop' : 'Play Radar Loop'}
            >
              {isRadarPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRadarPlaying(false);
                setActiveFrameIndex((prev) => (prev > 0 ? prev - 1 : radarFrames.length - 1));
              }}
              disabled={radarFrames.length <= 1}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50"
              title="Previous Frame"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Timeline Slider */}
            <input
              type="range"
              min={0}
              max={Math.max(0, radarFrames.length - 1)}
              value={activeFrameIndex >= 0 ? activeFrameIndex : 0}
              onChange={(e) => {
                setIsRadarPlaying(false);
                setActiveFrameIndex(parseInt(e.target.value, 10));
              }}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />

            <button
              type="button"
              onClick={() => {
                setIsRadarPlaying(false);
                setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
              }}
              disabled={radarFrames.length <= 1}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50"
              title="Next Frame"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Precipitation Intensity Scale */}
          <div className="space-y-1">
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 via-orange-500 to-purple-600"></div>
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
              <span>Light Rain</span>
              <span>Moderate</span>
              <span>Heavy</span>
              <span className="text-purple-300 font-bold">Severe Storm</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
