import React, { useState } from 'react';
import { Search, MapPin, Sparkles, ExternalLink, Globe, X, Compass, CheckCircle2, AlertCircle } from 'lucide-react';
import { GroundingSource } from '../../types';

interface GeminiGroundingExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity?: string;
  userCoordinates?: { lat: number; lon: number };
}

export const GeminiGroundingExplorerModal: React.FC<GeminiGroundingExplorerModalProps> = ({
  isOpen,
  onClose,
  userCity = 'Delhi NCR',
  userCoordinates = { lat: 28.6139, lon: 77.2090 }
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'maps'>('search');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseHtml, setResponseHtml] = useState<string | null>(null);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const searchSuggestions = [
    `Latest IMD monsoon warning & rainfall forecast for ${userCity}`,
    `Are highways and underpasses open in ${userCity} today?`,
    `Current air quality and smog advisory for North India`,
    `Cyclone and low pressure system updates in Bay of Bengal`
  ];

  const mapsSuggestions = [
    `Find covered emergency parking lots near ${userCity} city center`,
    `EV fast charging stations with overhead rain shelters near ${userCity}`,
    `Nearest 24/7 petrol pumps and tire repair along main expressway`,
    `Safe transit hubs and metro stations with dry elevated entrances`
  ];

  const handleExecuteGrounding = async (targetQuery: string, toolType: 'search' | 'maps') => {
    if (!targetQuery.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setResponseHtml(null);
    setSources([]);

    try {
      const endpoint = toolType === 'search' ? '/api/gemini/search-grounded' : '/api/gemini/maps-grounded';
      const body = toolType === 'search'
        ? { query: targetQuery }
        : { query: targetQuery, latitude: userCoordinates.lat, longitude: userCoordinates.lon };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Grounding request failed');
      }

      setResponseHtml(data.text);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error('Grounding execution error:', err);
      setErrorMsg(err.message || 'Grounding request could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900">Gemini Grounded Intelligence</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-500">Live verified data directly via Search & Geospatial Grounding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 my-3 p-1 bg-slate-100 rounded-2xl shrink-0">
          <button
            onClick={() => {
              setActiveTab('search');
              setResponseHtml(null);
              setSources([]);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'search'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-sky-500" />
            <span>Search Grounding (googleSearch)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('maps');
              setResponseHtml(null);
              setSources([]);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'maps'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Geospatial Grounding (googleMaps)</span>
          </button>
        </div>

        {/* Query Input Box */}
        <div className="space-y-2 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteGrounding(query, activeTab);
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeTab === 'search'
                    ? 'Search real-time IMD advisories, flood news, or storm warnings...'
                    : `Find sheltered spots, dry parking, or fuel stations in ${userCity}...`
                }
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-sky-500 transition"
              />
              {activeTab === 'search' ? (
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              ) : (
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              )}
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-40 flex items-center space-x-1.5 ${
                activeTab === 'search'
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loading ? 'Retrieving...' : 'Ask Gemini'}</span>
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(activeTab === 'search' ? searchSuggestions : mapsSuggestions).map((sugg, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sugg);
                  handleExecuteGrounding(sugg, activeTab);
                }}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200 transition active:scale-95 text-left"
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Results */}
        <div className="flex-1 overflow-y-auto my-3 space-y-3.5 pr-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading && (
            <div className="p-6 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Sparkles className="w-6 h-6 animate-spin text-sky-500" />
              <p className="text-xs font-semibold">
                Grounding with {activeTab === 'search' ? 'Google Search' : 'Geospatial'} API...
              </p>
            </div>
          )}

          {responseHtml && (
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Grounded Response</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400">gemini-3.5-flash</span>
              </div>

              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {responseHtml}
              </div>

              {/* Citations & Sources */}
              {sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                    {activeTab === 'search' ? <Globe className="w-3.5 h-3.5 text-sky-600" /> : <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>Grounding Sources & Citations ({sources.length}):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-sky-600 line-clamp-1">
                            {src.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0 ml-1 mt-0.5" />
                        </div>
                        {src.snippet && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic">
                            "{src.snippet}"
                          </p>
                        )}
                        <span className="text-[9px] text-slate-400 truncate mt-1">
                          {src.uri}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!loading && !responseHtml && !errorMsg && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
              <Compass className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">
                Select a suggestion above or enter your own query to experience real-time Gemini Search or Maps Grounding.
              </p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Lat: {userCoordinates.lat.toFixed(4)}, Lon: {userCoordinates.lon.toFixed(4)}</span>
          <span className="font-semibold text-slate-500">Google AI Studio Grounding Tool</span>
        </div>
      </div>
    </div>
  );
};
