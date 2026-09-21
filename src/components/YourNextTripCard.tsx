import React, { useState } from 'react';
import { RouteTrip, WeatherData } from '../types';
import {
  Navigation,
  ArrowLeftRight,
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CloudRain,
  Sun,
  ShieldCheck,
  Plus
} from './Icons';
import {
  calculateTripRouteWeather,
  reverseTripRoute,
  getCurrentFormattedTime,
  parseTimeToMinutes,
  formatMinutesToTime
} from '../services/tripService';

interface YourNextTripCardProps {
  trip: RouteTrip;
  savedTrips?: RouteTrip[];
  weather?: WeatherData;
  onOpenTripDetails: () => void;
  onNewTrip?: () => void;
  onViewAllTrips?: () => void;
  onOpenLiveMap?: () => void;
  onSelectTrip?: (trip: RouteTrip) => void;
  onUpdateTrip?: (updated: RouteTrip) => void;
}

export const YourNextTripCard: React.FC<YourNextTripCardProps> = ({
  trip,
  savedTrips = [],
  weather,
  onOpenTripDetails,
  onNewTrip,
  onViewAllTrips,
  onOpenLiveMap,
  onSelectTrip,
  onUpdateTrip
}) => {
  const [showTimeline, setShowTimeline] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isCustomTimeOpen, setIsCustomTimeOpen] = useState<boolean>(false);

  const safetyScore = trip.safetyScore ?? 78;

  // Safety Score Theme Colors
  const getScoreTheme = (score: number) => {
    if (score >= 80) {
      return {
        bar: 'bg-emerald-500',
        text: 'text-emerald-700',
        badge: 'bg-emerald-50 border-emerald-200',
        label: 'Safe & Dry'
      };
    }
    if (score >= 60) {
      return {
        bar: 'bg-amber-500',
        text: 'text-amber-700',
        badge: 'bg-amber-50 border-amber-200',
        label: 'Caution Advised'
      };
    }
    return {
      bar: 'bg-rose-500',
      text: 'text-rose-700',
      badge: 'bg-rose-50 border-rose-200',
      label: 'Weather Hazard'
    };
  };

  const scoreTheme = getScoreTheme(safetyScore);

  // Trigger brief feedback notification
  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2400);
  };

  // Handle Swapping Origin & Destination (Return Route)
  const handleSwapRoute = () => {
    setIsSwapping(true);
    const reversed = reverseTripRoute(trip, weather);
    if (onUpdateTrip) {
      onUpdateTrip(reversed);
    }
    showFeedback(`Swapped to return route: ${reversed.from} → ${reversed.to}`);
    setTimeout(() => setIsSwapping(false), 300);
  };

  // Handle departure time change directly on the card
  const handleSelectTime = (newTime: string) => {
    setIsRecalculating(true);
    const updated = calculateTripRouteWeather(
      trip.from,
      trip.to,
      newTime,
      weather,
      trip.id
    );
    if (onUpdateTrip) {
      onUpdateTrip(updated);
    }
    showFeedback(`Departure updated to ${newTime} • Route recalculated`);
    setTimeout(() => setIsRecalculating(false), 350);
  };

  // Recalculate route weather against current live conditions
  const handleRecalculate = () => {
    setIsRecalculating(true);
    const updated = calculateTripRouteWeather(
      trip.from,
      trip.to,
      trip.leaveBy || '08:00 AM',
      weather,
      trip.id
    );
    if (onUpdateTrip) {
      onUpdateTrip(updated);
    }
    showFeedback('Route radar & weather hazards refreshed!');
    setTimeout(() => setIsRecalculating(false), 450);
  };

  // Time preset chips
  const currentTimeLabel = getCurrentFormattedTime();
  const timePresets = [
    { label: 'Now', value: 'Now' },
    { label: '08:00 AM', value: '08:00 AM' },
    { label: '08:30 AM', value: '08:30 AM' },
    { label: '09:00 AM', value: '09:00 AM' },
    { label: '05:30 PM', value: '05:30 PM' }
  ];

  return (
    <div className="px-5 mt-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider font-heading">
            YOUR NEXT TRIP
          </h3>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Live Route Intelligence Active" />
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-new-trip-header"
            onClick={onNewTrip || onOpenTripDetails}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition cursor-pointer flex items-center gap-0.5"
            title="Plan and calculate a new trip"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Trip</span>
          </button>
          <button
            id="btn-view-all-trips-header"
            onClick={onViewAllTrips || onOpenTripDetails}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Manage saved routes"
          >
            Saved ({savedTrips.length || 3})
          </button>
        </div>
      </div>

      {/* Saved Route Switcher Chips */}
      {savedTrips.length > 0 && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
          {savedTrips.map((st) => {
            const isSelected = st.id === trip.id;
            return (
              <button
                key={st.id}
                onClick={() => {
                  if (onSelectTrip) onSelectTrip(st);
                  showFeedback(`Switched to: ${st.from} → ${st.to}`);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center space-x-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{st.from === 'College' ? '🎓' : st.to === 'Tech Park' ? '💼' : '📍'}</span>
                <span className="truncate max-w-[120px]">
                  {st.from} → {st.to}
                </span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
              </button>
            );
          })}
          <button
            onClick={onNewTrip || onOpenTripDetails}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer border border-dashed border-slate-300"
          >
            + Add Route
          </button>
        </div>
      )}

      {/* Main Interactive Trip Card */}
      <div
        id="card-next-trip"
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 space-y-3.5 transition hover:border-blue-200 relative overflow-hidden"
      >
        {/* Dynamic Toast Feedback Overlay */}
        {feedbackMessage && (
          <div className="absolute top-2 left-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span className="truncate">{feedbackMessage}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-2" />
          </div>
        )}

        {/* 1. Route Path Row: 🟢 Origin  [⇄ Swap]  📍 Destination */}
        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between gap-2">
          {/* Origin */}
          <div
            onClick={onOpenTripDetails}
            className="flex items-center space-x-2 font-bold text-slate-900 text-sm min-w-0 cursor-pointer hover:text-blue-600 transition"
            title="Click to change start location"
          >
            <span className="text-base leading-none select-none shrink-0" aria-hidden="true">🟢</span>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider leading-none">FROM</span>
              <span className="truncate max-w-[100px] sm:max-w-[130px] block">{trip.from || 'Home'}</span>
            </div>
          </div>

          {/* Interactive Swap Direction Button */}
          <div className="flex items-center justify-center shrink-0">
            <button
              id="btn-swap-trip-route"
              onClick={handleSwapRoute}
              disabled={isSwapping}
              className={`p-1.5 rounded-full bg-white hover:bg-blue-50 active:scale-90 border border-slate-200 text-slate-600 hover:text-blue-600 shadow-2xs transition cursor-pointer ${
                isSwapping ? 'rotate-180 transition-transform duration-300' : ''
              }`}
              title="Reverse route (Return trip)"
              aria-label="Swap origin and destination"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Destination */}
          <div
            onClick={onOpenTripDetails}
            className="flex items-center space-x-2 font-bold text-slate-900 text-sm min-w-0 text-right cursor-pointer hover:text-blue-600 transition"
            title="Click to change destination"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider leading-none">TO</span>
              <span className="truncate max-w-[100px] sm:max-w-[130px] block">{trip.to || 'College'}</span>
            </div>
            <span className="text-base leading-none select-none shrink-0" aria-hidden="true">📍</span>
          </div>
        </div>

        {/* 2. Interactive Leave By Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Leave By:</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {trip.leaveBy || '08:00 AM'}
              </span>
              <span className="text-[11px] text-blue-600 font-semibold">
                (Est: {trip.estDuration || '30 mins'})
              </span>
            </div>
          </div>

          {/* Quick Departure Time Pills */}
          <div className="grid grid-cols-5 gap-1 pt-0.5">
            {timePresets.map((tp) => {
              const isSelected = trip.leaveBy === tp.value || (tp.value === 'Now' && trip.leaveBy === currentTimeLabel);
              return (
                <button
                  key={tp.value}
                  onClick={() => handleSelectTime(tp.value)}
                  className={`py-1 text-[11px] font-bold rounded-lg transition cursor-pointer text-center ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={`Calculate route departing at ${tp.label}`}
                >
                  {tp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Weather on Route & Live Advisory */}
        <div className="pt-1 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <span className="text-base leading-none select-none" aria-hidden="true">
                {trip.statusType === 'rain' ? '🌧️' : trip.statusType === 'alert' ? '⚠️' : '☀️'}
              </span>
              <span>Weather on Route</span>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer transition"
              title="Recalculate route against live radar"
            >
              <RefreshCw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
              <span>{isRecalculating ? 'Syncing...' : 'Sync Radar'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-600 font-medium pl-6 leading-relaxed">
            {trip.weatherOnRoute || trip.status || 'Mild weather with passing clouds'}
          </p>
        </div>

        {/* 4. Weather Safety Score & Breakdown */}
        <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/70 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-700">Weather Safety Score:</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${scoreTheme.badge} ${scoreTheme.text}`}>
                {scoreTheme.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              {trip.recommendation || 'Safe travel window recommended.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreTheme.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, safetyScore))}%` }}
              />
            </div>
            <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${scoreTheme.text} ${scoreTheme.badge}`}>
              {safetyScore}/100
            </span>
          </div>
        </div>

        {/* 5. Route Weather Timeline Toggle */}
        {trip.stops && trip.stops.length > 0 && (
          <div>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full py-1 text-slate-500 hover:text-slate-800 text-[11px] font-bold flex items-center justify-between transition cursor-pointer border-t border-slate-100 pt-2"
            >
              <span className="flex items-center space-x-1">
                <Navigation className="w-3 h-3 text-blue-600" />
                <span>Turn-by-turn Route Checkpoints ({trip.stops.length} stops)</span>
              </span>
              <span className="text-blue-600 font-semibold text-[11px]">
                {showTimeline ? 'Hide ▲' : 'Show Details ▼'}
              </span>
            </button>

            {showTimeline && (
              <div className="mt-2 pl-3 space-y-2 border-l-2 border-blue-200 text-xs animate-in fade-in duration-200">
                {trip.stops.map((stop, i) => (
                  <div key={i} className="flex items-start justify-between py-1">
                    <div>
                      <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                        <span className="text-[11px] text-blue-600">{stop.time}</span>
                        <span>•</span>
                        <span className="text-slate-700">{stop.pointName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span>{stop.condition}</span>
                        <span>Rain: {stop.rainProb}%</span>
                        {stop.hazard && (
                          <span className="text-amber-700 font-semibold">⚠️ {stop.hazard}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 shrink-0">
                      {stop.temp}°C
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. Primary CTA: Open Live Weather Map with this route */}
        {onOpenLiveMap && (
          <button
            id="btn-trip-live-map"
            onClick={onOpenLiveMap}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Open in WeatherGPT Live Map</span>
            <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase ml-1">
              LIVE
            </span>
          </button>
        )}

        {/* 7. Secondary Action Buttons: [ View Details / Edit ]  [ + New Trip ] */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            id="btn-view-trip-details"
            onClick={onOpenTripDetails}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs rounded-xl border border-slate-200/80 transition flex items-center justify-center cursor-pointer shadow-2xs"
          >
            View Details / Edit
          </button>

          <button
            id="btn-new-trip-action"
            onClick={onNewTrip || onOpenTripDetails}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan New Trip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
