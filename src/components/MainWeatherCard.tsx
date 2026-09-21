import React from 'react';
import { MapPin, Wind, Droplets, ChevronRight, Navigation, Loader2, Cpu } from './Icons';
import { WeatherIllustration } from './WeatherIllustration';
import { WeatherData, Language } from '../types';
import { getTranslation, translateCondition } from '../data/translations';

interface MainWeatherCardProps {
  weather: WeatherData;
  onSelectCity: () => void;
  onOpenDetails: () => void;
  onUseLiveLocation?: () => void;
  onOpenNWP?: () => void;
  isLocating?: boolean;
  isOnline?: boolean;
  language?: Language;
}

export const MainWeatherCard: React.FC<MainWeatherCardProps> = ({
  weather,
  onSelectCity,
  onOpenDetails,
  onUseLiveLocation,
  onOpenNWP,
  isLocating = false,
  isOnline = true,
  language = 'en'
}) => {
  const isOffline = !isOnline || Boolean(weather.isOfflineCached);
  const t = getTranslation(language);
  const localizedCondition = translateCondition(weather.condition, language);
  return (
    <div className="px-5 select-none">
      <div
        id="card-main-weather"
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl cursor-pointer transition transform hover:scale-[1.01] active:scale-[0.99]"
        style={{
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 55%, #0D47A1 100%)',
          boxShadow: '0 12px 30px -4px rgba(25, 118, 210, 0.38)'
        }}
        onClick={onOpenDetails}
      >
        {/* Subtle background glow effect */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />

        {/* Location pill, Live GPS trigger & Accuracy indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <button
              id="btn-location-selector"
              onClick={(e) => {
                e.stopPropagation();
                onSelectCity();
              }}
              title={weather.formattedAddress || `${weather.city}, ${weather.country}`}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide transition border border-white/25 cursor-pointer shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 fill-white/80 stroke-white text-white shrink-0" />
              <span className="truncate max-w-[170px] sm:max-w-[240px]">
                {weather.city}
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70 shrink-0" />
            </button>

            {onUseLiveLocation && (
              <button
                id="btn-gps-live-quick"
                onClick={(e) => {
                  e.stopPropagation();
                  onUseLiveLocation();
                }}
                disabled={isLocating}
                title="Recalibrate live GPS for pinpoint accuracy"
                className={`p-1.5 rounded-full backdrop-blur-md transition border cursor-pointer ${
                  isLocating
                    ? 'bg-blue-400/40 border-sky-300 animate-pulse'
                    : 'bg-white/20 hover:bg-white/35 border-white/25 active:scale-95'
                }`}
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            )}

            {weather.accuracyMeters !== undefined && (
              <span
                title={`Pinpoint GPS satellite fix precision: ±${weather.accuracyMeters} meters`}
                className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/40 text-[10px] text-emerald-100 font-bold tracking-tight shadow-xs backdrop-blur-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping inline-block shrink-0" />
                ±{weather.accuracyMeters}m
              </span>
            )}
          </div>

          {isOffline ? (
            <span className="text-[11px] font-semibold text-amber-200 bg-amber-950/40 border border-amber-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
              <span>Offline Cache {weather.offlineCachedAt ? `(${weather.offlineCachedAt})` : ''}</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              {weather.lastUpdated === 'Live GPS' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
              {weather.lastUpdated}
            </span>
          )}
        </div>

        {/* Center content row */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-baseline">
              <span className="text-6xl font-extrabold tracking-tight font-heading">
                {Math.round(weather.temperature)}
              </span>
              <span className="text-3xl font-light text-white/90 ml-1">°C</span>
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg font-semibold text-white tracking-wide">
                {localizedCondition}
              </span>
            </div>

            <p className="text-xs text-blue-100/90 font-medium mt-1">
              {t.feelsLike} {Math.round(weather.feelsLike)}°C <span className="opacity-60">|</span> {t.humidity} {weather.humidity}%
            </p>

            <p className="text-xs text-blue-100/90 font-medium flex items-center space-x-1 mt-0.5">
              <span>{t.wind} {weather.windSpeed} km/h</span>
              <span className="opacity-60">•</span>
              <span>{weather.windDirection}</span>
            </p>
          </div>

          {/* Animated 3D Illustration */}
          <div className="shrink-0">
            <WeatherIllustration condition={weather.condition} />
          </div>
        </div>

        {/* Bottom indicator hint */}
        <div className="mt-4 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
          {isOffline ? (
            <span className="flex items-center gap-1.5 text-amber-200/90 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              Service Worker Cache • Last saved forecast
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>{t.liveSync}</span>
              {weather.coordinates && (
                <span className="hidden md:inline text-[10px] text-white/60 font-mono">
                  ({weather.coordinates.lat.toFixed(4)}°N, {weather.coordinates.lon.toFixed(4)}°E)
                </span>
              )}
            </span>
          )}
          <div className="flex items-center space-x-2">
            {onOpenNWP && (
              <button
                type="button"
                id="btn-main-nwp-models"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNWP();
                }}
                className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-[10px] font-bold text-white transition cursor-pointer active:scale-95 shadow-2xs"
                title="View GFS, WRF-ARW, ECMWF & ICON model comparison"
              >
                <Cpu className="w-3 h-3 text-sky-200" />
                <span>{t.nwpModels}</span>
              </button>
            )}
            <span className="flex items-center font-medium hover:underline text-white">
              {t.viewDetails} <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
