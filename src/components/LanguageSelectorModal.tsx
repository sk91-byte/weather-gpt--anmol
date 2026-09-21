import React, { useState, useMemo } from 'react';
import { X, Search, Check, Globe, Sparkles, Volume2, ArrowRight } from './Icons';
import { Language } from '../types';
import { INDIAN_LANGUAGES, LanguageInfo, getLanguageInfo } from '../data/languages';
import { getTranslation } from '../data/translations';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  currentCity?: string;
}

const POPULAR_LANG_IDS: Language[] = [
  'hi',
  'en',
  'hinglish',
  'bn',
  'te',
  'ta',
  'mr',
  'gu',
  'kn',
  'ml',
  'pa',
  'ur'
];

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
  currentCity = 'Delhi NCR'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = getTranslation(currentLanguage);
  const activeLangInfo = getLanguageInfo(currentLanguage);

  const popularLanguages = useMemo(() => {
    return POPULAR_LANG_IDS.map((id) => getLanguageInfo(id)).filter(Boolean);
  }, []);

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return INDIAN_LANGUAGES;
    return INDIAN_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.shortCode.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (langId: Language) => {
    onSelectLanguage(langId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div
        id="modal-language-selector"
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Choose Language / भाषा चुनें
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black">
                  24 Languages
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                App interface, Voice Assistant & Gemini AI will respond in your chosen language
              </p>
            </div>
          </div>

          <button
            id="btn-close-lang-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Language Banner */}
        <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Currently Selected:</span>
            <span className="font-extrabold text-blue-900">
              {activeLangInfo.nativeName} ({activeLangInfo.name})
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
            Active
          </span>
        </div>

        {/* Search Bar & Quick Filters */}
        <div className="p-4 border-b border-slate-100 bg-white shrink-0 space-y-3">
          {/* Search Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              id="input-search-language"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by language (e.g. Hindi, हिन्दी, Bengali, Telugu, Punjabi)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl text-xs text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-blue-500 focus:outline-hidden transition"
              autoFocus={false}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Popular Quick-Select Chips */}
          {!searchQuery && (
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Popular Languages
              </span>
              <div className="flex flex-wrap gap-1.5">
                {popularLanguages.map((l) => {
                  const isSelected = currentLanguage === l.id;
                  return (
                    <button
                      key={l.id}
                      id={`btn-quick-lang-${l.id}`}
                      type="button"
                      onClick={() => handleSelect(l.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      <span className="text-[10px] opacity-75">({l.shortCode})</span>
                      {isSelected && <Check className="w-3 h-3 ml-0.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Language List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-1">
          {filteredLanguages.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No language found matching "{searchQuery}"
            </div>
          ) : (
            filteredLanguages.map((l) => {
              const isSelected = currentLanguage === l.id;
              return (
                <div
                  key={l.id}
                  id={`lang-card-${l.id}`}
                  onClick={() => handleSelect(l.id)}
                  className={`pt-2.5 pb-2.5 px-3 rounded-2xl cursor-pointer transition flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-50/90 border border-blue-200 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-extrabold text-slate-900 font-heading">
                        {l.nativeName}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {l.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[10px] font-mono font-bold">
                        {l.shortCode}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {l.region}
                    </p>

                    {/* Sample preview speech/text */}
                    <div className="mt-1 text-[11px] text-slate-600 italic bg-white/70 rounded-lg p-1.5 border border-slate-200/60 flex items-start space-x-1.5">
                      <Volume2 className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{l.samplePreview(currentCity)}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 flex items-center justify-center transition">
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Tap any language to apply instantly</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
