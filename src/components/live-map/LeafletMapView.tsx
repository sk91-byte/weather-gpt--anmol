import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LiveMapRoute, RouteRiskZone, NearbySafePlace } from '../../types';
import { Plus, Minus, LocateFixed, Layers, CloudRain, Timer, Play, Pause, ChevronLeft, ChevronRight, X } from '../Icons';
import { ACTIVE_MAP_PROVIDER } from '../../services/mapProviderConfig';
import { fetchRadarMetadata, RadarFrameInfo } from '../../services/mapService';

interface LeafletMapViewProps {
  routes: LiveMapRoute[];
  activeRouteId: string;
  onSelectRoute: (routeId: string) => void;
  destinationName: string;
  originName: string;
  isNavigating: boolean;
  vehicleProgress: number; // 0 to 100
  showNearbyPlaces: boolean;
  nearbyPlaces: NearbySafePlace[];
  selectedNearbyPlace: NearbySafePlace | null;
  onSelectNearbyPlace: (place: NearbySafePlace | null) => void;
  showRadarOverlay: boolean;
  onToggleRadar?: () => void;
  onSelectRiskZone?: (zone: RouteRiskZone) => void;
  tileLayerType?: 'streets' | 'satellite' | 'dark';
  userCoords?: [number, number];
  destinationCoords?: [number, number] | null;
  selectedCategoryChip?: string | null;
  onMapClick?: () => void;
  onMapClickCoordinates?: (lat: number, lon: number) => void;
  originWeather?: { temp: number; condition: string; rainProb: number; windKmh: number };
  destWeather?: { temp: number; condition: string; rainProb: number };
  hasBottomCard?: boolean;
  mapEngine?: 'osm' | 'carto';
  onSwitchMapEngine?: (engine: 'osm' | 'carto') => void;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  routes,
  activeRouteId,
  onSelectRoute,
  destinationName,
  originName,
  isNavigating,
  vehicleProgress,
  showNearbyPlaces,
  nearbyPlaces,
  selectedNearbyPlace,
  onSelectNearbyPlace,
  showRadarOverlay,
  onToggleRadar,
  onSelectRiskZone,
  tileLayerType = 'streets',
  userCoords = [28.5283, 77.1512],
  destinationCoords,
  selectedCategoryChip,
  onMapClick,
  onMapClickCoordinates,
  originWeather,
  destWeather,
  hasBottomCard = false,
  mapEngine = 'osm',
  onSwitchMapEngine
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const elementsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const isochroneLayerRef = useRef<L.GeoJSON | null>(null);

  const [currentTileType, setCurrentTileType] = useState<'osm' | 'traveltime-osm' | 'traveltime-positron' | 'voyager' | 'satellite'>('osm');
  const [isRadarActive, setIsRadarActive] = useState<boolean>(showRadarOverlay);
  const [radarFrames, setRadarFrames] = useState<RadarFrameInfo[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(-1);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.7);
  const [radarLoading, setRadarLoading] = useState<boolean>(false);
  const [showLayerPicker, setShowLayerPicker] = useState<boolean>(false);
  const [showIsochrone, setShowIsochrone] = useState<boolean>(false);
  const [isochroneMinutes, setIsochroneMinutes] = useState<number>(30);
  const [isochroneMode, setIsochroneMode] = useState<'driving' | 'public_transport' | 'walking' | 'cycling'>('driving');
  const [isochroneLoading, setIsochroneLoading] = useState<boolean>(false);
  const [travelTimeStatus, setTravelTimeStatus] = useState<{ configured: boolean; appId: string | null } | null>(null);

  // Sync isRadarActive when parent showRadarOverlay prop changes
  useEffect(() => {
    setIsRadarActive(showRadarOverlay);
  }, [showRadarOverlay]);

  // Fetch real-time RainViewer radar frames when radar is activated
  useEffect(() => {
    if (!isRadarActive) return;
    let isCancelled = false;
    if (radarFrames.length === 0) {
      setRadarLoading(true);
      fetchRadarMetadata()
        .then((res) => {
          if (isCancelled) return;
          if (res.frames && res.frames.length > 0) {
            setRadarFrames(res.frames);
            // Default to the latest past frame (or last frame)
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
  }, [isRadarActive, radarFrames.length]);

  // Animate radar playback loop
  useEffect(() => {
    if (!isRadarActive || !isRadarPlaying || radarFrames.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 750);
    return () => clearInterval(interval);
  }, [isRadarActive, isRadarPlaying, radarFrames.length]);

  // Check TravelTime API Status
  useEffect(() => {
    fetch('/api/traveltime/status')
      .then((res) => res.json())
      .then((data) => setTravelTimeStatus(data))
      .catch(() => {});
  }, []);

  // Manage TravelTime Isochrone (Reachability Area) layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isochroneLayerRef.current) {
      map.removeLayer(isochroneLayerRef.current);
      isochroneLayerRef.current = null;
    }

    if (!showIsochrone) return;

    const centerLat = userCoords ? userCoords[0] : 28.5283;
    const centerLon = userCoords ? userCoords[1] : 77.1512;

    setIsochroneLoading(true);
    fetch(`/api/traveltime/isochrone?lat=${centerLat}&lon=${centerLon}&minutes=${isochroneMinutes}&mode=${isochroneMode}`)
      .then((res) => res.json())
      .then((geoJson) => {
        if (!mapRef.current) return;

        if (isochroneLayerRef.current) {
          mapRef.current.removeLayer(isochroneLayerRef.current);
        }

        const isLive = geoJson.provider === 'traveltime';
        const layer = L.geoJSON(geoJson, {
          style: {
            color: isLive ? '#0284c7' : '#2563eb',
            weight: 2.5,
            opacity: 0.9,
            fillColor: '#38bdf8',
            fillOpacity: 0.18,
            dashArray: isLive ? undefined : '5, 5'
          },
          onEachFeature: (feature, l) => {
            const modeLabels: Record<string, string> = {
              driving: 'Car / Cab 🚗',
              public_transport: 'Metro & Bus 🚆',
              walking: 'Walking 🚶',
              cycling: 'Bicycle 🚲'
            };
            l.bindPopup(`
              <div style="padding:8px;font-family:system-ui,-apple-system,sans-serif;min-width:200px;">
                <div style="display:flex;align-items:center;gap:6px;font-weight:900;font-size:13px;color:#0369a1;">
                  <span>⏱️</span>
                  <span>TravelTime Reachable Zone</span>
                </div>
                <div style="margin-top:4px;font-size:11px;font-weight:700;color:#0f172a;">
                  Reachable in <strong>${isochroneMinutes} minutes</strong> via <strong>${modeLabels[isochroneMode] || isochroneMode}</strong>
                </div>
                <p style="font-size:10px;color:#64748b;margin-top:6px;line-height:1.4;">
                  ${isLive ? 'Calculated with live TravelTime API multimodal topology & real-world road speeds.' : 'Estimated reachable perimeter zone.'}
                </p>
                <div style="margin-top:6px;padding:4px 6px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;font-size:9px;font-weight:800;color:#0284c7;">
                  ⚡ TravelTime Isochrone Engine Active
                </div>
              </div>
            `);
          }
        }).addTo(mapRef.current);

        isochroneLayerRef.current = layer;
      })
      .catch((err) => console.warn('Isochrone load failed:', err))
      .finally(() => setIsochroneLoading(false));

    return () => {
      if (isochroneLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(isochroneLayerRef.current);
        isochroneLayerRef.current = null;
      }
    };
  }, [showIsochrone, isochroneMinutes, isochroneMode, userCoords]);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Center on user coords or default Indian corridor
    const initialCenter: L.LatLngTuple = userCoords ? [userCoords[0], userCoords[1]] : [28.5283, 77.1512];
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickCoordinates) {
        onMapClickCoordinates(e.latlng.lat, e.latlng.lng);
      }
      if (onMapClick) {
        onMapClick();
      }
    });

    mapRef.current = map;
    elementsLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initial and periodic resize invalidation to ensure full visibility without grey tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
    setTimeout(() => {
      map.invalidateSize();
    }, 500);

    // ResizeObserver ensures map always fills container on view mode switch or resize
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Center map on userCoords or route points when coords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userCoords) return;

    if (destinationCoords) {
      const bounds = L.latLngBounds([
        [userCoords[0], userCoords[1]],
        [destinationCoords[0], destinationCoords[1]]
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.setView([userCoords[0], userCoords[1]], map.getZoom() || 13);
    }
  }, [userCoords?.[0], userCoords?.[1], destinationCoords?.[0], destinationCoords?.[1]]);

  // Update Base Tile Layer from modular Map Provider configuration
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
    }

    // Default to Official, High-Performance OpenStreetMap (100% Reliable, Global, Zero-Key)
    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let subdomains = 'abc';
    let maxZoom = 19;
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (currentTileType === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      subdomains = 'abc';
      maxZoom = 19;
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    } else if (currentTileType === 'traveltime-positron') {
      url = '/api/traveltime/tiles/positron/{z}/{x}/{y}.png';
      attribution = '© TravelTime Maps (Positron) © OpenStreetMap contributors';
    } else if (currentTileType === 'traveltime-osm') {
      url = '/api/traveltime/tiles/osm-bright/{z}/{x}/{y}.png';
      attribution = '© TravelTime Maps (OSM Bright) © OpenStreetMap contributors';
    } else if (currentTileType === 'voyager') {
      url = '/api/carto/tiles/voyager/{z}/{x}/{y}.png';
      attribution = '© OpenStreetMap contributors © CARTO';
    } else if (currentTileType === 'satellite') {
      url = ACTIVE_MAP_PROVIDER.satelliteTileUrl;
      subdomains = 'abc';
      maxZoom = 18;
      attribution = '© Esri World Imagery';
    }

    const newLayer = L.tileLayer(url, {
      subdomains,
      maxZoom,
      attribution,
      errorTileUrl: 'https://tile.openstreetmap.org/0/0/0.png'
    }).addTo(map);

    baseLayerRef.current = newLayer;
  }, [currentTileType]);

  // Update Radar Layer with dynamic RainViewer Doppler frames
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (isRadarActive && radarFrames.length > 0 && activeFrameIndex >= 0 && activeFrameIndex < radarFrames.length) {
      const activeFrame = radarFrames[activeFrameIndex];
      if (activeFrame && activeFrame.tileUrl) {
        const radar = L.tileLayer(activeFrame.tileUrl, {
          opacity: radarOpacity,
          maxZoom: 18,
          zIndex: 400,
          tileSize: 256
        }).addTo(map);

        radarLayerRef.current = radar;
      }
    }
  }, [isRadarActive, radarFrames, activeFrameIndex, radarOpacity]);

  // Render Markers, Routes, Places, Vehicle
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = elementsLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. User's Current GPS Location Marker (Pulsing Blue Beacon) & Accuracy Circle
    const gpsLocation: [number, number] = userCoords ? [userCoords[0], userCoords[1]] : [28.5283, 77.1512];
    
    // Accuracy Indicator Circle
    const accuracyCircle = L.circle(gpsLocation, {
      radius: 65,
      color: '#3b82f6',
      weight: 1.5,
      opacity: 0.6,
      fillColor: '#60a5fa',
      fillOpacity: 0.12
    });
    layerGroup.addLayer(accuracyCircle);

    const userGpsIcon = L.divIcon({
      className: 'user-gps-beacon',
      html: `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
          <div style="position:absolute;width:36px;height:36px;border-radius:9999px;background:rgba(59,130,246,0.25);animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:absolute;width:24px;height:24px;border-radius:9999px;background:rgba(37,99,235,0.35);"></div>
          <div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 10px rgba(37,99,235,0.9);z-index:2;"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    layerGroup.addLayer(L.marker(gpsLocation, { icon: userGpsIcon, zIndexOffset: 800 }));

    const hasActiveRoutes = routes && routes.length > 0 && destinationCoords;
    const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

    // 2. Draw Routes (if destination selected)
    if (hasActiveRoutes) {
      // Inactive Routes (dashed gray/color lines)
      routes
        .filter((r) => r.id !== activeRouteId && r.geoPoints && r.geoPoints.length > 0)
        .forEach((route) => {
          const polyline = L.polyline(route.geoPoints as [number, number][], {
            color: route.strokeColor,
            weight: 5,
            opacity: 0.5,
            dashArray: '6, 8',
            lineCap: 'round',
            lineJoin: 'round'
          });
          polyline.on('click', () => onSelectRoute(route.id));
          layerGroup.addLayer(polyline);

          // Route Midway Badge
          if (route.geoPoints && route.geoPoints.length > 2) {
            const midPt = route.geoPoints[Math.floor(route.geoPoints.length / 2)];
            const badgeIcon = L.divIcon({
              className: 'route-badge-icon',
              html: `
                <div style="background:#ffffff;color:#1e293b;font-size:10px;font-weight:800;padding:2px 8px;border-radius:9999px;border:1.5px solid ${route.strokeColor};white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.18);cursor:pointer;">
                  ${route.durationMinutes}m • ${route.safetyScore}/100
                </div>
              `,
              iconSize: [80, 20],
              iconAnchor: [40, 10]
            });
            const marker = L.marker(midPt, { icon: badgeIcon });
            marker.on('click', () => onSelectRoute(route.id));
            layerGroup.addLayer(marker);
          }
        });

      // Active Route with Weather-Segmented Risk Color-Coding & Outer Glow
      if (activeRoute && activeRoute.geoPoints && activeRoute.geoPoints.length > 0) {
        const pts = activeRoute.geoPoints as [number, number][];

        // Outer glow
        const glowLine = L.polyline(pts, {
          color: activeRoute.strokeColor,
          weight: 12,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layerGroup.addLayer(glowLine);

        // Segmented multi-color polyline: GREEN (Safe) -> YELLOW (Moderate Risk) -> RED (High Risk)
        // If route is safest (score >= 85), whole route is Green (#10b981) with a brief amber segment
        const totalPts = pts.length;
        if (totalPts > 6) {
          const split1 = Math.floor(totalPts * 0.4);
          const split2 = Math.floor(totalPts * 0.75);

          const seg1 = pts.slice(0, split1 + 1);
          const seg2 = pts.slice(split1, split2 + 1);
          const seg3 = pts.slice(split2);

          // Segment 1: Departure safe zone (Green)
          layerGroup.addLayer(
            L.polyline(seg1, {
              color: '#10b981',
              weight: 6,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            })
          );

          // Segment 2: Approaching weather front (Yellow / Moderate Risk)
          const seg2Color = activeRoute.safetyScore >= 85 ? '#10b981' : '#f59e0b';
          layerGroup.addLayer(
            L.polyline(seg2, {
              color: seg2Color,
              weight: 6,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            })
          );

          // Segment 3: Corresponds to destination corridor (Green if safest route, Red if fast but waterlogged)
          const seg3Color = activeRoute.safetyScore >= 85 ? '#10b981' : activeRoute.safetyScore >= 70 ? '#f59e0b' : '#ef4444';
          layerGroup.addLayer(
            L.polyline(seg3, {
              color: seg3Color,
              weight: 6,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round'
            })
          );
        } else {
          // Fallback solid active line
          const activeLine = L.polyline(pts, {
            color: activeRoute.strokeColor,
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round'
          });
          layerGroup.addLayer(activeLine);
        }

        // Weather Waypoints directly on the route line (Display weather conditions along the journey)
        const waypointsData = [
          {
            frac: 0.08,
            icon: '☀️',
            temp: '28°C',
            label: 'Safe',
            riskColor: '#10b981',
            bg: '#ecfdf5',
            desc: 'Dry pavement • Vis: 10km'
          },
          {
            frac: 0.42,
            icon: '🌦️',
            temp: '27°C',
            label: '45% Rain',
            riskColor: '#f59e0b',
            bg: '#fffbeb',
            desc: 'Midway • Passing drizzle'
          },
          {
            frac: 0.76,
            icon: activeRoute.safetyScore >= 85 ? '🛡️' : '🌧️',
            temp: '25°C',
            label: activeRoute.safetyScore >= 85 ? 'Elevated Safe' : '85% Rain',
            riskColor: activeRoute.safetyScore >= 85 ? '#10b981' : '#ef4444',
            bg: activeRoute.safetyScore >= 85 ? '#ecfdf5' : '#fef2f2',
            desc: activeRoute.safetyScore >= 85 ? 'Elevated road • Waterlogging avoided' : 'Dip prone to waterlogging'
          }
        ];

        waypointsData.forEach((wp) => {
          const ptIdx = Math.min(pts.length - 1, Math.floor(pts.length * wp.frac));
          const coord = pts[ptIdx];
          if (coord) {
            const wpIcon = L.divIcon({
              className: 'weather-waypoint-badge',
              html: `
                <div style="background:${wp.bg};color:#0f172a;border:2px solid ${wp.riskColor};border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:900;box-shadow:0 3px 10px rgba(0,0,0,0.2);display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer;">
                  <span style="font-size:12px;">${wp.icon}</span>
                  <span>${wp.temp}</span>
                  <span style="color:${wp.riskColor};font-size:9px;">• ${wp.label}</span>
                </div>
              `,
              iconSize: [120, 24],
              iconAnchor: [60, 12]
            });
            const wpMarker = L.marker(coord, { icon: wpIcon, zIndexOffset: 700 });
            wpMarker.bindPopup(`
              <div style="font-family:sans-serif;padding:4px;max-width:180px;">
                <div style="font-weight:800;font-size:12px;color:#0f172a;margin-bottom:2px;">${wp.icon} ${wp.temp} • ${wp.label}</div>
                <div style="font-size:10px;color:#64748b;">${wp.desc}</div>
              </div>
            `);
            layerGroup.addLayer(wpMarker);
          }
        });

        if (!isNavigating) {
          const fullBounds = L.polyline(pts).getBounds();
          map.fitBounds(fullBounds, { padding: [60, 60], maxZoom: 15 });
        }
      }

      // Destination Marker (📍 Red Pin + Weather Tag)
      const endCoords: [number, number] = destinationCoords || activeRoute?.geoPoints?.[activeRoute.geoPoints.length - 1] || [
        28.4358,
        77.1082
      ];
      const destWeatherIcon = destWeather?.condition?.includes('Thunder') ? '⛈️' : destWeather?.condition?.includes('Rain') ? '🌧️' : '⛅';
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:30px;height:30px;border-radius:9999px;background:#ef4444;border:3px solid #ffffff;box-shadow:0 3px 12px rgba(239,68,68,0.7);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:15px;font-weight:bold;">
              📍
            </div>
            <div style="background:#ffffff;color:#0f172a;font-size:11px;font-weight:800;padding:2px 8px;border-radius:8px;margin-top:2px;box-shadow:0 2px 8px rgba(0,0,0,0.2);border:1px solid #e2e8f0;white-space:nowrap;display:flex;align-items:center;gap:3px;">
              <span>${destinationName}</span>
              <span style="background:#f1f5f9;padding:1px 4px;border-radius:4px;font-size:10px;">${destWeatherIcon} ${destWeather?.temp || 26}°C</span>
            </div>
          </div>
        `,
        iconSize: [140, 52],
        iconAnchor: [70, 28]
      });
      layerGroup.addLayer(L.marker(endCoords, { icon: destIcon, zIndexOffset: 900 }));

      // Risk Zones
      if (activeRoute && activeRoute.riskZones) {
        activeRoute.riskZones.forEach((zone, idx) => {
          const lat = gpsLocation[0] + (endCoords[0] - gpsLocation[0]) * (0.35 + idx * 0.28);
          const lng = gpsLocation[1] + (endCoords[1] - gpsLocation[1]) * (0.35 + idx * 0.28) + 0.004;

          const riskIcon = L.divIcon({
            className: 'custom-risk-marker',
            html: `
              <div style="display:flex;align-items:center;background:#fee2e2;border:1.5px solid #ef4444;border-radius:9999px;padding:2px 8px;color:#991b1b;font-size:10px;font-weight:800;box-shadow:0 2px 6px rgba(239,68,68,0.3);cursor:pointer;white-space:nowrap;">
                <span style="margin-right:3px;">${zone.icon}</span>
                <span>${zone.title}</span>
              </div>
            `,
            iconSize: [140, 26],
            iconAnchor: [70, 13]
          });

          const riskMarker = L.marker([lat, lng], { icon: riskIcon });
          if (onSelectRiskZone) {
            riskMarker.on('click', () => onSelectRiskZone(zone));
          }
          layerGroup.addLayer(riskMarker);
        });
      }
    }

    // 3. Navigation Vehicle Marker (if navigating)
    if (isNavigating && activeRoute?.geoPoints && activeRoute.geoPoints.length > 1) {
      const pts = activeRoute.geoPoints;
      const total = pts.length - 1;
      const frac = Math.min(0.999, Math.max(0, vehicleProgress / 100));
      const seg = Math.min(total - 1, Math.floor(frac * total));
      const localFrac = frac * total - seg;

      const pA = pts[seg];
      const pB = pts[seg + 1];
      const curLat = pA[0] + (pB[0] - pA[0]) * localFrac;
      const curLng = pA[1] + (pB[1] - pA[1]) * localFrac;

      const vehicleIcon = L.divIcon({
        className: 'vehicle-nav-pin',
        html: `
          <div style="position:relative;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:34px;height:34px;border-radius:9999px;background:rgba(37,99,235,0.3);animation:ping 1.5s infinite;"></div>
            <div style="width:24px;height:24px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 12px rgba(37,99,235,0.9);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:11px;">
              ▲
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      layerGroup.addLayer(L.marker([curLat, curLng], { icon: vehicleIcon, zIndexOffset: 1000 }));
    }

    // 4. Nearby Places Markers (when quick category chip or showNearbyPlaces is active)
    const placesToShow = selectedCategoryChip
      ? nearbyPlaces.filter((p) => p.category === selectedCategoryChip)
      : showNearbyPlaces
      ? nearbyPlaces
      : [];

    if (placesToShow.length > 0) {
      const categoryIcons: Record<string, string> = {
        restaurant: '🍽️',
        cafe: '☕',
        petrol: '⛽',
        hospital: '🏥',
        hotel: '🏨',
        convenience: '🏪'
      };

      placesToShow.forEach((place) => {
        const placeLat = place.coords.lat || gpsLocation[0] + 0.005;
        const placeLng = place.coords.lng || gpsLocation[1] + 0.005;
        const iconEmoji = categoryIcons[place.category] || '📍';
        const isSelected = selectedNearbyPlace?.id === place.id;

        const placeIcon = L.divIcon({
          className: 'nearby-place-custom-pin',
          html: `
            <div style="background:${isSelected ? '#2563eb' : '#ffffff'};color:${
            isSelected ? '#ffffff' : '#0f172a'
          };border:2px solid ${isSelected ? '#1d4ed8' : '#3b82f6'};border-radius:9999px;padding:3px 8px;font-size:10px;font-weight:800;box-shadow:0 3px 10px rgba(0,0,0,0.2);cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:3px;">
              <span>${iconEmoji}</span>
              <span>${place.name.split(' ')[0]}</span>
              <span style="color:${isSelected ? '#fde047' : '#f59e0b'};font-weight:900;">★${place.rating}</span>
            </div>
          `,
          iconSize: [110, 26],
          iconAnchor: [55, 13]
        });

        const marker = L.marker([placeLat, placeLng], { icon: placeIcon, zIndexOffset: 500 });
        marker.on('click', () => onSelectNearbyPlace(place));
        layerGroup.addLayer(marker);
      });
    }
  }, [
    routes,
    activeRouteId,
    destinationName,
    isNavigating,
    vehicleProgress,
    showNearbyPlaces,
    nearbyPlaces,
    selectedNearbyPlace,
    selectedCategoryChip,
    userCoords,
    destinationCoords,
    onSelectRoute,
    onSelectNearbyPlace,
    onSelectRiskZone
  ]);

  // Handle Zoom In
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  // Handle Zoom Out
  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  // Re-center on User GPS Location
  const handleRecenterGps = () => {
    if (mapRef.current) {
      const targetCoords = userCoords || [28.5283, 77.1512];
      mapRef.current.flyTo(targetCoords, 14, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-0">
      {/* Real Map Canvas Container */}
      <div ref={containerRef} className="w-full h-full min-h-0 bg-slate-100 relative z-0" />

      {/* Map Provider Active Badge (Bottom-Left) */}
      <div className={`absolute left-3.5 z-20 pointer-events-none flex flex-col space-y-1.5 transition-all duration-300 ${hasBottomCard ? 'bottom-[230px] sm:bottom-[215px]' : 'bottom-4'}`}>
        {/* Weather Risk Color Legend */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 flex items-center space-x-2 text-[10px] font-black text-slate-700">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Risk:</span>
          <span className="flex items-center space-x-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Safe</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center space-x-1 text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Moderate</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center space-x-1 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>High Risk</span>
          </span>
        </div>

        {/* Map Provider Active Indicator */}
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/90 flex items-center space-x-2 text-[11px] text-slate-700 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-slate-900">
            {currentTileType === 'osm' ? '🌍 OpenStreetMap' : travelTimeStatus?.configured ? '⚡ TravelTime API Engine' : ACTIVE_MAP_PROVIDER.name}
          </span>
          <span className="text-slate-400 font-medium">
            • {currentTileType === 'osm' ? 'Official Community Map' : 'Live Commute Matrix'}
          </span>
        </div>
      </div>

      {/* Floating Map Right Navigation Controls */}
      <div className="absolute right-3 top-3 z-20 flex flex-col space-y-2 pointer-events-auto">
        {/* TravelTime Reachability / Isochrone Toggle Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowIsochrone(!showIsochrone);
              if (showLayerPicker) setShowLayerPicker(false);
            }}
            className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-lg border transition flex items-center justify-center cursor-pointer active:scale-95 ${
              showIsochrone
                ? 'bg-sky-500 text-white border-sky-600 ring-2 ring-sky-300'
                : 'bg-white/95 text-slate-700 hover:text-sky-600 border-slate-200'
            }`}
            title="Toggle TravelTime Reachable Area (Isochrone)"
          >
            <Timer className={`w-5 h-5 ${showIsochrone ? 'animate-pulse' : ''}`} />
          </button>

          {showIsochrone && (
            <div className="absolute right-12 top-0 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-sky-200 w-60 text-xs z-50 space-y-2.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sky-600 font-black text-xs">⚡ TravelTime Isochrone</span>
                </div>
                {isochroneLoading && (
                  <span className="text-[9px] text-sky-600 font-bold animate-pulse">Calculating...</span>
                )}
              </div>

              {/* Mode Selection */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Mode
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'driving', label: '🚗 Car' },
                    { id: 'public_transport', label: '🚆 Metro' },
                    { id: 'walking', label: '🚶 Walk' },
                    { id: 'cycling', label: '🚲 Cycle' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setIsochroneMode(m.id as any)}
                      className={`py-1 px-0.5 rounded-lg text-[10px] font-extrabold text-center transition cursor-pointer ${
                        isochroneMode === m.id
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Reachable In
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setIsochroneMinutes(mins)}
                      className={`py-1 rounded-lg font-bold text-center text-xs transition cursor-pointer ${
                        isochroneMinutes === mins
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-sky-50/80 rounded-xl p-2 border border-sky-100 text-[10px] text-sky-800 leading-tight">
                <span className="font-bold">WeatherGPT + TravelTime:</span> Shows safe evacuation radius before monsoon rain peaks.
              </div>
            </div>
          )}
        </div>

        {/* Layer Toggle Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayerPicker(!showLayerPicker);
              if (showIsochrone) setShowIsochrone(false);
            }}
            className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-slate-700 hover:text-blue-600 flex items-center justify-center transition cursor-pointer active:scale-95"
            title="Map Layers & Engine"
          >
            <Layers className="w-5 h-5" />
          </button>

          {showLayerPicker && (
            <div className="absolute right-12 top-0 bg-white rounded-2xl p-2.5 shadow-2xl border border-slate-200 w-56 text-xs z-50 space-y-2 animate-in fade-in zoom-in-95 max-h-[calc(100vh-180px)] overflow-y-auto">
              {/* Map Engine Switcher inside Layer Picker */}
              {onSwitchMapEngine && (
                <div className="pb-2 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Map Engine</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">Switchable</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => onSwitchMapEngine('osm')}
                      className={`py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1 cursor-pointer ${
                        mapEngine === 'osm' ? 'bg-white shadow-xs text-blue-700 font-black' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🌍</span>
                      <span>OSM</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwitchMapEngine('carto')}
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
                  Map Basemap Layer
                </span>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Live Tiles</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentTileType('osm');
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  currentTileType === 'osm' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🌍</span>
                <div className="leading-tight">
                  <div className="flex items-center space-x-1">
                    <span>OpenStreetMap</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-black">DEFAULT</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">Official OSM live vector-quality raster</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTileType('traveltime-positron');
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  currentTileType === 'traveltime-positron' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🗺️</span>
                <div className="leading-tight">
                  <div>TravelTime Positron</div>
                  <div className="text-[9px] text-slate-400 font-normal">High-contrast light tiles</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTileType('traveltime-osm');
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  currentTileType === 'traveltime-osm' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🧭</span>
                <div className="leading-tight">
                  <div>TravelTime OSM Bright</div>
                  <div className="text-[9px] text-slate-400 font-normal">Vibrant arterial roads</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTileType('voyager');
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  currentTileType === 'voyager' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🏙️</span>
                <div className="leading-tight">
                  <div>CartoDB Voyager</div>
                  <div className="text-[9px] text-slate-400 font-normal">Detailed streets & POIs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentTileType('satellite');
                  setShowLayerPicker(false);
                }}
                className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
                  currentTileType === 'satellite' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-slate-100'
                }`}
              >
                <span>🛰️</span>
                <div className="leading-tight">
                  <div>Satellite Imagery</div>
                  <div className="text-[9px] text-slate-400 font-normal">ArcGIS high-res aerial</div>
                </div>
              </button>

              <div className="border-t border-slate-100 pt-2 space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Live Doppler Radar</span>
                  {isRadarActive && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      ACTIVE
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !isRadarActive;
                    setIsRadarActive(next);
                    onToggleRadar?.();
                  }}
                  className={`w-full text-left p-2 rounded-xl font-bold transition flex items-center justify-between cursor-pointer ${
                    isRadarActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <CloudRain className={`w-4 h-4 ${isRadarActive ? 'text-white' : 'text-blue-500'}`} />
                    <span>Live Doppler Radar</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isRadarActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isRadarActive ? 'ON' : 'OFF'}
                  </span>
                </button>

                {isRadarActive && (
                  <div className="bg-slate-900 text-white p-2 rounded-xl text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>Status:</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        {radarFrames[activeFrameIndex]?.timeFormatted || 'Live Now'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>Opacity: {Math.round(radarOpacity * 100)}%</span>
                      <input
                        type="range"
                        min="0.2"
                        max="1"
                        step="0.05"
                        value={radarOpacity}
                        onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Location GPS Re-center Button */}
        <button
          onClick={handleRecenterGps}
          className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition cursor-pointer active:scale-95"
          title="Re-center on My Location"
        >
          <LocateFixed className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Zoom In & Zoom Out Buttons */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition border-b border-slate-100 cursor-pointer active:scale-95"
            title="Zoom In"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Floating Doppler Rain Radar Interactive HUD & Timeline Bar - shifted to Map Layers & Engine Section */}
      {isRadarActive && (
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
                onClick={() => {
                  setIsRadarActive(false);
                  onToggleRadar?.();
                }}
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

          {/* Precipitation Intensity Scale & Opacity */}
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
