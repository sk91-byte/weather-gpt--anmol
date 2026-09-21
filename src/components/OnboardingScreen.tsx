import React, { useState, useEffect } from 'react';
import { WeatherData, Language, WhatsAppAlertPreferences } from '../types';
import { DEFAULT_WEATHER_DATA, INDIAN_CITIES, INITIAL_WEATHER } from '../data/weatherData';
import { INDIAN_LANGUAGES, getLanguageInfo } from '../data/languages';
import { detectLiveLocation } from '../services/locationService';
import {
  MapPin,
  LocateFixed,
  Search,
  CheckCircle2,
  User,
  Globe,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertTriangle,
  X,
  MessageSquare,
  Mail,
  Lock,
  ChevronDown,
  Check
} from './Icons';
import {
  getStoredWhatsAppPreferences,
  saveStoredWhatsAppPreferences,
  syncSubscriberToServer
} from '../services/whatsappAlertClient';

interface OnboardingScreenProps {
  onComplete: (data: {
    userName: string;
    weather: WeatherData;
    language: Language;
    whatsAppPrefs?: WhatsAppAlertPreferences;
  }) => void;
  initialUserName?: string;
  initialEmail?: string;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  initialUserName = 'Anmol',
  initialEmail = 'anmolsahu118@gmail.com'
}) => {
  // Active step (1: Location, 2: Name, 3: Language, 4: Phone & WhatsApp Alerts)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Status bar simulated time
  const [currentTime, setCurrentTime] = useState<string>('9:41');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Step 1: Location States
  const [selectedWeather, setSelectedWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [gpsDetected, setGpsDetected] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingManual, setIsSearchingManual] = useState<boolean>(false);

  // Step 2: Name States
  const [userName, setUserName] = useState<string>(initialUserName);
  const [nameError, setNameError] = useState<string | null>(null);

  // Step 3: Language State
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  // Step 4: Phone & WhatsApp Alert Details (Requested by User)
  const [email, setEmail] = useState<string>(initialEmail);
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    const stored = getStoredWhatsAppPreferences();
    return stored.phoneNumber || '';
  });
  const [enableWhatsAppAlerts, setEnableWhatsAppAlerts] = useState<boolean>(() => {
    const stored = getStoredWhatsAppPreferences();
    return stored.enabled ?? true;
  });
  const [alertLevel, setAlertLevel] = useState<'High' | 'Extreme' | 'Moderate'>(() => {
    const stored = getStoredWhatsAppPreferences();
    if (stored.threshold === 'MODERATE_HIGH_EXTREME') return 'Moderate';
    return stored.alertLevel || 'High';
  });
  const [warningBefore, setWarningBefore] = useState<string>(() => {
    const stored = getStoredWhatsAppPreferences();
    if (stored.warningBeforeMinutes === 15) return '15 minutes';
    if (stored.warningBeforeMinutes === 45) return '45 minutes';
    if (stored.warningBeforeMinutes === 60) return '1 hour';
    if (stored.warningBeforeMinutes === 120) return '2 hours';
    return '30 minutes';
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // GPS & Multi-Tier Location Detector
  const handleDetectGPS = async () => {
    setIsLocating(true);
    setLocationError(null);
    setStatusText('Detecting live location...');

    try {
      const result = await detectLiveLocation((status) => {
        setStatusText(status);
      });
      if (result && result.weather) {
        setSelectedWeather(result.weather);
        setGpsDetected(true);
        setLocationError(null);
      } else {
        throw new Error('Could not parse location data');
      }
    } catch (err: any) {
      console.warn('Live location detection error in onboarding:', err);
      setLocationError(err.message || 'Unable to detect location. You can search your city manually below.');
      setGpsDetected(false);
    } finally {
      setIsLocating(false);
      setStatusText(null);
    }
  };

  // Auto-detect location when user enters onboarding step 1
  useEffect(() => {
    handleDetectGPS();
  }, []);

  // City selection from list
  const handleSelectCity = (cityName: string) => {
    let matched = DEFAULT_WEATHER_DATA[cityName];
    if (!matched) {
      const pureCity = cityName.split(',')[0].trim();
      const foundKey = Object.keys(DEFAULT_WEATHER_DATA).find((k) =>
        k.toLowerCase().includes(pureCity.toLowerCase())
      );
      if (foundKey) matched = DEFAULT_WEATHER_DATA[foundKey];
    }

    if (!matched) {
      const parts = cityName.split(',');
      matched = {
        ...INITIAL_WEATHER,
        city: parts[0]?.trim() || cityName,
        state: parts[1]?.trim() || 'India'
      };
    }

    setSelectedWeather(matched);
    setGpsDetected(false);
    setLocationError(null);
    setSearchQuery('');
  };

  // Step Navigation Handlers
  const handleNextFromStep1 = () => {
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      setNameError('Please enter your name or nickname to continue');
      return;
    }
    setNameError(null);
    setCurrentStep(3);
  };

  const handleNextFromStep3 = () => {
    setCurrentStep(4);
  };

  // Final submit handler for Step 4
  const handleFinalSubmit = () => {
    const finalName = userName.trim() || 'Anmol';

    // Format and normalize phone number
    let cleanPhone = phoneNumber.trim().replace(/[\s-]/g, '');
    if (enableWhatsAppAlerts && cleanPhone) {
      if (!cleanPhone.startsWith('+')) {
        if (cleanPhone.length === 10) {
          cleanPhone = `+91${cleanPhone}`;
        } else {
          cleanPhone = `+${cleanPhone}`;
        }
      }
    }

    // Convert warningBefore string to minutes
    let minutes = 30;
    if (warningBefore === '15 minutes') minutes = 15;
    else if (warningBefore === '45 minutes') minutes = 45;
    else if (warningBefore === '1 hour') minutes = 60;
    else if (warningBefore === '2 hours') minutes = 120;

    const thresholdValue = alertLevel === 'Moderate' ? 'MODERATE_HIGH_EXTREME' : 'HIGH_EXTREME';

    const existingPrefs = getStoredWhatsAppPreferences();
    const updatedPrefs: WhatsAppAlertPreferences = {
      ...existingPrefs,
      enabled: enableWhatsAppAlerts,
      phoneNumber: cleanPhone,
      email: email.trim(),
      warningBeforeMinutes: minutes,
      alertLevel: alertLevel,
      threshold: thresholdValue,
      monitoredCities: Array.from(new Set([selectedWeather.city, ...existingPrefs.monitoredCities]))
    };

    // Save preferences
    try {
      localStorage.setItem('weathergpt_onboarded', 'true');
      localStorage.setItem('weathergpt_username', finalName);
      localStorage.setItem('weathergpt_language', selectedLanguage);
      localStorage.setItem('weathergpt_location', JSON.stringify(selectedWeather));
      localStorage.setItem('weathergpt_user_email', email.trim());
      saveStoredWhatsAppPreferences(updatedPrefs);
      if (cleanPhone) {
        syncSubscriberToServer(updatedPrefs).catch(() => {});
      }
    } catch (e) {
      console.warn('LocalStorage error saving setup:', e);
    }

    // Transition into main application
    onComplete({
      userName: finalName,
      weather: selectedWeather,
      language: selectedLanguage,
      whatsAppPrefs: updatedPrefs
    });
  };

  // Filtered cities list for manual search
  const popularCities = [
    'New Delhi, Delhi NCR',
    'Mumbai, Maharashtra',
    'Bengaluru, Karnataka',
    'Ahmedabad, Gujarat',
    'Dehradun, Uttarakhand',
    'Surat, Gujarat',
    'Jaipur, Rajasthan',
    'Kolkata, West Bengal',
    'Chennai, Tamil Nadu',
    'Pune, Maharashtra'
  ];

  const filteredCities = searchQuery.trim()
    ? INDIAN_CITIES.filter((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : popularCities;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center sm:py-6 font-sans text-slate-900">
      {/* Mobile-style viewport container matching app theme */}
      <div
        id="onboarding-container"
        className="w-full max-w-md h-[100dvh] sm:h-[844px] bg-slate-50 flex flex-col relative sm:rounded-[36px] shadow-2xl border border-slate-200/90 overflow-hidden"
      >
        {/* Top Status Bar matching main App */}
        <div className="h-6 bg-transparent shrink-0 flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 select-none z-30">
          <span>{currentTime}</span>
          <div className="flex items-center space-x-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Top Branding & 4-Step Progress Header */}
        <div className="px-5 pt-3 pb-3 bg-white border-b border-slate-200/80 shrink-0 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img
                src="/icon.svg"
                alt="WeatherGPT Icon"
                className="w-10 h-10 rounded-2xl shadow-md shadow-blue-500/20 object-contain shrink-0"
              />
              <div>
                <h1 className="text-base font-extrabold tracking-tight font-heading text-slate-900 flex items-center gap-1.5">
                  WeatherGPT <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-sans font-bold">AI Setup</span>
                </h1>
                <p className="text-[11px] text-slate-500">Multilingual weather intelligence for India</p>
              </div>
            </div>

            {/* Step Counter Badge */}
            <div className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
              Step {currentStep} of 4
            </div>
          </div>

          {/* 4-Step Animated Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-4 gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= 1 ? 'bg-blue-600 shadow-xs' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= 2 ? 'bg-blue-600 shadow-xs' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= 3 ? 'bg-blue-600 shadow-xs' : 'bg-slate-200'
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= 4 ? 'bg-emerald-600 shadow-xs' : 'bg-slate-200'
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 px-0.5">
              <span className={currentStep === 1 ? 'text-blue-600 font-bold' : ''}>1. Location</span>
              <span className={currentStep === 2 ? 'text-blue-600 font-bold' : ''}>2. Name</span>
              <span className={currentStep === 3 ? 'text-blue-600 font-bold' : ''}>3. Language</span>
              <span className={currentStep === 4 ? 'text-emerald-700 font-bold' : ''}>4. Alerts</span>
            </div>
          </div>
        </div>

        {/* Scrollable Step Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          {/* ================= STEP 1: CURRENT LOCATION ================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Step 1: Set Your Location</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Where are you located?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  WeatherGPT tailors live radar, flood warnings, and commute safety to your exact coordinates.
                </p>
              </div>

              {/* GPS Detection Button */}
              <button
                id="btn-detect-gps"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="w-full relative group overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                      {isLocating ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      ) : (
                        <LocateFixed className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-extrabold text-sm">
                        {isLocating ? 'Detecting Your Location...' : 'Use Current Location (GPS)'}
                      </div>
                      <div className="text-[11px] text-blue-100 font-normal">
                        {isLocating ? (statusText || 'Acquiring coordinates & live weather') : 'Instant 1-tap automated detection'}
                      </div>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 rotate-180 text-white/90 group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              </button>

              {/* Error Message if GPS Fails or Denied */}
              {locationError && (
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{locationError}</span>
                </div>
              )}

              {/* Selected Location Confirmation Card */}
              {selectedWeather && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      {gpsDetected ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-700 font-bold">Detected via GPS</span>
                        </>
                      ) : (
                        <span>Active Selected City</span>
                      )}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ready
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {selectedWeather.city}
                        <span className="text-xs font-normal text-slate-500">
                          , {selectedWeather.state || selectedWeather.country}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
                        {selectedWeather.temperature}°C • {selectedWeather.condition}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual City Search / Selection Option */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsSearchingManual((prev) => !prev)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isSearchingManual ? 'Hide manual search' : 'Or choose another city manually'}</span>
                </button>

                {isSearchingManual && (
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs animate-in fade-in duration-200">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Type city name (e.g. Dehradun, Mumbai)..."
                        className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick City Suggestions */}
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {filteredCities.map((cityName) => {
                        const isSelected = selectedWeather.city === cityName.split(',')[0].trim();
                        return (
                          <button
                            key={cityName}
                            type="button"
                            onClick={() => handleSelectCity(cityName)}
                            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-300 text-blue-900 font-bold'
                                : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-700'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {cityName}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 2: USER NAME ================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                  <span>Step 2: Personalization</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  What should we call you?
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We'll use your name for morning audio briefings, severe storm advisories, and travel summaries.
                </p>
              </div>

              {/* Name Input Card */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  Your First Name or Nickname
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="input-onboarding-username"
                    value={userName}
                    onChange={(e) => {
                      setUserName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNextFromStep2();
                    }}
                    placeholder="e.g. Anmol"
                    maxLength={30}
                    autoFocus
                    className="w-full pl-13 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-2xl text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                  />
                </div>

                {nameError && (
                  <p className="text-xs text-rose-500 font-medium pl-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {nameError}
                  </p>
                )}

                {/* Quick Suggestion Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Quick suggestions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Anmol', 'Rahul', 'Priya', 'Amit', 'Neha', 'Dr. Patel'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setUserName(chip)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          userName === chip
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Greeting Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    👋
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      Good Morning, {userName.trim() || 'Friend'}!
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Your AI morning briefing in {selectedWeather.city} will greet you like this.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: LANGUAGE ================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Step 3: Preferred Language</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  Choose Your Language
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  WeatherGPT provides voice guidance, crop advisories, and flood warnings in your language.
                </p>
              </div>

              {/* Language Selection Cards */}
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {INDIAN_LANGUAGES.map((lang) => {
                  const isSelected = selectedLanguage === lang.id;
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      id={`btn-lang-${lang.id}`}
                      onClick={() => setSelectedLanguage(lang.id)}
                      className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {lang.shortCode}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 truncate">
                            <span>{lang.nativeName}</span>
                            <span className="text-xs text-slate-400 font-normal">({lang.name})</span>
                            {lang.isPopular && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-sm border border-amber-200 shrink-0">
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{lang.description || lang.region}</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ml-2 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Language Sample Preview */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
                <span className="font-bold text-blue-600 block mb-0.5 text-[10px] uppercase tracking-wider">
                  Live Preview ({getLanguageInfo(selectedLanguage).nativeName} - {getLanguageInfo(selectedLanguage).name}):
                </span>
                <p className="text-xs text-slate-600 leading-snug">
                  {getLanguageInfo(selectedLanguage).samplePreview(selectedWeather.city)}
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP 4: WHATSAPP WEATHER ALERTS (Requested) ================= */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 4: Twilio WhatsApp Alerts</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 font-heading">
                  WhatsApp Weather Alerts
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Receive automated real-time alerts before cloudbursts, flash floods, or cyclones reach your area.
                </p>
              </div>

              {/* Contact & Alert Configuration Card matching User Specification */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3.5">
                {/* 1. Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="input-setup-name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Anmol"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* 2. Email (with 🔒 lock icon indicator) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Email
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Protected</span>
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="input-setup-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@gmail.com"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                {/* 3. WhatsApp Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      id="input-setup-phone"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (phoneError) setPhoneError(null);
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white transition font-mono"
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {phoneError}
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Include country code (e.g. +91 for India)
                    </p>
                  )}
                </div>

                {/* 4. ☑ Enable WhatsApp Weather Alerts Checkbox */}
                <label className="flex items-start space-x-3 p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 cursor-pointer transition hover:bg-emerald-50 select-none">
                  <input
                    type="checkbox"
                    id="checkbox-enable-whatsapp"
                    checked={enableWhatsAppAlerts}
                    onChange={(e) => setEnableWhatsAppAlerts(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-extrabold text-emerald-950 flex items-center justify-between">
                      <span>Enable WhatsApp Weather Alerts</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                        Automated
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                      Automatic Twilio WhatsApp dispatch for cloudbursts, severe floods & storms.
                    </p>
                  </div>
                </label>

                {/* 5. Alert Level */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Alert Level
                  </label>
                  <div className="relative">
                    <select
                      id="select-alert-level"
                      value={alertLevel}
                      onChange={(e) => setAlertLevel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition appearance-none cursor-pointer pr-9"
                    >
                      <option value="High">High (Recommended — Storms, Downpours, Floods)</option>
                      <option value="Extreme">Extreme Only (Disasters & Cyclones)</option>
                      <option value="Moderate">Moderate, High & Extreme (All alerts)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* 6. Warning Before */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Warning Before
                  </label>
                  <div className="relative">
                    <select
                      id="select-warning-before"
                      value={warningBefore}
                      onChange={(e) => setWarningBefore(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white transition appearance-none cursor-pointer pr-9"
                    >
                      <option value="15 minutes">15 minutes</option>
                      <option value="30 minutes">30 minutes (Standard)</option>
                      <option value="45 minutes">45 minutes</option>
                      <option value="1 hour">1 hour</option>
                      <option value="2 hours">2 hours</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Twilio Early Warning Info Note */}
              <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs flex items-center space-x-2.5">
                <span className="text-base">⚡</span>
                <span className="text-[11px] leading-snug">
                  Powered by Twilio WhatsApp API with 4-hour smart deduplication so you never get spammed.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200/80 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5">
            {/* Back Button (for Steps 2, 3, and 4) */}
            {currentStep > 1 && (
              <button
                type="button"
                id="btn-onboarding-back"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            {/* Step 1 Continue */}
            {currentStep === 1 && (
              <button
                type="button"
                id="btn-onboarding-continue-1"
                onClick={handleNextFromStep1}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 2 Continue */}
            {currentStep === 2 && (
              <button
                type="button"
                id="btn-onboarding-continue-2"
                onClick={handleNextFromStep2}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-[0.99]"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 3 Continue (Takes user to Phone & Alerts Setup) */}
            {currentStep === 3 && (
              <button
                type="button"
                id="btn-onboarding-continue-3"
                onClick={handleNextFromStep3}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-blue-700 hover:from-blue-500 hover:to-sky-500 text-white font-extrabold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-[0.99]"
              >
                <span>Continue to Alerts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Step 4 Save & Continue (Matches User Request: [ Save & Continue ]) */}
            {currentStep === 4 && (
              <button
                type="button"
                id="btn-onboarding-save-continue"
                onClick={handleFinalSubmit}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Save & Continue</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-center space-x-3 text-[10px] text-slate-400">
            <span>🔒 Preferences saved securely</span>
            <span>•</span>
            <span>Offline-ready</span>
            <span>•</span>
            <span>Twilio Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
