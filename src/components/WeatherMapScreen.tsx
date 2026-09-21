import React, { useState, useMemo, useEffect } from 'react';
import { WeatherData, LiveMapRoute, NearbySafePlace, DepartureTimeOption, RouteTrip } from '../types';
import {
  DESTINATION_PRESETS,
  NEARBY_SAFE_PLACES,
  buildWeatherAwareRoutes,
  DestinationPreset
} from '../data/liveMapData';
import { fetchWeatherAwareRoutes, reverseGeocodeLocation, fetchAIWeatherRouteAnalysis, fetchJourneySummary } from '../services/mapService';
import { CartoTravelTimeSearchBar } from './live-map/CartoTravelTimeSearchBar';
import { CartoMapView } from './live-map/CartoMapView';
import { LeafletMapView } from './live-map/LeafletMapView';
import { RouteIntelligencePage } from './live-map/RouteIntelligencePage';
import { RouteAnalysisLoading } from './live-map/RouteAnalysisLoading';
import { NearbyPlacesListSheet } from './live-map/NearbyPlacesListSheet';
import { SmartWaitModeOverlay } from './live-map/SmartWaitModeOverlay';
import { LiveNavigationHUD } from './live-map/LiveNavigationHUD';
import { RouteWeatherTimelineModal } from './live-map/RouteWeatherTimelineModal';
import { ExplainableAIModal } from './live-map/ExplainableAIModal';
import { ShouldILeaveNowModal } from './live-map/ShouldILeaveNowModal';
import { JourneySummaryModal } from './live-map/JourneySummaryModal';
import { Sparkles, Navigation, X, ShieldAlert, ArrowRight, Clock, Database, Check } from './Icons';
import { useAuth } from '../context/AuthContext';
import { saveTripToFirestore } from '../lib/firebase';

interface WeatherMapScreenProps {
  initialLayer?: string;
  onSelectCity: (cityName: string) => void;
  onBackToHome: () => void;
  onUseLiveLocation?: () => void;
  isLocating?: boolean;
  currentWeather?: WeatherData;
  activeTrip?: RouteTrip;
}

export const WeatherMapScreen: React.FC<WeatherMapScreenProps> = ({
  initialLayer,
  onSelectCity,
  onBackToHome,
  onUseLiveLocation,
  isLocating,
  currentWeather,
  activeTrip
}) => {
  // Page view mode: Page 1 ('live-map') vs Page 2 ('route-intelligence')
  const [currentPage, setCurrentPage] = useState<'live-map' | 'route-intelligence'>('live-map');
  const [mapEngine, setMapEngine] = useState<'osm' | 'carto'>('osm');
  const [showRadarOverlay, setShowRadarOverlay] = useState<boolean>(
    () => initialLayer === 'radar' || initialLayer === 'rain'
  );

  // Start Location (Origin) state
  const [selectedOrigin, setSelectedOrigin] = useState<DestinationPreset>(() => {
    if (activeTrip?.from) {
      const match = DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase().includes(activeTrip.from.toLowerCase()) ||
          activeTrip.from.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) return match;
    }
    const isDehradun = currentWeather?.city?.toLowerCase() === 'dehradun';
    return {
      id: 'default-origin-live',
      name: currentWeather?.city ? `${currentWeather.city} (Current Location)` : 'Home (Vasant Kunj)',
      subtitle: currentWeather?.city ? `Active City: ${currentWeather.city}` : 'Sector B, Pocket 1, New Delhi',
      category: 'home',
      city: currentWeather?.city || 'Delhi NCR',
      coords: isDehradun
        ? { x: 50, y: 50, lat: 30.3165, lon: 78.0322 }
        : { x: 50, y: 50, lat: 28.5283, lon: 77.1512 }
    };
  });

  // Sync origin coordinates dynamically when active city or live coordinates change
  useEffect(() => {
    if (currentWeather?.coordinates?.lat && currentWeather?.coordinates?.lon) {
      setSelectedOrigin((prev) => ({
        ...prev,
        name: `${currentWeather.city} (Live Location)`,
        subtitle: currentWeather.suburb ? `${currentWeather.suburb}, ${currentWeather.city}` : `Lat: ${currentWeather.coordinates!.lat.toFixed(3)}, Lon: ${currentWeather.coordinates!.lon.toFixed(3)}`,
        city: currentWeather.city,
        coords: { x: 50, y: 50, lat: currentWeather.coordinates!.lat, lon: currentWeather.coordinates!.lon }
      }));
      return;
    }

    if (currentWeather?.city) {
      const cityMap: Record<string, { lat: number; lon: number }> = {
        dehradun: { lat: 30.3165, lon: 78.0322 },
        delhi: { lat: 28.6139, lon: 77.2090 },
        'new delhi': { lat: 28.6139, lon: 77.2090 },
        gurugram: { lat: 28.4595, lon: 77.0266 },
        noida: { lat: 28.5355, lon: 77.3910 },
        mumbai: { lat: 19.0760, lon: 72.8777 },
        bengaluru: { lat: 12.9716, lon: 77.5946 },
        chennai: { lat: 13.0827, lon: 80.2707 },
        kolkata: { lat: 22.5726, lon: 88.3639 },
        hyderabad: { lat: 17.3850, lon: 78.4867 },
        pune: { lat: 18.5204, lon: 73.8567 },
        jaipur: { lat: 26.9124, lon: 75.7873 },
        lucknow: { lat: 26.8467, lon: 80.9462 },
        chandigarh: { lat: 30.7333, lon: 76.7794 },
        shimla: { lat: 31.1048, lon: 77.1734 }
      };

      const cKey = currentWeather.city.toLowerCase().trim();
      const coords = cityMap[cKey];
      if (coords) {
        setSelectedOrigin((prev) => ({
          ...prev,
          name: `${currentWeather.city} (Live Location)`,
          city: currentWeather.city,
          coords: { x: 50, y: 50, lat: coords.lat, lon: coords.lon }
        }));
      }
    }
  }, [currentWeather?.city, currentWeather?.coordinates]);

  const originName = selectedOrigin.name;

  // Destination state
  const [selectedDestination, setSelectedDestination] = useState<DestinationPreset | null>(() => {
    if (activeTrip?.to) {
      const match = DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase().includes(activeTrip.to.toLowerCase()) ||
          activeTrip.to.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) return match;
      return {
        id: `trip-dest-${activeTrip.id}`,
        name: activeTrip.to,
        subtitle: `${activeTrip.to} (Your Next Trip Destination)`,
        category: 'landmark',
        city: currentWeather?.city || 'Delhi NCR',
        coords: { x: 74, y: 78, lat: 28.4358, lon: 77.1082 }
      };
    }
    return DESTINATION_PRESETS[0];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick category chips state (Restaurants, Cafes, Petrol Pumps, Hospitals, Hotels)
  const [selectedCategoryChip, setSelectedCategoryChip] = useState<string | null>(null);
  const [showPlacesSheet, setShowPlacesSheet] = useState<boolean>(false);
  const [selectedNearbyPlace, setSelectedNearbyPlace] = useState<NearbySafePlace | null>(null);

  // Firebase Auth integration
  const { user, refreshUserData } = useAuth();

  // Analysis Loading state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Scenarios toggle
  const [scenario, setScenario] = useState<'normal' | 'no-dry-route' | 'all-high-risk'>('normal');

  // Dynamic backend routes from TravelTime API & routing engine
  const [dynamicRoutesData, setDynamicRoutesData] = useState<{
    routes: LiveMapRoute[];
    departureOptions: DepartureTimeOption[];
    routingSource?: 'traveltime' | 'simulated';
  } | null>(null);

  useEffect(() => {
    if (activeTrip?.to) {
      const match = DESTINATION_PRESETS.find(
        (p) =>
          p.name.toLowerCase().includes(activeTrip.to.toLowerCase()) ||
          activeTrip.to.toLowerCase().includes(p.name.toLowerCase())
      );
      if (match) {
        setSelectedDestination(match);
      } else {
        setSelectedDestination({
          id: `trip-dest-${activeTrip.id}`,
          name: activeTrip.to,
          subtitle: `${activeTrip.to} (Your Next Trip Destination)`,
          category: 'landmark',
          city: currentWeather?.city || 'Delhi NCR',
          coords: { x: 74, y: 78, lat: 28.4358, lon: 77.1082 }
        });
      }
    }
  }, [activeTrip?.id, activeTrip?.to]);

  useEffect(() => {
    if (!selectedDestination) {
      setDynamicRoutesData(null);
      return;
    }

    const originCoords: [number, number] = [selectedOrigin.coords.lat || 28.5283, selectedOrigin.coords.lon || 77.1512];
    const destCoords: [number, number] = [selectedDestination.coords.lat, selectedDestination.coords.lon];
    const destName = selectedDestination.name;

    let isCurrent = true;
    fetchWeatherAwareRoutes(originCoords, destCoords, originName, destName, scenario)
      .then((data) => {
        if (isCurrent && data?.routes?.length > 0) {
          setDynamicRoutesData(data);
        }
      })
      .catch((err) => console.warn('Dynamic route fetch fallback:', err));

    return () => {
      isCurrent = false;
    };
  }, [selectedDestination, selectedOrigin, originName, scenario]);


  // Synchronous base routes for zero-latency initial render
  const defaultRoutesData = useMemo(() => {
    const destName = selectedDestination?.name || 'Sushant University';
    return buildWeatherAwareRoutes(originName, destName, 0, scenario);
  }, [originName, selectedDestination, scenario]);

  const routes = dynamicRoutesData?.routes || defaultRoutesData.routes;
  const departureOptions = dynamicRoutesData?.departureOptions || defaultRoutesData.departureOptions;

  const [activeRouteId, setActiveRouteId] = useState<string>('route-safest');
  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  // Turn-by-turn Navigation state
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [vehicleProgress, setVehicleProgress] = useState<number>(0);

  // Smart Wait Mode
  const [isSmartWaitActive, setIsSmartWaitActive] = useState<boolean>(false);
  const [smartWaitMinutes, setSmartWaitMinutes] = useState<number>(20);

  // Modals state
  const [showTimelineModal, setShowTimelineModal] = useState<boolean>(false);
  const [explainModalMode, setExplainModalMode] = useState<'why-route' | 'why-wait' | null>(null);
  const [modalRoute, setModalRoute] = useState<LiveMapRoute>(activeRoute);
  const [showLeaveNowModal, setShowLeaveNowModal] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [journeySummary, setJourneySummary] = useState<any>(null);

  // Destination coordinates for Leaflet mapping
  const destinationCoords: [number, number] | null = useMemo(() => {
    if (!selectedDestination) return null;
    return [selectedDestination.coords.lat, selectedDestination.coords.lon];
  }, [selectedDestination]);

  // Handle selecting a destination preset or search suggestion
  const handleSelectDestination = (preset: DestinationPreset) => {
    setSelectedDestination(preset);
    setSearchQuery(preset.name);
    setSelectedCategoryChip(null);
    setShowPlacesSheet(false);
    setIsNavigating(false);
    setVehicleProgress(0);
    setIsSmartWaitActive(false);
  };

  // Handle clicking anywhere on map to set destination
  const handleMapClickCoordinates = async (lat: number, lon: number) => {
    try {
      const preset = await reverseGeocodeLocation(lat, lon);
      handleSelectDestination(preset);
    } catch (e) {
      const fallbackPreset: DestinationPreset = {
        id: `map-pin-${Date.now()}`,
        name: `Pinned Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        subtitle: 'Custom location tapped on map',
        city: 'Delhi NCR',
        coords: { x: 50, y: 50, lat, lon },
        category: 'landmark'
      };
      handleSelectDestination(fallbackPreset);
    }
  };

  // Open "Should I Leave Now?" modal with AI route analysis
  const handleOpenLeaveNowModal = async () => {
    setShowLeaveNowModal(true);
    if (!aiAnalysis && selectedDestination) {
      try {
        const analysis = await fetchAIWeatherRouteAnalysis({
          origin: originName,
          destination: selectedDestination.name,
          route: activeRoute,
          comparisonRoute: routes.find((r) => r.id === 'route-fastest') || routes[1]
        });
        setAiAnalysis(analysis);
      } catch (e) {
        console.warn('AI analysis fetch error, using default analysis:', e);
      }
    }
  };

  // Handle journey completion on arrival
  const handleJourneyComplete = async () => {
    try {
      const summary = await fetchJourneySummary({
        destinationName: selectedDestination?.name || 'Sushant University',
        routeName: activeRoute.name,
        distanceKm: activeRoute.distanceKm,
        travelTimeMinutes: activeRoute.durationMinutes,
        rainMinutes: Math.round(activeRoute.durationMinutes * 0.4),
        highRiskZonesAvoided: activeRoute.safetyScore >= 85 ? 2 : 0
      });
      setJourneySummary(summary);
      setShowSummaryModal(true);
    } catch (e) {
      setJourneySummary({
        destinationName: selectedDestination?.name || 'Sushant University',
        routeName: activeRoute.name,
        distanceKm: activeRoute.distanceKm,
        travelTimeMinutes: activeRoute.durationMinutes,
        rainMinutes: 12,
        highRiskZonesAvoided: 2,
        aiSummary: 'You reached your destination safely ahead of the storm squall, avoiding 2 severe flood-prone underpasses on the alternate route.'
      });
      setShowSummaryModal(true);
    }
  };

  // Clear destination
  const handleClearDestination = () => {
    setSelectedDestination(null);
    setSearchQuery('');
    setIsNavigating(false);
    setVehicleProgress(0);
  };

  // Quick category chip selection handler
  const handleSelectCategoryChip = (category: string | null) => {
    setSelectedCategoryChip(category);
    if (category) {
      setShowPlacesSheet(true);
    } else {
      setShowPlacesSheet(false);
    }
  };

  // Navigate to second page (Route Intelligence)
  const handleOpenRouteIntelligence = () => {
    setIsAnalyzing(true);
    // After brief sequential analysis animation, open Route Intelligence page
  };

  // Start navigation
  const handleStartNavigation = (routeId?: string) => {
    const targetRouteId = routeId || activeRouteId;
    if (routeId) setActiveRouteId(routeId);
    setCurrentPage('live-map');
    setIsNavigating(true);
    setVehicleProgress(0);
    setIsSmartWaitActive(false);

    // Save trip to Cloud Firestore if user is authenticated
    if (user && selectedDestination) {
      const chosenRoute = routes.find((r) => r.id === targetRouteId) || activeRoute;
      saveTripToFirestore(user.uid, {
        fromName: originName,
        toName: selectedDestination.name,
        selectedMode: (activeTrip as any)?.travelMode || 'two-wheeler',
        safetyScore: chosenRoute.safetyScore,
        durationMin: chosenRoute.etaMinutes,
        distanceKm: chosenRoute.distanceKm,
        routeId: targetRouteId,
        destinationCoords: {
          lat: selectedDestination.coords.lat || 28.525,
          lng: selectedDestination.coords.lon || 77.149
        }
      }).then(() => {
        refreshUserData();
      }).catch((err) => {
        console.warn('Auto-save trip to Firestore notice:', err);
      });
    }
  };

  // View place on map from Page 2
  const handleViewPlaceOnMap = (place: NearbySafePlace) => {
    setSelectedNearbyPlace(place);
    setSelectedCategoryChip(place.category);
    setShowPlacesSheet(true);
    setCurrentPage('live-map');
  };

  // Navigate directly to a nearby place
  const handleNavigateToPlace = (place: NearbySafePlace) => {
    const newPreset: DestinationPreset = {
      id: place.id,
      name: place.name,
      subtitle: place.categoryLabel,
      city: 'Gurugram',
      coords: { x: 50, y: 50, lat: place.coords.lat || 28.525, lon: place.coords.lng || 77.149 },
      category: 'landmark'
    };
    setSelectedDestination(newPreset);
    setSearchQuery(place.name);
    setShowPlacesSheet(false);
  };

  // Drag end handlers for Start Marker and Destination Marker
  const handleStartDragEnd = async (lat: number, lon: number) => {
    try {
      const loc = await reverseGeocodeLocation(lat, lon);
      setSelectedOrigin({
        ...loc,
        coords: { x: 50, y: 50, lat, lon }
      });
    } catch (e) {
      console.warn('Reverse geocode error for start drag:', e);
    }
  };

  const handleDestDragEnd = async (lat: number, lon: number) => {
    try {
      const loc = await reverseGeocodeLocation(lat, lon);
      setSelectedDestination({
        ...loc,
        coords: { x: 50, y: 50, lat, lon }
      });
      setSearchQuery(loc.name);
    } catch (e) {
      console.warn('Reverse geocode error for dest drag:', e);
    }
  };

  // Swap Start and Destination
  const handleSwapOriginDestination = () => {
    if (selectedOrigin && selectedDestination) {
      const prevOrigin = selectedOrigin;
      const prevDest = selectedDestination;
      setSelectedOrigin(prevDest);
      setSelectedDestination(prevOrigin);
      setSearchQuery(prevOrigin.name);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 select-none overflow-hidden">
      {/* PAGE 1: LIVE MAP */}
      {currentPage === 'live-map' && (
        <div className="relative w-full h-full flex flex-col overflow-hidden">
          {/* Top Categories & Dual Origin/Destination Search Bar Header */}
          {!isNavigating && (
            <CartoTravelTimeSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectDestination={handleSelectDestination}
              originName={originName}
              onSelectOrigin={(origin) => setSelectedOrigin(origin)}
              onSwapOriginDestination={handleSwapOriginDestination}
              presets={DESTINATION_PRESETS}
              selectedDestination={selectedDestination}
              onClearDestination={handleClearDestination}
              onUseGps={onUseLiveLocation || (() => {})}
              isLocating={isLocating}
              selectedCategoryChip={selectedCategoryChip}
              onSelectCategoryChip={handleSelectCategoryChip}
            />
          )}

          {/* Dedicated Middle Area: Full-Width Interactive Map with Flexible Height */}
          <div className="relative flex-1 min-h-[220px] sm:min-h-[260px] w-full overflow-hidden">
            {mapEngine === 'carto' ? (
              <CartoMapView
                routes={routes}
                activeRouteId={activeRouteId}
                onSelectRoute={setActiveRouteId}
                destinationName={selectedDestination?.name || 'Sushant University'}
                originName={originName}
                isNavigating={isNavigating}
                vehicleProgress={vehicleProgress}
                userCoords={[selectedOrigin.coords.lat || 28.5283, selectedOrigin.coords.lon || 77.1512]}
                destinationCoords={destinationCoords}
                onMapClickCoordinates={handleMapClickCoordinates}
                onStartDragEnd={handleStartDragEnd}
                onDestDragEnd={handleDestDragEnd}
                routingSource={dynamicRoutesData?.routingSource}
                hasBottomCard={false}
                mapEngine={mapEngine}
                onSwitchMapEngine={setMapEngine}
                showRadarOverlay={showRadarOverlay}
                onToggleRadar={() => setShowRadarOverlay((prev) => !prev)}
                originWeather={{
                  temp: currentWeather?.temperature || 28,
                  condition: currentWeather?.condition || 'Partly Cloudy',
                  rainProb: currentWeather?.precipitation || 20,
                  windKmh: currentWeather?.windSpeed || 12
                }}
                destWeather={{
                  temp: 26,
                  condition: 'Heavy Rain Ahead',
                  rainProb: 75
                }}
                onMapClick={() => {
                  if (showPlacesSheet && !selectedCategoryChip) {
                    setShowPlacesSheet(false);
                  }
                }}
              />
            ) : (
              <LeafletMapView
                routes={routes}
                activeRouteId={activeRouteId}
                onSelectRoute={setActiveRouteId}
                destinationName={selectedDestination?.name || 'Sushant University'}
                originName={originName}
                isNavigating={isNavigating}
                vehicleProgress={vehicleProgress}
                showNearbyPlaces={showPlacesSheet}
                nearbyPlaces={NEARBY_SAFE_PLACES}
                selectedNearbyPlace={selectedNearbyPlace}
                onSelectNearbyPlace={setSelectedNearbyPlace}
                showRadarOverlay={showRadarOverlay}
                onToggleRadar={() => setShowRadarOverlay((prev) => !prev)}
                hasBottomCard={false}
                mapEngine={mapEngine}
                onSwitchMapEngine={setMapEngine}
                userCoords={[selectedOrigin.coords.lat || 28.5283, selectedOrigin.coords.lon || 77.1512]}
                destinationCoords={destinationCoords}
                selectedCategoryChip={selectedCategoryChip}
                onMapClickCoordinates={handleMapClickCoordinates}
                originWeather={{
                  temp: currentWeather?.temperature || 28,
                  condition: currentWeather?.condition || 'Partly Cloudy',
                  rainProb: currentWeather?.precipitation || 20,
                  windKmh: currentWeather?.windSpeed || 12
                }}
                destWeather={{
                  temp: 26,
                  condition: 'Heavy Rain Ahead',
                  rainProb: 75
                }}
                onMapClick={() => {
                  if (showPlacesSheet && !selectedCategoryChip) {
                    setShowPlacesSheet(false);
                  }
                }}
              />
            )}

            {/* Map Layers & Engine Section - Unified top-left control panel */}
            <div className="absolute top-3 left-3 z-20 pointer-events-auto flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-md border border-slate-200 text-[10px] font-bold">
                <span className="text-[9px] font-black uppercase text-slate-400 px-2 tracking-wider hidden sm:inline">
                  Engine
                </span>
                <button
                  type="button"
                  onClick={() => setMapEngine('osm')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    mapEngine === 'osm'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Use OpenStreetMap (Live Tiles)"
                >
                  <span>🌍</span>
                  <span>OSM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapEngine('carto')}
                  className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    mapEngine === 'carto'
                      ? 'bg-blue-600 text-white shadow-sm font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Use CARTO Vector Map"
                >
                  <span>🗺️</span>
                  <span>CARTO 3D</span>
                </button>
              </div>

              {/* Live Doppler Radar Toggle Pill in Map Layers & Engine */}
              <button
                type="button"
                onClick={() => setShowRadarOverlay((prev) => !prev)}
                className={`px-3 py-1.5 rounded-2xl transition cursor-pointer flex items-center space-x-1.5 text-[10px] font-bold shadow-md border active:scale-95 ${
                  showRadarOverlay
                    ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/20'
                    : 'bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white border-slate-200'
                }`}
                title="Toggle Live Doppler Radar Overlay"
              >
                <span>🌧️</span>
                <span>Live Doppler Radar</span>
                {showRadarOverlay && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* WEATHERGPT SAFEST ROUTE CARD: Positioned strictly BELOW the map in normal flow */}
          {selectedDestination && !isNavigating && !showPlacesSheet && (
            <div
              id="weathergpt-safest-route-card"
              className="relative shrink-0 w-full bg-white border-t border-slate-200 shadow-md z-20 px-3.5 py-2.5 sm:py-3 overflow-y-auto max-h-[42%]"
            >
              <div className="max-w-xl mx-auto w-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                        🟢 WeatherGPT Safest Route
                      </span>
                      <span className="text-xs font-black text-emerald-700">
                        Safety: {activeRoute.safetyScore}/100
                      </span>
                      {dynamicRoutesData?.routingSource === 'traveltime' ? (
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-300 flex items-center space-x-1">
                          <span>⚡</span>
                          <span>TravelTime Route</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">
                          CARTO + Weather Risk Engine
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                      {originName} → {selectedDestination.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-500">
                      {activeRoute.distanceKm} km • {activeRoute.durationMinutes} min • 🌧️ Rain Risk: {activeRoute.rainRisk}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearDestination}
                    className="w-7 h-7 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition"
                    title="Clear Destination"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Button to Open Page 2: Route Intelligence & Quick Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleOpenRouteIntelligence}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4 text-sky-200" />
                    <span>Analyze Weather & Safety (Route Intelligence) →</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleOpenLeaveNowModal}
                      className="py-2 sm:py-2.5 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300 flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-98"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Should I Leave Now?</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartNavigation(activeRouteId)}
                      className="py-2 sm:py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-98"
                    >
                      <Navigation className="w-3.5 h-3.5 fill-white stroke-none" />
                      <span>Start Navigation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Nearby Places Bottom Sheet (when quick category chip clicked or place selected) */}
          {showPlacesSheet && (
            <NearbyPlacesListSheet
              category={selectedCategoryChip}
              places={
                selectedCategoryChip
                  ? NEARBY_SAFE_PLACES.filter((p) => p.category === selectedCategoryChip)
                  : NEARBY_SAFE_PLACES
              }
              selectedPlaceId={selectedNearbyPlace?.id}
              onSelectPlace={(place) => setSelectedNearbyPlace(place)}
              onClose={() => {
                setShowPlacesSheet(false);
                setSelectedCategoryChip(null);
              }}
              onNavigateToPlace={handleNavigateToPlace}
            />
          )}

          {/* Turn-by-Turn Navigation HUD Overlay */}
          {isNavigating && (
            <LiveNavigationHUD
              route={activeRoute}
              destinationName={selectedDestination?.name || 'Sushant University'}
              onEndNavigation={() => {
                setIsNavigating(false);
                setVehicleProgress(0);
              }}
              onOpenTimeline={() => {
                setModalRoute(activeRoute);
                setShowTimelineModal(true);
              }}
              vehicleProgress={vehicleProgress}
              onProgressChange={setVehicleProgress}
              onReroute={() => setActiveRouteId('route-safest')}
              onJourneyComplete={handleJourneyComplete}
            />
          )}
        </div>
      )}

      {/* PAGE 2: WEATHERGPT ROUTE INTELLIGENCE */}
      {currentPage === 'route-intelligence' && (
        <RouteIntelligencePage
          destinationName={selectedDestination?.name || 'Sushant University'}
          originName={originName}
          routes={routes}
          activeRouteId={activeRouteId}
          onSelectRoute={setActiveRouteId}
          departureOptions={departureOptions}
          onBack={() => setCurrentPage('live-map')}
          onStartNavigation={handleStartNavigation}
          onActivateSmartWait={(mins) => {
            setSmartWaitMinutes(mins);
            setIsSmartWaitActive(true);
          }}
          onOpenWhyRoute={(route) => {
            setModalRoute(route);
            setExplainModalMode('why-route');
          }}
          onOpenTimeline={(route) => {
            setModalRoute(route);
            setShowTimelineModal(true);
          }}
          onViewPlaceOnMap={handleViewPlaceOnMap}
          nearbyPlaces={NEARBY_SAFE_PLACES}
          scenario={scenario}
          onScenarioChange={setScenario}
        />
      )}

      {/* Sequential Multi-Step Analysis Loading Transition Modal */}
      {isAnalyzing && (
        <RouteAnalysisLoading
          destinationName={selectedDestination?.name || 'Sushant University'}
          onComplete={() => {
            setIsAnalyzing(false);
            setCurrentPage('route-intelligence');
          }}
        />
      )}

      {/* Smart Wait Mode Overlay */}
      {isSmartWaitActive && (
        <SmartWaitModeOverlay
          initialMinutes={smartWaitMinutes}
          onCancel={() => setIsSmartWaitActive(false)}
          onStartNavigation={() => {
            setIsSmartWaitActive(false);
            handleStartNavigation(activeRouteId);
          }}
          onOpenNearby={() => {
            setIsSmartWaitActive(false);
            setSelectedCategoryChip('restaurant');
            setShowPlacesSheet(true);
            setCurrentPage('live-map');
          }}
          nearbyPlaces={NEARBY_SAFE_PLACES}
        />
      )}

      {/* Route Weather Timeline Modal */}
      <RouteWeatherTimelineModal
        route={modalRoute}
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
      />

      {/* Explainable AI Modal */}
      <ExplainableAIModal
        route={modalRoute}
        isOpen={explainModalMode !== null}
        onClose={() => setExplainModalMode(null)}
        mode={explainModalMode || 'why-route'}
      />

      {/* Should I Leave Now? Advisor Modal */}
      {showLeaveNowModal && (
        <ShouldILeaveNowModal
          analysis={aiAnalysis}
          activeRoute={activeRoute}
          fastestRoute={routes.find((r) => r.id === 'route-fastest') || routes[1]}
          originName={originName}
          destinationName={selectedDestination?.name || 'Sushant University'}
          onClose={() => setShowLeaveNowModal(false)}
          onStartNavigation={() => {
            setShowLeaveNowModal(false);
            handleStartNavigation(activeRouteId);
          }}
          onActivateSmartWait={(mins) => {
            setShowLeaveNowModal(false);
            setSmartWaitMinutes(mins);
            setIsSmartWaitActive(true);
          }}
        />
      )}

      {/* Journey Arrival Summary Modal */}
      {showSummaryModal && journeySummary && (
        <JourneySummaryModal
          summary={journeySummary}
          onClose={() => setShowSummaryModal(false)}
          onNewTrip={() => {
            setShowSummaryModal(false);
            setIsNavigating(false);
            setVehicleProgress(0);
            setCurrentPage('live-map');
          }}
        />
      )}
    </div>
  );
};
