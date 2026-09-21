import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, CheckCircle2, Navigation, Loader2, AlertTriangle, Sparkles } from './Icons';
import { INDIAN_CITIES } from '../data/weatherData';
import { searchPinpointLocations, PinpointLocationItem } from '../services/locationService';

interface CitySelectorModalProps {
  currentCity: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (cityString: string) => void;
  onSelectPinpointLocation?: (item: PinpointLocationItem) => void;
  onUseLiveLocation?: () => void;
  isLocating?: boolean;
  locationError?: string | null;
  locationStatusText?: string | null;
}

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({
  currentCity,
  isOpen,
  onClose,
  onSelectCity,
  onSelectPinpointLocation,
  onUseLiveLocation,
  isLocating = false,
  locationError = null,
  locationStatusText = null
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [pinpointResults, setPinpointResults] = useState<PinpointLocationItem[]>([]);
  const [isSearchingPinpoint, setIsSearchingPinpoint] = useState(false);

  // Debounced search for pinpoint Indian localities, sectors, and PIN codes
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setPinpointResults([]);
      setIsSearchingPinpoint(false);
      return;
    }

    setIsSearchingPinpoint(true);
    const handler = setTimeout(async () => {
      try {
        const results = await searchPinpointLocations(trimmed);
        setPinpointResults(results);
      } catch (e) {
        console.warn('Pinpoint search error:', e);
      } finally {
        setIsSearchingPinpoint(false);
      }
    }, 320);

    return () => clearTimeout(handler);
  }, [query]);

  const filtered = INDIAN_CITIES.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        id="modal-city-selector"
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Select Location</h3>
              <p className="text-[11px] text-blue-100">Live IMD & Satellite Feeds (India)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Live Location Quick Action */}
        <div className="p-4 pb-2">
          <button
            id="btn-use-live-gps"
            onClick={() => {
              if (onUseLiveLocation) {
                onUseLiveLocation();
              }
            }}
            disabled={isLocating}
            className="w-full p-3.5 bg-gradient-to-r from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 border-2 border-blue-200 rounded-2xl text-left transition flex items-center justify-between cursor-pointer group shadow-xs disabled:opacity-60"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {isLocating ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Navigation className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-extrabold text-blue-900">
                    {isLocating ? 'Acquiring Pinpoint Location...' : 'Use Current Location (High-Precision GPS)'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
                    SATELLITE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {isLocating ? (locationStatusText || 'Locking onto satellites & neighborhood...') : 'Pinpoint Doppler radar & hyper-local weather for your exact coordinates'}
                </p>
              </div>
            </div>
          </button>

          {locationError && (
            <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{locationError}</p>
                <p className="text-[10px] text-red-600 mt-0.5">
                  Tip: Allow location in browser settings, or type your exact 6-digit PIN code (e.g. 110070) below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-slate-100">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search colony, sector, city or PIN code (e.g. 110070)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 font-medium"
            />
            {isSearchingPinpoint && (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3" />
            )}
          </div>
        </div>

        {/* List of Cities & Pinpoint Localities */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {/* Exact Pinpoint Results from OpenStreetMap/Photon if available */}
          {pinpointResults.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Pinpoint Localities & PIN Codes:
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">{pinpointResults.length} matches</span>
              </div>
              <div className="space-y-1.5">
                {pinpointResults.map((item, idx) => (
                  <button
                    key={`${item.displayName}-${idx}`}
                    onClick={() => {
                      if (onSelectPinpointLocation) {
                        onSelectPinpointLocation(item);
                      } else {
                        onSelectCity(item.city || item.name);
                      }
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl text-left text-xs transition cursor-pointer bg-blue-50/60 hover:bg-blue-100/70 border border-blue-200/80 text-blue-950 flex items-center justify-between"
                  >
                    <div className="flex items-start space-x-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-bold truncate text-slate-900">
                          {item.locality || item.name}
                          {item.city && item.city !== item.locality ? `, ${item.city}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {[item.state, item.postcode ? `PIN: ${item.postcode}` : ''].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-600 text-white shrink-0 ml-2">
                      EXACT
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action if query is entered and no pinpoint results yet */}
          {query.trim().length > 1 && !filtered.some((c) => c.toLowerCase() === query.trim().toLowerCase()) && pinpointResults.length === 0 && (
            <button
              onClick={() => {
                onSelectCity(query.trim());
                onClose();
              }}
              className="w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-blue-900 mb-2"
            >
              <div className="flex items-center space-x-2.5">
                <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold">Fetch Live Weather for "{query.trim()}"</span>
                  <p className="text-[10px] text-blue-600 font-normal">Real-time Open-Meteo & IMD satellite telemetry</p>
                </div>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shrink-0">
                LIVE
              </span>
            </button>
          )}

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Major Meteorological Hubs:
          </span>

          {filtered.map((c) => {
            const isSelected = currentCity.toLowerCase().includes(c.split(',')[0].toLowerCase());
            return (
              <button
                key={c}
                onClick={() => {
                  onSelectCity(c);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <MapPin className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{c}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

