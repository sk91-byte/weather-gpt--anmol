import React, { useState, useEffect } from 'react';
import { User, Settings, Bell, MapPin, Navigation, ShieldAlert, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Smartphone, Database, Trash2, Copy, Check, LogOut, Radio, FileAudio, Calendar, MessageSquare } from './Icons';
import { Language, UserRole, DemoScenario } from '../types';
import { DEMO_SCENARIOS } from '../data/weatherData';
import { INDIAN_LANGUAGES } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import { deleteSavedTripFromFirestore } from '../lib/firebase';
import { getStoredWhatsAppPreferences } from '../services/whatsappAlertClient';

interface ProfileScreenProps {
  userName?: string;
  onRerunOnboarding?: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  userRole: UserRole;
  onUserRoleChange: (role: UserRole) => void;
  onSelectDemoScenario: (scenario: DemoScenario) => void;
  onBackToHome: () => void;
  onOpenInstallApp?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenTranscriber?: () => void;
  onOpenWhatsAppAlerts?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userName = 'Anmol',
  onRerunOnboarding,
  currentLanguage,
  onLanguageChange,
  userRole,
  onUserRoleChange,
  onSelectDemoScenario,
  onBackToHome,
  onOpenInstallApp,
  onOpenLiveVoice,
  onOpenTranscriber,
  onOpenWhatsAppAlerts
}) => {
  const { user, profile, login, logout, savedTrips, transcriptions, refreshUserData } = useAuth();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [forecastChangeNotif, setForecastChangeNotif] = useState(true);
  const [dailyBriefingNotif, setDailyBriefingNotif] = useState(true);
  const [severeAlertNotif, setSevereAlertNotif] = useState(true);

  const handleDeleteTrip = async (tripId?: string) => {
    if (!user || !tripId) return;
    try {
      await deleteSavedTripFromFirestore(user.uid, tripId);
      await refreshUserData();
    } catch (err) {
      console.warn('Error deleting trip:', err);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 select-none pb-24 overflow-y-auto">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
            aria-label="Back to Home"
            title="Back to Home"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 font-heading">
              Profile & Cloud Account
            </h2>
            <p className="text-xs text-slate-500">Google Auth & Cloud Firestore Persistence</p>
          </div>
        </div>
        {user && (
          <button
            onClick={logout}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* User Card / Firebase Google Authentication Card */}
        {user ? (
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                  {(user.displayName || user.email || 'AS').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {user.displayName || 'Weather Explorer'}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Google Authenticated" />
                </div>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    Firebase Auth
                  </span>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {userRole} Mode
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 rounded-3xl border border-sky-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center border border-sky-100">
                <Database className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Sign In with Google</h3>
                <p className="text-xs text-slate-500">Sync routes, chat threads & voice memos</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect your Google account to securely save your daily commute routes, audio transcriptions, and multi-turn conversations to Cloud Firestore.
            </p>
            <button
              onClick={login}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer active:scale-98"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Continue with Google (Firebase Auth)</span>
            </button>
          </div>
        )}

        {/* Gemini Multimodal Suite shortcuts */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            Gemini Multimodal Suite
          </span>
          <div className="grid grid-cols-2 gap-2">
            {onOpenLiveVoice && (
              <button
                onClick={onOpenLiveVoice}
                className="p-3 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 text-left transition flex flex-col justify-between cursor-pointer"
              >
                <Radio className="w-4 h-4 text-sky-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Live Voice Copilot</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">gemini-3.1-flash-live</span>
              </button>
            )}
            {onOpenTranscriber && (
              <button
                onClick={onOpenTranscriber}
                className="p-3 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-200 text-left transition flex flex-col justify-between cursor-pointer"
              >
                <FileAudio className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">Voice Transcriber</span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">gemini-3.5-transcribe</span>
              </button>
            )}
          </div>
        </div>

        {/* Cloud Firestore Saved Trips */}
        {user && (
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-sky-600" />
                <span>Saved Trips (Cloud Firestore)</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">{savedTrips.length} Saved</span>
            </div>

            {savedTrips.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">
                No trips saved in Cloud yet. Save your route on the Live Map to sync here.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTrips.map((st) => (
                  <div key={st.id} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-800">{st.fromName} → {st.toName}</p>
                      <p className="text-[10px] text-slate-500">
                        Mode: {st.selectedMode} • Safety: {st.safetyScore}/100 • {new Date(st.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTrip(st.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition cursor-pointer"
                      title="Delete trip from Firestore"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cloud Firestore Saved Transcriptions */}
        {user && transcriptions.length > 0 && (
          <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <FileAudio className="w-3.5 h-3.5 text-indigo-600" />
                <span>Voice Memos (gemini-3.5-transcribe)</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">{transcriptions.length} Records</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {transcriptions.map((tr) => (
                <div key={tr.id} className="p-2.5 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex items-start justify-between">
                  <div className="text-xs space-y-1 pr-2">
                    <p className="text-slate-800 font-medium line-clamp-2">"{tr.text}"</p>
                    <p className="text-[10px] text-slate-400">{new Date(tr.createdAt).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleCopyText(tr.text, tr.id || '')}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-lg hover:bg-white transition cursor-pointer shrink-0"
                    title="Copy text"
                  >
                    {copiedId === tr.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persona / User Type Selector */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            User Persona / Role
          </span>
          <p className="text-[11px] text-slate-500 leading-tight">
            WeatherGPT tailors action advice specifically to your daily lifestyle:
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { id: 'citizen', title: 'Citizen', desc: 'Daily commute & city precautions' },
              { id: 'farmer', title: 'Farmer (Kisan)', desc: 'Irrigation & crop spray guidance' },
              { id: 'traveller', title: 'Traveller', desc: 'Highway & mountain route weather' },
              { id: 'researcher', title: 'Researcher', desc: 'Raw telemetry & climate models' }
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => onUserRoleChange(r.id as UserRole)}
                className={`p-2.5 rounded-2xl text-left transition cursor-pointer border ${
                  userRole === r.id
                    ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold block">{r.title}</span>
                <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                  {r.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Hackathon Demo Scenarios Switcher */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Demo Presentation Scenarios
            </span>
            <span className="text-[9px] font-extrabold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
              Hackathon Ready
            </span>
          </div>
          <p className="text-[11px] text-indigo-900/80 leading-normal">
            Switch scenarios in 1 click to test extreme weather conditions & actionable advice:
          </p>

          <div className="space-y-1.5 pt-1">
            {DEMO_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  onSelectDemoScenario(scenario);
                  onBackToHome();
                }}
                className="w-full p-2.5 bg-white hover:bg-indigo-100/60 rounded-2xl border border-indigo-100 text-left transition cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 block group-hover:text-indigo-700">
                    {scenario.title}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-1">
                    {scenario.tagline}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Preferences: Language & Units */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            App Preferences
          </span>

          <div className="space-y-2 text-xs pt-1">
            <span className="font-semibold text-slate-700 block">Preferred Language (24 Languages Supported)</span>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/80 rounded-2xl max-h-48 overflow-y-auto">
              {INDIAN_LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  id={`btn-profile-lang-${l.id}`}
                  onClick={() => onLanguageChange(l.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    currentLanguage === l.id
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                  title={`${l.name} (${l.nativeName})`}
                >
                  {l.nativeName} ({l.shortCode})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Temperature Unit</span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
              {(['C', 'F'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    unit === u
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Notifications Configuration */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Smart Weather Notifications
            </span>
            <span className="text-[10px] text-blue-600 font-bold">Innovative Change Detection</span>
          </div>

          <label className="flex items-center justify-between text-xs py-1 cursor-pointer">
            <div>
              <span className="font-semibold text-slate-800 block">Forecast Change Detection</span>
              <span className="text-[10px] text-slate-400">
                Only notify when rainfall probability jumps significantly (e.g. 40% → 80%)
              </span>
            </div>
            <input
              type="checkbox"
              checked={forecastChangeNotif}
              onChange={(e) => setForecastChangeNotif(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer ml-3"
            />
          </label>

          <label className="flex items-center justify-between text-xs py-1 border-t border-slate-100 cursor-pointer">
            <div>
              <span className="font-semibold text-slate-800 block">Daily Morning AI Briefing</span>
              <span className="text-[10px] text-slate-400">
                Receive proactive audio/text overview at 07:30 AM
              </span>
            </div>
            <input
              type="checkbox"
              checked={dailyBriefingNotif}
              onChange={(e) => setDailyBriefingNotif(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer ml-3"
            />
          </label>

          <label className="flex items-center justify-between text-xs py-1 border-t border-slate-100 cursor-pointer">
            <div>
              <span className="font-semibold text-slate-800 block">Disaster & Flash Flood Alerts</span>
              <span className="text-[10px] text-slate-400">
                Immediate high-priority warnings with evacuation routes
              </span>
            </div>
            <input
              type="checkbox"
              checked={severeAlertNotif}
              onChange={(e) => setSevereAlertNotif(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer ml-3"
            />
          </label>
        </div>

        {/* Twilio WhatsApp Early Warnings Card */}
        <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-3xl border border-emerald-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide block font-heading">
                  Twilio WhatsApp Early Alerts
                </span>
                <span className="text-[10px] text-emerald-700">
                  Direct WhatsApp dispatch for cloudbursts & floods
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Twilio SDK
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Receive automated real-time weather warnings directly on your phone via official Twilio WhatsApp API.
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500">
              {getStoredWhatsAppPreferences().enabled ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active: {getStoredWhatsAppPreferences().phoneNumber || 'Number configured'}
                </span>
              ) : (
                <span className="text-slate-400">Not configured yet</span>
              )}
            </div>

            {onOpenWhatsAppAlerts && (
              <button
                onClick={onOpenWhatsAppAlerts}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <span>Configure WhatsApp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Saved Locations */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            Saved Places & Routes
          </span>
          <div className="space-y-1.5">
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2">
                <span>🏠</span> Home: Vasant Vihar, Dehradun
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Active</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2">
                <span>🎓</span> College: Graphic Era / UPES Campus
              </span>
              <span className="text-[10px] text-blue-600 font-bold">Route Linked</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2">
                <span>🌾</span> Agricultural Farm: Terai Block 4
              </span>
              <span className="text-[10px] text-slate-400 font-bold">Configured</span>
            </div>
          </div>
        </div>

        {/* Install Android App / APK Card */}
        <div className="p-4 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl text-white shadow-md">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h4 className="text-sm font-black">Install WeatherGPT on Phone</h4>
              <p className="text-[11px] text-blue-200">Get Android App / Download .APK</p>
            </div>
          </div>
          <p className="text-xs text-blue-100/90 mb-3 leading-relaxed">
            Install WeatherGPT directly as an Android App with full offline capabilities, GPS navigation, and home screen icon.
          </p>
          <button
            onClick={onOpenInstallApp}
            className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-900 hover:bg-blue-50 font-black text-xs transition cursor-pointer active:scale-98 shadow-sm flex items-center justify-center space-x-2"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span>Install App / Get APK Instructions</span>
          </button>
        </div>

        {/* Reconfigure Onboarding Walkthrough Option */}
        {onRerunOnboarding && (
          <button
            onClick={onRerunOnboarding}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-blue-600 flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Rerun Onboarding Setup Walkthrough</span>
          </button>
        )}

        {/* App Info / Tagline & Publication Details */}
        <div className="text-center py-4 px-3 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-2 text-xs">
          <div className="flex items-center justify-center gap-1.5 font-extrabold text-slate-800 tracking-tight text-sm">
            <span>WeatherGPT</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">v2.4 SIH Edition</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>App Published Date: <strong className="text-slate-900 font-bold">September 14, 2026</strong></span>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            "Don't Just Know the Weather. Know What to Do."
          </p>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[10px] text-slate-400">
            <span>Build: 2026.09.14-PROD</span>
            <span>•</span>
            <span>SIH Grand Finale Prototype</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">Active & Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
