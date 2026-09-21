import React from 'react';
import { User, Bell, MapPin, Navigation, Loader2, Smartphone, WifiOff, Sparkles, Radio, Mic, Globe, ChevronDown } from './Icons';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { getLanguageInfo } from '../data/languages';

interface HeaderProps {
  city?: string;
  country?: string;
  currentLanguage?: Language;
  onOpenLanguageSelector?: () => void;
  onOpenCitySelector?: () => void;
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
  unreadAlertCount?: number;
  unreadAlertsCount?: number;
  onUseLiveLocation?: () => void;
  isLocating?: boolean;
  onOpenInstallApp?: () => void;
  isOnline?: boolean;
  isOfflineCached?: boolean;
  onOpenLiveVoice?: () => void;
  onOpenGroundingExplorer?: () => void;
  onOpenTranscriber?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  city,
  country = 'India',
  currentLanguage = 'en',
  onOpenLanguageSelector,
  onOpenCitySelector,
  onOpenMenu,
  onOpenNotifications,
  unreadAlertCount,
  unreadAlertsCount = 2,
  onUseLiveLocation,
  isLocating = false,
  onOpenInstallApp,
  isOnline = true,
  isOfflineCached = false,
  onOpenLiveVoice,
  onOpenGroundingExplorer,
  onOpenTranscriber,
  onOpenProfile
}) => {
  const alertsCount = unreadAlertCount ?? unreadAlertsCount;
  const isOffline = !isOnline || isOfflineCached;
  const { user, login } = useAuth();
  const currentLangInfo = getLanguageInfo(currentLanguage);

  return (
    <header className="w-full flex items-center justify-between px-4 sm:px-5 pt-3 pb-2 select-none border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      {/* Left: Profile Icon -> Opens Complete Profile section */}
      <div className="flex items-center space-x-2">
        <button
          id="btn-profile-menu"
          onClick={onOpenProfile || onOpenMenu}
          className="w-9 h-9 flex items-center justify-center rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition cursor-pointer border border-slate-200/70"
          aria-label="Open profile section"
          title="Open Profile & Settings"
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User Profile'}
              className="w-8 h-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-5 h-5 text-slate-700 stroke-[2.2]" />
          )}
        </button>

        {city && onOpenCitySelector && (
          <button
            onClick={onOpenCitySelector}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-semibold text-slate-800 transition cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-blue-600" />
            <span className="truncate max-w-[110px]">{city}</span>
          </button>
        )}
      </div>

      {/* Center: Brand & Gemini Live/Grounding shortcuts */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onOpenMenu}>
          <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 font-heading">
            WeatherGPT
          </h1>
          {isOffline && (
            <span
              title="Running in offline mode using Service Worker cached data"
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold border border-amber-300"
            >
              <WifiOff className="w-2.5 h-2.5" />
              OFFLINE
            </span>
          )}
        </div>
      </div>

      {/* Right: Gemini Live Voice, Grounding Explorer, Transcribe, Auth & Bell */}
      <div className="flex items-center space-x-1.5">
        {/* Gemini Live Voice Shortcut */}
        {onOpenLiveVoice && (
          <button
            onClick={onOpenLiveVoice}
            title="Live Voice Conversation (gemini-3.1-flash-live-preview)"
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs active:scale-95 transition cursor-pointer"
          >
            <Radio className="w-3 h-3 animate-pulse" />
            <span>Live Voice</span>
          </button>
        )}

        {/* Language Selector Button */}
        {onOpenLanguageSelector && (
          <button
            id="btn-header-language-selector"
            onClick={onOpenLanguageSelector}
            title={`Current Language: ${currentLangInfo.name} (${currentLangInfo.nativeName}). Tap to switch language.`}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/80 shadow-xs transition cursor-pointer active:scale-95 group"
            aria-label="Select App Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="font-extrabold text-blue-900 tracking-tight">{currentLangInfo.nativeName}</span>
            <span className="text-[10px] text-blue-500 font-medium hidden sm:inline">({currentLangInfo.shortCode})</span>
            <ChevronDown className="w-3 h-3 text-blue-500 opacity-80 shrink-0" />
          </button>
        )}

        {/* Audio Transcribe Shortcut */}
        {onOpenTranscriber && (
          <button
            onClick={onOpenTranscriber}
            title="Transcribe Voice Memo (gemini-3.5-transcribe)"
            className="w-8 h-8 flex items-center justify-center rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        {/* Google Auth / User profile avatar */}
        {user ? (
          <button
            onClick={onOpenProfile}
            title={`Signed in as ${user.displayName || user.email}`}
            className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-400 transition cursor-pointer"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          </button>
        ) : (
          <button
            onClick={login}
            title="Sign in with Google"
            className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign In</span>
          </button>
        )}

        <button
          id="btn-notifications-bell"
          onClick={onOpenNotifications}
          className="relative w-8 h-8 flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4 stroke-[2.2]" />
          {alertsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
