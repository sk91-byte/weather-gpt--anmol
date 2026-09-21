import React, { useState } from 'react';
import { LiveMapRoute, DepartureTimeOption, NearbySafePlace } from '../../types';
import {
  ChevronLeft,
  Navigation,
  Sparkles,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CloudRain,
  Waves,
  Zap,
  Wind,
  CheckCircle2,
  Bell,
  MapPin,
  Utensils,
  Coffee,
  Store,
  Fuel,
  Info,
  ExternalLink
} from '../Icons';

interface RouteIntelligencePageProps {
  destinationName: string;
  originName: string;
  routes: LiveMapRoute[];
  activeRouteId: string;
  onSelectRoute: (id: string) => void;
  departureOptions: DepartureTimeOption[];
  onBack: () => void;
  onStartNavigation: (routeId?: string) => void;
  onActivateSmartWait: (minutes: number) => void;
  onOpenWhyRoute: (route: LiveMapRoute) => void;
  onOpenTimeline: (route: LiveMapRoute) => void;
  onViewPlaceOnMap: (place: NearbySafePlace) => void;
  nearbyPlaces: NearbySafePlace[];
  scenario: 'normal' | 'no-dry-route' | 'all-high-risk';
  onScenarioChange: (s: 'normal' | 'no-dry-route' | 'all-high-risk') => void;
}

export const RouteIntelligencePage: React.FC<RouteIntelligencePageProps> = ({
  destinationName,
  originName,
  routes,
  activeRouteId,
  onSelectRoute,
  departureOptions,
  onBack,
  onStartNavigation,
  onActivateSmartWait,
  onOpenWhyRoute,
  onOpenTimeline,
  onViewPlaceOnMap,
  nearbyPlaces,
  scenario,
  onScenarioChange
}) => {
  // Category filter for Nearby Places to Wait
  const [selectedWaitCategory, setSelectedWaitCategory] = useState<
    'all' | 'restaurant' | 'cafe' | 'convenience' | 'petrol'
  >('restaurant');
  const [reminderSet, setReminderSet] = useState<boolean>(false);
  const [showScenarioDropdown, setShowScenarioDropdown] = useState<boolean>(false);

  const activeRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  // Filter places based on selected category
  const filteredWaitPlaces = nearbyPlaces.filter((p) => {
    if (selectedWaitCategory === 'all') return true;
    return p.category === selectedWaitCategory;
  });

  const handleSetReminder = () => {
    setReminderSet(true);
    setTimeout(() => {
      setReminderSet(false);
    }, 4000);
  };

  return (
    <div className="relative w-full min-h-full bg-slate-50 text-slate-800 flex flex-col overflow-y-auto">
      {/* Top Header with Back Button and WeatherGPT Route Intelligence Branding */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 transition flex items-center justify-center cursor-pointer active:scale-95"
              title="Return to Map"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div>
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  W
                </div>
                <h1 className="text-sm font-black text-slate-900 tracking-tight">
                  WeatherGPT Route Intelligence
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[240px] sm:max-w-md">
                Destination: <span className="text-slate-900 font-bold">{destinationName}</span>
              </p>
            </div>
          </div>

          {/* Test Scenario Selector */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-300 flex items-center space-x-1 cursor-pointer"
            >
              <span>⚡ {scenario === 'all-high-risk' ? 'Severe Storm' : 'Standard'}</span>
            </button>
            {showScenarioDropdown && (
              <div className="absolute right-0 top-9 w-60 bg-white rounded-2xl p-1.5 shadow-2xl border border-slate-200 text-xs z-50 animate-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  Test Route Scenarios
                </div>
                <button
                  onClick={() => {
                    onScenarioChange('normal');
                    setShowScenarioDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl font-medium cursor-pointer transition ${
                    scenario === 'normal' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  🟢 Standard: Safest vs Fastest vs Avoid
                </button>
                <button
                  onClick={() => {
                    onScenarioChange('all-high-risk');
                    setShowScenarioDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl font-medium cursor-pointer transition ${
                    scenario === 'all-high-risk' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  🔴 Severe Squall (All Routes High Risk)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Route Origin - Destination Pill Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{originName}</span>
            <span className="text-slate-400 font-bold">→</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
            <span className="font-bold text-slate-900 truncate">{destinationName}</span>
          </div>
          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full shrink-0 ml-2">
            Multi-Point AI Grounded
          </span>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto p-4 space-y-4 pb-16">
        {/* Severe Storm Warning Banner if all routes are high risk */}
        {scenario === 'all-high-risk' && (
          <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-950 shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <h3 className="text-xs font-black uppercase text-red-900">
                Severe Convective Squall Warning
              </h3>
            </div>
            <p className="text-xs text-red-800 leading-relaxed font-medium">
              No sufficiently safe route is currently available. All transit paths feature active heavy downpours, waterlogged underpasses, and strong crosswinds. Consider delaying your journey and follow official weather and road advisories.
            </p>
          </div>
        )}

        {/* Section 1: Route Options Comparison */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">
              Route Options Comparison ({routes.length})
            </h2>
            <span className="text-[11px] font-bold text-blue-600">
              Select a route to view details
            </span>
          </div>

          <div className="space-y-3">
            {routes.map((route) => {
              const isSelected = route.id === activeRouteId;
              const isGreen = route.color === 'green' || route.type === 'recommended';
              const isOrange = route.color === 'orange' || route.type === 'fastest';
              const isRed = route.color === 'red' || route.type === 'avoid';

              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route.id)}
                  className={`rounded-2xl p-4 transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Top Route Badge & Safety Score Header */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center space-x-1 ${
                          isGreen
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                            : isOrange
                            ? 'bg-amber-100 text-amber-900 border border-amber-300/60'
                            : 'bg-red-100 text-red-900 border border-red-300/60'
                        }`}
                      >
                        <span>{isGreen ? '🟢' : isOrange ? '🟡' : '🔴'}</span>
                        <span>{route.badge}</span>
                      </span>
                      {isGreen && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-md shadow-xs">
                          WEATHERGPT RECOMMENDED
                        </span>
                      )}
                    </div>

                    {/* Safety Score Meter */}
                    <div
                      className={`px-3 py-1 rounded-xl text-center border font-black ${
                        route.safetyScore >= 80
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : route.safetyScore >= 60
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-wider opacity-80 font-bold">
                        Weather Safety
                      </div>
                      <div className="text-base leading-none mt-0.5">
                        {route.safetyScore}<span className="text-[10px] font-medium text-slate-500">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Route Title & Telemetry: Distance, Travel Time */}
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        {route.name}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        {route.distanceKm} km • {route.durationMinutes} min
                        {route.type === 'fastest' && ' (7 min faster)'}
                        {route.type === 'recommended' && ' (Elevation bypass)'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700">
                        ☁️ {route.summaryCondition}
                      </span>
                    </div>
                  </div>

                  {/* Weather Risk Factors Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 text-xs">
                    {/* Rain Risk */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
                      <CloudRain className="w-4 h-4 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block">Rain Risk</span>
                        <span
                          className={`font-black text-xs truncate ${
                            route.rainRisk === 'Low'
                              ? 'text-emerald-700'
                              : route.rainRisk === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {route.rainRisk} Intensity
                        </span>
                      </div>
                    </div>

                    {/* Waterlogging Risk */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
                      <Waves className="w-4 h-4 text-cyan-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block">Waterlogging</span>
                        <span
                          className={`font-black text-xs truncate ${
                            route.waterloggingRisk === 'Low'
                              ? 'text-emerald-700'
                              : route.waterloggingRisk === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {route.waterloggingRisk} Risk
                        </span>
                      </div>
                    </div>

                    {/* Thunderstorm / Wind */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1 flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block">Storm Alerts</span>
                        <span className="font-black text-xs text-slate-800 truncate">
                          {route.hazardCount > 0 ? `${route.hazardCount} Hazards active` : 'None reported'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Text / Explainability Quote */}
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed font-medium mb-3.5 ${
                      isGreen
                        ? 'bg-emerald-50/80 text-emerald-950 border border-emerald-200'
                        : isOrange
                        ? 'bg-amber-50/80 text-amber-950 border border-amber-200'
                        : 'bg-red-50/80 text-red-950 border border-red-200'
                    }`}
                  >
                    <span className="font-bold">
                      {isGreen ? 'Recommendation: ' : isOrange ? 'Safety Note: ' : 'Hazard Warning: '}
                    </span>
                    {route.whyThisRoute}
                  </div>

                  {/* Start Navigation & AI Inspector Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRoute(route.id);
                        onStartNavigation(route.id);
                      }}
                      className={`flex-1 py-3 px-4 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98 ${
                        isGreen
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                          : isOrange
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                          : 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/25'
                      }`}
                    >
                      <Navigation className="w-4 h-4 fill-white stroke-none" />
                      <span>START NAVIGATION</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWhyRoute(route);
                      }}
                      className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center space-x-1"
                      title="Why this route?"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Why This Route?</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTimeline(route);
                      }}
                      className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center space-x-1"
                      title="View stop-by-stop timeline"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Timeline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Best Departure Time AI */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  BEST DEPARTURE TIME AI
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Predictive storm clearing analysis along your route
                </p>
              </div>
            </div>
            <span className="text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300/70 px-2 py-0.5 rounded-full">
              Dynamic Forecast
            </span>
          </div>

          {/* AI Recommendation Quote */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-medium">
            <p className="mb-1">
              Heavy rainfall is expected on parts of your route for the next 20 minutes.
            </p>
            <div className="font-extrabold text-amber-900 flex items-center space-x-1 mt-1">
              <span>⭐ Recommendation:</span>
              <span className="underline decoration-amber-500 decoration-2">
                WAIT FOR 20 MINUTES
              </span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              Rain intensity is predicted to decrease significantly after that period. Alternatively, depart 20 minutes earlier if you need to travel ahead of the approaching rain cloud.
            </p>
          </div>

          {/* 3 Departure Options Cards */}
          <div className="grid grid-cols-3 gap-2">
            {departureOptions.map((opt) => (
              <div
                key={opt.id}
                className={`p-2.5 rounded-2xl text-center border transition relative ${
                  opt.isRecommended
                    ? 'bg-gradient-to-b from-emerald-50/90 to-white border-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {opt.isRecommended && (
                  <span className="text-[8px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.5 rounded-xs block mb-1 uppercase tracking-wider truncate">
                    ⭐ RECOMMENDED
                  </span>
                )}
                <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  {opt.title}
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  {opt.time}
                </div>
                <div
                  className={`text-[11px] font-black mt-1 ${
                    opt.safetyScore >= 85
                      ? 'text-emerald-600'
                      : opt.safetyScore >= 70
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  Safety: {opt.safetyScore}/100
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons: [WAIT 20 MINUTES], [LEAVE NOW], [SET REMINDER] */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onActivateSmartWait(20)}
              className="flex-1 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-98"
            >
              <span>🕒</span>
              <span>WAIT 20 MINUTES</span>
            </button>

            <button
              onClick={() => onStartNavigation(activeRouteId)}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-300 transition cursor-pointer active:scale-98"
            >
              LEAVE NOW
            </button>

            <button
              onClick={handleSetReminder}
              className={`py-3 px-3 rounded-xl font-bold text-xs border transition cursor-pointer flex items-center space-x-1 ${
                reminderSet
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{reminderSet ? 'Reminder Set!' : 'SET REMINDER'}</span>
            </button>
          </div>

          {reminderSet && (
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold text-center animate-in fade-in">
              🔔 Reminder scheduled for 20 minutes from now when weather clears!
            </div>
          )}
        </div>

        {/* Section 3: PLACES TO WAIT NEARBY (Automatically shown when WAIT is recommended!) */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base">☕</span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  PLACES TO WAIT NEARBY
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Dry, sheltered venues while you wait out the rain
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500">
              Near Current Location
            </span>
          </div>

          {/* Quick Category Filter Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
              { id: 'cafe', label: 'Cafes', icon: '☕' },
              { id: 'convenience', label: 'Stores', icon: '🏪' },
              { id: 'petrol', label: 'Petrol Pumps', icon: '⛽' }
            ].map((cat) => {
              const isActive = selectedWaitCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedWaitCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition flex items-center space-x-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nearby Venues List */}
          <div className="space-y-2.5">
            {filteredWaitPlaces.map((place) => (
              <div
                key={place.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {place.name}
                    </h4>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-100/80 px-1.5 py-0.2 rounded-md shrink-0">
                      ⭐ {place.rating}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {place.distanceMeters} m away • {place.walkingMinutes} min walk • {place.address}
                  </p>

                  <p className="text-[10px] font-semibold text-emerald-700 mt-1 flex items-center space-x-1 truncate">
                    <span>🛡️</span>
                    <span className="truncate">{place.shelterFeature}</span>
                  </p>
                </div>

                <button
                  onClick={() => onViewPlaceOnMap(place)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold transition shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  VIEW ON MAP
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Weather-Aware Route Logic Explained */}
        <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 text-slate-700 space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 text-blue-900 font-extrabold text-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>How WeatherGPT Compares Routes</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            Unlike standard maps that prioritize the shortest distance or general traffic, WeatherGPT continuously computes:
            <span className="font-bold text-slate-900"> Location + Expected Arrival Time + Doppler Weather</span>.
            Routes are tested for multi-point rainfall intensity, low-lying waterlogging thresholds, thunderstorm crosswinds, and live civic advisories.
          </p>
        </div>
      </div>
    </div>
  );
};
