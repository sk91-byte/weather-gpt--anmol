import React, { useState, useEffect, useRef } from 'react';
import { Search, Mic, MicOff, MapPin, X, Building2, LocateFixed, Navigation, Loader2, ArrowUpDown } from '../Icons';
import { DestinationPreset } from '../../data/liveMapData';
import { searchDestinations } from '../../services/mapService';

interface CartoTravelTimeSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectDestination: (destination: DestinationPreset) => void;
  originName: string;
  onSelectOrigin?: (origin: DestinationPreset) => void;
  onSwapOriginDestination?: () => void;
  presets: DestinationPreset[];
  selectedDestination: DestinationPreset | null;
  onClearDestination: () => void;
  onUseGps: () => void;
  isLocating?: boolean;
  selectedCategoryChip: string | null;
  onSelectCategoryChip: (category: string | null) => void;
}

export const CartoTravelTimeSearchBar: React.FC<CartoTravelTimeSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onSelectDestination,
  originName,
  onSelectOrigin,
  onSwapOriginDestination,
  presets,
  selectedDestination,
  onClearDestination,
  onUseGps,
  isLocating,
  selectedCategoryChip,
  onSelectCategoryChip
}) => {
  const [activeInput, setActiveInput] = useState<'origin' | 'destination'>('destination');
  const [originSearchQuery, setOriginSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [liveResults, setLiveResults] = useState<DestinationPreset[]>(presets);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDualInputMode, setIsDualInputMode] = useState<boolean>(false);

  const destinationInputRef = useRef<HTMLInputElement>(null);
  const originInputRef = useRef<HTMLInputElement>(null);

  const currentQuery = activeInput === 'destination' ? searchQuery : originSearchQuery;

  // Debounced search with TravelTime / OSM geocoding backend
  useEffect(() => {
    if (!currentQuery.trim()) {
      setLiveResults(presets);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchDestinations(currentQuery);
        setLiveResults(results);
      } catch (err) {
        console.error('Error in destination search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [currentQuery, presets, activeInput]);

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      try {
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListeningVoice(true);
        recognition.start();

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (activeInput === 'destination') {
            onSearchChange(transcript);
          } else {
            setOriginSearchQuery(transcript);
          }
          setIsListeningVoice(false);
          setIsDropdownOpen(true);
        };

        recognition.onerror = () => {
          setIsListeningVoice(false);
          if (activeInput === 'destination') {
            onSearchChange('Sushant University');
          }
          setIsDropdownOpen(true);
        };

        recognition.onend = () => {
          setIsListeningVoice(false);
        };
      } catch (err) {
        setIsListeningVoice(false);
        if (activeInput === 'destination') {
          onSearchChange('Sushant University');
        }
        setIsDropdownOpen(true);
      }
    } else {
      setIsListeningVoice(true);
      setTimeout(() => {
        if (activeInput === 'destination') {
          onSearchChange('Sushant University');
        }
        setIsListeningVoice(false);
        setIsDropdownOpen(true);
      }, 700);
    }
  };

  const categories = [
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'cafe', label: 'Cafes', icon: '☕' },
    { id: 'petrol', label: 'Fuel / EV', icon: '⛽' },
    { id: 'hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'hotel', label: 'Hotels', icon: '🏨' }
  ];

  return (
    <div className="relative shrink-0 w-full z-30 p-2.5 sm:p-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs flex flex-col items-center">
      {/* Search Bar Container */}
      <div className="w-full max-w-xl relative">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 transition-all">
          
          {/* Dual Origin + Destination Selector Bar */}
          <div className="flex flex-col space-y-2">
            
            {/* Start / Origin Selector Row */}
            {isDualInputMode ? (
              <div className="flex items-center space-x-2 px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" title="Start Point" />
                <input
                  ref={originInputRef}
                  type="text"
                  value={originSearchQuery || originName}
                  onChange={(e) => {
                    setOriginSearchQuery(e.target.value);
                    setActiveInput('origin');
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setActiveInput('origin');
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Choose start location..."
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={onUseGps}
                  className="w-7 h-7 shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-600 transition cursor-pointer"
                  title="Use Current Location (GPS)"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 pt-0.5 text-[11px] text-slate-500 font-semibold gap-2">
                <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-400 font-medium shrink-0">Start:</span>
                  <span className="font-bold text-slate-800 truncate">{originName}</span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDualInputMode(true);
                      setTimeout(() => originInputRef.current?.focus(), 100);
                    }}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Change Start
                  </button>
                  {onSwapOriginDestination && selectedDestination && (
                    <button
                      type="button"
                      onClick={onSwapOriginDestination}
                      className="w-6 h-6 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                      title="Swap Start and Destination"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Destination Search Bar */}
            <div className="flex items-center space-x-1.5">
              <div className="p-1.5 text-rose-500 shrink-0 flex items-center justify-center">
                <MapPin className="w-5 h-5 fill-rose-500/20 stroke-rose-600" />
              </div>

              <input
                ref={destinationInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setActiveInput('destination');
                  setIsDropdownOpen(true);
                }}
                onFocus={() => {
                  setActiveInput('destination');
                  setIsDropdownOpen(true);
                }}
                placeholder="Where to? (e.g., Sushant University, DLF Cyber Hub)"
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 placeholder-slate-400 outline-none truncate"
              />

              {isSearching && (
                <div className="w-7 h-7 shrink-0 flex items-center justify-center text-blue-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}

              {/* Voice search button */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  isListeningVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                }`}
                title="Voice Search"
              >
                {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onClearDestination();
                    setIsDropdownOpen(false);
                  }}
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Clear Destination"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* GPS button */}
              <button
                type="button"
                onClick={onUseGps}
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Locate Me (GPS)"
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
            {categories.map((cat) => {
              const isSelected = selectedCategoryChip === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategoryChip(isSelected ? null : cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 transition flex items-center space-x-1 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-64 sm:max-h-72 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>{activeInput === 'destination' ? 'Select Destination' : 'Select Start Location'}</span>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {liveResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                No matching locations found. Try another search.
              </div>
            ) : (
              liveResults.map((preset) => {
                const isSelected =
                  activeInput === 'destination' && selectedDestination?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      if (activeInput === 'destination') {
                        onSelectDestination(preset);
                      } else if (onSelectOrigin) {
                        onSelectOrigin(preset);
                        setOriginSearchQuery(preset.name);
                        setIsDualInputMode(false);
                      }
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-3 flex items-start space-x-3 text-left transition hover:bg-blue-50/60 border-b border-slate-100 last:border-0 cursor-pointer ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-500 shrink-0 mt-0.5">
                      {preset.category === 'university' ? (
                        <Building2 className="w-4 h-4 text-indigo-600" />
                      ) : preset.category === 'office' ? (
                        <Building2 className="w-4 h-4 text-blue-600" />
                      ) : preset.category === 'transport' ? (
                        <Navigation className="w-4 h-4 text-amber-600" />
                      ) : (
                        <MapPin className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 uppercase">
                          {preset.city}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                        {preset.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
