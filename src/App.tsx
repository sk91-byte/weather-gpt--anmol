/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { GreetingSection } from './components/GreetingSection';
import { MainWeatherCard } from './components/MainWeatherCard';
import { WeatherMetricsGrid } from './components/WeatherMetricsGrid';
import { WeatherRiskSection } from './components/WeatherRiskSection';
import { YourNextTripCard } from './components/YourNextTripCard';
import { LiveMapHomeCard } from './components/LiveMapHomeCard';
import { WeatherAlertsCard } from './components/WeatherAlertsCard';
import { AskWeatherGPTCard } from './components/AskWeatherGPTCard';
import { ExploreMoreSection } from './components/ExploreMoreSection';
import { BottomNavigation, TabType } from './components/BottomNavigation';
import { AIChatScreen } from './components/AIChatScreen';
import { WeatherMapScreen } from './components/WeatherMapScreen';
import { DisasterNewsScreen } from './components/DisasterNewsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { ExplainableAIModal } from './components/ExplainableAIModal';
import { TripDetailsModal } from './components/TripDetailsModal';
import { WeatherAlertsModal } from './components/WeatherAlertsModal';
import { WhatsAppAlertsModal } from './components/WhatsAppAlertsModal';
import { ForecastDetailsModal } from './components/ForecastDetailsModal';
import { NWPModelsModal } from './components/NWPModelsModal';
import { FarmerModeModal } from './components/FarmerModeModal';
import { ClimateAnalyticsModal } from './components/ClimateAnalyticsModal';
import { CitySelectorModal } from './components/CitySelectorModal';
import { NotificationsModal } from './components/NotificationsModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { InstallAppModal } from './components/InstallAppModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { LiveVoiceConversationModal } from './components/live-voice/LiveVoiceConversationModal';
import { AudioTranscriberModal } from './components/audio/AudioTranscriberModal';
import { GeminiGroundingExplorerModal } from './components/grounding/GeminiGroundingExplorerModal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { registerServiceWorker, syncWeatherToServiceWorker } from './services/serviceWorker';
import { detectLiveLocation, PinpointLocationItem } from './services/locationService';
import {
  getActiveTrip,
  getSavedTrips,
  saveActiveTripToStorage,
  saveTripsToStorage,
  calculateTripRouteWeather
} from './services/tripService';
import { getStoredWhatsAppPreferences, evaluateAndTriggerAlert } from './services/whatsappAlertClient';

import {
  DEFAULT_WEATHER_DATA,
  DEFAULT_HOURLY_FORECAST,
  DEFAULT_DAILY_FORECAST,
  DEFAULT_ROUTE_TRIP,
  DEFAULT_SAVED_TRIPS,
  DEFAULT_ALERTS,
  DEFAULT_FARMER_ADVISORY,
  CITY_WEATHER_DATABASE,
  INITIAL_WEATHER
} from './data/weatherData';
import { INDIAN_LANGUAGES } from './data/languages';
import { WeatherData, Language, UserRole, DemoScenario, RouteTrip, WhatsAppAlertPreferences } from './types';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { user } = useAuth();

  // First-time Onboarding State
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('weathergpt_onboarded') === 'true';
    }
    return false;
  });

  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('weathergpt_username') || 'Anmol';
    }
    return 'Anmol';
  });

  // Connectivity & Offline Caching State
  const { isOnline, wasOffline, resetWasOffline } = useOnlineStatus();
  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weathergpt_language');
      if (saved && INDIAN_LANGUAGES.some((l) => l.id === saved)) {
        return saved as Language;
      }
    }
    return 'en';
  });

  // Primary application state
  const [weather, setWeather] = useState<WeatherData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('weathergpt_location');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.city) return parsed;
        } catch (e) {}
      }
    }
    return INITIAL_WEATHER;
  });
  const [trip, setTrip] = useState<RouteTrip>(() => getActiveTrip());
  const [savedTrips, setSavedTrips] = useState<RouteTrip[]>(() => getSavedTrips());
  const [tripModalMode, setTripModalMode] = useState<'details' | 'new' | 'all'>('details');
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [advisory, setAdvisory] = useState(DEFAULT_FARMER_ADVISORY);

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [userRole, setUserRole] = useState<UserRole>('citizen');
  const [mapInitialLayer, setMapInitialLayer] = useState<string>('rain');
  const [chatInitialQuery, setChatInitialQuery] = useState<string | undefined>(undefined);

  // Live Location states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationStatusText, setLocationStatusText] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  // Keep time dynamically updating every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal dialog states
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showExplainableAI, setShowExplainableAI] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [showWeatherAlerts, setShowWeatherAlerts] = useState(false);
  const [showForecastDetails, setShowForecastDetails] = useState(false);
  const [forecastModalTab, setForecastModalTab] = useState<'hourly' | '7day' | 'aqi'>('hourly');
  const [showNWPModels, setShowNWPModels] = useState(false);
  const [showFarmerMode, setShowFarmerMode] = useState(false);
  const [showClimateAnalytics, setShowClimateAnalytics] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showInstallApp, setShowInstallApp] = useState(false);
  const [showLiveVoice, setShowLiveVoice] = useState(false);
  const [showAudioTranscriber, setShowAudioTranscriber] = useState(false);
  const [showGroundingExplorer, setShowGroundingExplorer] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showWhatsAppAlerts, setShowWhatsAppAlerts] = useState(false);

  // Auto-evaluation of weather alerts for WhatsApp subscriber
  useEffect(() => {
    if (!weather || !weather.city) return;
    const prefs = getStoredWhatsAppPreferences();
    if (prefs.enabled && prefs.phoneNumber) {
      evaluateAndTriggerAlert(weather, prefs, true).catch((e) => {
        console.warn('Auto-evaluation of WhatsApp weather alert:', e);
      });
    }
  }, [weather?.city, weather?.riskStatus, weather?.condition]);

  // Onboarding Completion Handler
  const handleOnboardingComplete = (data: {
    userName: string;
    weather: WeatherData;
    language: Language;
    whatsAppPrefs?: WhatsAppAlertPreferences;
  }) => {
    setUserName(data.userName);
    setWeather(data.weather);
    setLanguage(data.language);
    setHasCompletedOnboarding(true);

    if (data.whatsAppPrefs?.enabled && data.whatsAppPrefs?.phoneNumber) {
      evaluateAndTriggerAlert(data.weather, data.whatsAppPrefs, true).catch(() => {});
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('weathergpt_language', newLang);
    } catch (e) {}
  };

  // Live GPS & Network Multi-Tier Geolocation Handler
  const handleGetLiveLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationStatusText('Detecting live location...');

    try {
      const result = await detectLiveLocation((status) => {
        setLocationStatusText(status);
      });
      if (result && result.weather) {
        setWeather(result.weather);
        try {
          localStorage.setItem('weathergpt_location', JSON.stringify(result.weather));
          localStorage.setItem('weathergpt_location_manual', 'false');
        } catch (e) {}
        setLocationError(null);
        setShowCitySelector(false);
      }
    } catch (err: any) {
      console.warn('Live location detection error:', err);
      setLocationError(err.message || 'Unable to detect live location. Please select a city manually.');
    } finally {
      setIsLocating(false);
      setLocationStatusText(null);
    }
  };

  // Register Service Worker for offline capability & weather caching on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Proactively sync fresh weather data to Service Worker cache whenever it changes
  useEffect(() => {
    if (weather && weather.city) {
      syncWeatherToServiceWorker(weather);
    }
  }, [weather]);

  // Live weather fetcher that updates both state and caches
  const refreshLiveWeather = async () => {
    setIsRefreshingLive(true);
    try {
      const cityToFetch = weather.city || 'Dehradun';
      const res = await fetch(`/api/weather/current?city=${encodeURIComponent(cityToFetch)}`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.city) {
          setWeather(liveData);
          try {
            localStorage.setItem('weathergpt_location', JSON.stringify(liveData));
          } catch (e) {}
          syncWeatherToServiceWorker(liveData);
        }
      }
    } catch (e) {
      console.warn('Live weather refresh failed (offline fallback active):', e);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  // Refresh weather on mount
  useEffect(() => {
    refreshLiveWeather();
  }, []);

  // Auto-refresh when internet connectivity is restored
  useEffect(() => {
    if (wasOffline && isOnline) {
      console.log('Internet connectivity restored, refreshing live weather...');
      refreshLiveWeather();
    }
  }, [wasOffline, isOnline]);

  // Auto-location on mount:
  // If user hasn't explicitly locked a manual city, detect their live location smoothly
  useEffect(() => {
    const isManuallyLocked = typeof window !== 'undefined' && localStorage.getItem('weathergpt_location_manual') === 'true';
    const hasCachedLocation = typeof window !== 'undefined' && localStorage.getItem('weathergpt_location');

    if (!isManuallyLocked && !hasCachedLocation) {
      detectLiveLocation()
        .then((result) => {
          if (result && result.weather) {
            setWeather(result.weather);
            syncWeatherToServiceWorker(result.weather);
          }
        })
        .catch((err) => {
          console.log('Passive initial location detection bypassed:', err?.message);
        });
    } else if (!isManuallyLocked && typeof window !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'granted') {
            handleGetLiveLocation();
          }
        })
        .catch(() => {});
    }
  }, []);

  // Switch City with Instant Real-Time Open-Meteo & IMD Live Weather
  const handleSelectCity = async (cityString: string) => {
    const cityName = cityString.split(',')[0].trim();
    try {
      localStorage.setItem('weathergpt_location_manual', 'true');
    } catch (e) {}

    // 1. Immediate optimistic UI update
    let initialWeather = weather;
    if (CITY_WEATHER_DATABASE[cityName]) {
      initialWeather = CITY_WEATHER_DATABASE[cityName];
    } else {
      initialWeather = {
        ...weather,
        city: cityName,
        state: cityString.includes(',') ? cityString.split(',')[1].trim() : weather.state
      };
    }
    setWeather(initialWeather);
    try {
      localStorage.setItem('weathergpt_location', JSON.stringify(initialWeather));
    } catch (e) {}

    // 2. Fetch authentic live meteorology from server API
    try {
      const res = await fetch(`/api/weather/current?city=${encodeURIComponent(cityName)}`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.city) {
          setWeather(liveData);
          try {
            localStorage.setItem('weathergpt_location', JSON.stringify(liveData));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Failed to fetch live weather for city:', err);
    }
  };

  // Switch to Pinpoint GPS coordinates (from locality or PIN code search)
  const handleSelectPinpointLocation = async (item: PinpointLocationItem) => {
    try {
      localStorage.setItem('weathergpt_location_manual', 'true');
    } catch (e) {}

    setIsRefreshingLive(true);
    setLocationError(null);

    try {
      const res = await fetch(`/api/weather/live-location?lat=${item.lat}&lon=${item.lon}&method=search_pinpoint`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData && liveData.city) {
          setWeather(liveData);
          try {
            localStorage.setItem('weathergpt_location', JSON.stringify(liveData));
          } catch (e) {}
          syncWeatherToServiceWorker(liveData);
          setShowCitySelector(false);
        }
      }
    } catch (err) {
      console.warn('Failed to load pinpoint location weather:', err);
    } finally {
      setIsRefreshingLive(false);
    }
  };

  // Hackathon Demo Scenario Handler
  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    if (scenario.id === 'dehradun_rain') {
      setWeather(CITY_WEATHER_DATABASE['Dehradun'] || DEFAULT_WEATHER_DATA);
    } else if (scenario.id === 'delhi_heatwave') {
      setWeather(CITY_WEATHER_DATABASE['Delhi NCR']);
    } else if (scenario.id === 'kisan_irrigation') {
      setWeather(CITY_WEATHER_DATABASE['Ludhiana']);
      setShowFarmerMode(true);
    } else if (scenario.id === 'bhubaneswar_cyclone') {
      setWeather(CITY_WEATHER_DATABASE['Bhubaneswar']);
      setShowWeatherAlerts(true);
    }
  };

  // Trip Management Handlers
  const handleUpdateTrip = (updated: RouteTrip) => {
    setTrip(updated);
    saveActiveTripToStorage(updated);
    setSavedTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      let nextList: RouteTrip[];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = updated;
      } else {
        nextList = [updated, ...prev];
      }
      saveTripsToStorage(nextList);
      return nextList;
    });
  };

  const handleSelectTrip = (selected: RouteTrip) => {
    const refreshed = calculateTripRouteWeather(
      selected.from,
      selected.to,
      selected.leaveBy,
      weather,
      selected.id
    );
    setTrip(refreshed);
    saveActiveTripToStorage(refreshed);
  };

  const handleDeleteTrip = (tripId: string) => {
    setSavedTrips((prev) => {
      const nextList = prev.filter((t) => t.id !== tripId);
      saveTripsToStorage(nextList);
      if (trip.id === tripId && nextList.length > 0) {
        setTrip(nextList[0]);
        saveActiveTripToStorage(nextList[0]);
      }
      return nextList;
    });
  };

  // Auto-sync active trip meteorological risks when weather changes
  useEffect(() => {
    if (weather && trip) {
      setTrip((prev) => {
        const refreshed = calculateTripRouteWeather(
          prev.from,
          prev.to,
          prev.leaveBy,
          weather,
          prev.id
        );
        saveActiveTripToStorage(refreshed);
        return refreshed;
      });
    }
  }, [weather.city, weather.condition, weather.temperature, weather.rainChance]);

  // Send message directly to AI Chat
  const handleSendMessageToChat = (query: string) => {
    setChatInitialQuery(query);
    setActiveTab('chat');
  };

  // If first-time user hasn't completed onboarding, show modern 4-step setup flow
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingScreen
        onComplete={handleOnboardingComplete}
        initialUserName={userName}
        initialEmail={user?.email || 'anmolsahu118@gmail.com'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center sm:py-6 font-sans">
      {/* Mobile-style viewport container */}
      <div
        id="app-container"
        className="w-full max-w-md h-[100dvh] sm:h-[844px] bg-slate-50 flex flex-col relative sm:rounded-[36px] shadow-2xl border border-slate-200/90 overflow-hidden"
      >
        {/* Top Status Bar (Cosmetic notch / time styling) */}
        <div className="h-6 bg-transparent shrink-0 flex items-center justify-between px-6 text-[10px] font-bold text-slate-400 select-none z-30">
          <span>{currentTime}</span>
          <div className="flex items-center space-x-1.5">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Dynamic Screen View Based on activeTab */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {activeTab === 'home' && (
            <div className="h-full overflow-y-auto pb-8 scroll-smooth">
              {/* 1. Header */}
              <Header
                city={weather.city}
                country={weather.country}
                onOpenMenu={() => setActiveTab('profile')}
                onOpenCitySelector={() => setShowCitySelector(true)}
                onOpenNotifications={() => setShowNotifications(true)}
                unreadAlertCount={alerts.filter((a) => a.isActive).length}
                onUseLiveLocation={handleGetLiveLocation}
                isLocating={isLocating}
                onOpenInstallApp={() => setShowInstallApp(true)}
                isOnline={isOnline}
                isOfflineCached={Boolean(weather.isOfflineCached)}
                onOpenLiveVoice={() => setShowLiveVoice(true)}
                onOpenGroundingExplorer={() => setShowGroundingExplorer(true)}
                onOpenTranscriber={() => setShowAudioTranscriber(true)}
                onOpenProfile={() => setActiveTab('profile')}
                currentLanguage={language}
                onOpenLanguageSelector={() => setShowLanguageSelector(true)}
              />

              {/* Offline Status & Cache Feedback Banner */}
              <OfflineIndicator
                isOnline={isOnline}
                wasOffline={wasOffline}
                onResetWasOffline={resetWasOffline}
                cachedAt={weather.offlineCachedAt}
                onRetryConnection={refreshLiveWeather}
                isRetrying={isRefreshingLive}
              />

              {/* 2. Personalized Greeting & Briefing Trigger */}
              <GreetingSection
                name={userName}
                language={language}
                onOpenBriefing={() => setShowDailyBriefing(true)}
              />

              {/* 3. Main Blue Gradient Weather Card */}
              <MainWeatherCard
                weather={weather}
                language={language}
                onSelectCity={() => setShowCitySelector(true)}
                onOpenDetails={() => {
                  setForecastModalTab('hourly');
                  setShowForecastDetails(true);
                }}
                onUseLiveLocation={handleGetLiveLocation}
                onOpenNWP={() => setShowNWPModels(true)}
                isLocating={isLocating}
                isOnline={isOnline}
              />

              {/* 4. Weather Metrics Grid (Rain, Temp, Humidity, AQI) */}
              <WeatherMetricsGrid
                weather={weather}
                language={language}
                onOpenAQIDetails={() => {
                  setForecastModalTab('aqi');
                  setShowForecastDetails(true);
                }}
                onOpenRainForecast={() => {
                  setForecastModalTab('hourly');
                  setShowForecastDetails(true);
                }}
              />

              {/* 5. Weather Risk Score & AI Recommendation Section */}
              <WeatherRiskSection
                weather={weather}
                language={language}
                onOpenExplainableAI={() => setShowExplainableAI(true)}
              />

              {/* 6. Your Next Trip Card */}
              <YourNextTripCard
                trip={trip}
                savedTrips={savedTrips}
                weather={weather}
                onOpenTripDetails={() => {
                  setTripModalMode('details');
                  setShowTripDetails(true);
                }}
                onNewTrip={() => {
                  setTripModalMode('new');
                  setShowTripDetails(true);
                }}
                onViewAllTrips={() => {
                  setTripModalMode('all');
                  setShowTripDetails(true);
                }}
                onSelectTrip={handleSelectTrip}
                onUpdateTrip={handleUpdateTrip}
                onOpenLiveMap={() => setActiveTab('map')}
              />

              {/* 6b. Dedicated Live Weather & Radar Map Preview Card */}
              <LiveMapHomeCard
                trip={trip}
                weather={weather}
                onOpenLiveMap={() => setActiveTab('map')}
              />

              {/* 7. Weather Alerts Card */}
              <WeatherAlertsCard
                alerts={alerts}
                onOpenAlertsModal={() => setShowWeatherAlerts(true)}
                onOpenWhatsAppAlerts={() => setShowWhatsAppAlerts(true)}
              />

              {/* 8. Ask WeatherGPT Input & Suggestion Chips */}
              <AskWeatherGPTCard
                language={language}
                onSendMessage={handleSendMessageToChat}
                onOpenVoice={() => setShowVoiceAssistant(true)}
              />

              {/* 9. Explore More Section */}
              <ExploreMoreSection
                onOpenForecast={() => {
                  setForecastModalTab('7day');
                  setShowForecastDetails(true);
                }}
                onOpenAQI={() => {
                  setForecastModalTab('aqi');
                  setShowForecastDetails(true);
                }}
                onOpenMap={(layer) => {
                  setMapInitialLayer(layer || 'rain');
                  setActiveTab('map');
                }}
                onOpenFarmer={() => setShowFarmerMode(true)}
                onOpenClimate={() => setShowClimateAnalytics(true)}
                onOpenDisasterNews={() => setActiveTab('news')}
                onOpenNWP={() => setShowNWPModels(true)}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <WeatherMapScreen
              initialLayer={mapInitialLayer}
              onSelectCity={handleSelectCity}
              onBackToHome={() => setActiveTab('home')}
              onUseLiveLocation={handleGetLiveLocation}
              isLocating={isLocating}
              currentWeather={weather}
              activeTrip={trip}
            />
          )}

          {activeTab === 'chat' && (
            <AIChatScreen
              weather={weather}
              trip={trip}
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              onBackToHome={() => {
                setChatInitialQuery(undefined);
                setActiveTab('home');
              }}
              initialQuery={chatInitialQuery}
            />
          )}

          {activeTab === 'news' && (
            <DisasterNewsScreen
              currentWeather={weather}
              activeTrip={trip}
              onBackToHome={() => setActiveTab('home')}
              onViewOnMap={(lat, lon, locationName) => {
                handleSelectCity(locationName);
                setActiveTab('map');
              }}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              userName={userName}
              onRerunOnboarding={() => setHasCompletedOnboarding(false)}
              currentLanguage={language}
              onLanguageChange={handleLanguageChange}
              userRole={userRole}
              onUserRoleChange={setUserRole}
              onSelectDemoScenario={handleSelectDemoScenario}
              onBackToHome={() => setActiveTab('home')}
              onOpenInstallApp={() => setShowInstallApp(true)}
              onOpenLiveVoice={() => setShowLiveVoice(true)}
              onOpenTranscriber={() => setShowAudioTranscriber(true)}
              onOpenWhatsAppAlerts={() => setShowWhatsAppAlerts(true)}
            />
          )}
        </div>

        {/* Bottom Persistent Navigation Bar */}
        <BottomNavigation
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenVoiceAssistant={() => setShowVoiceAssistant(true)}
          language={language}
        />

        {/* Modals & Dialog Overlays */}
        <DailyBriefingModal
          weather={weather}
          isOpen={showDailyBriefing}
          onClose={() => setShowDailyBriefing(false)}
          language={language}
          userName={userName}
        />

        <ExplainableAIModal
          weather={weather}
          isOpen={showExplainableAI}
          onClose={() => setShowExplainableAI(false)}
        />

        <TripDetailsModal
          trip={trip}
          isOpen={showTripDetails}
          onClose={() => setShowTripDetails(false)}
          onSaveTrip={handleUpdateTrip}
          initialMode={tripModalMode}
          savedTrips={savedTrips}
          onSelectTrip={handleSelectTrip}
          onDeleteTrip={handleDeleteTrip}
          weather={weather}
          onOpenLiveMap={() => {
            setShowTripDetails(false);
            setActiveTab('map');
          }}
        />

        <WeatherAlertsModal
          alerts={alerts}
          isOpen={showWeatherAlerts}
          onClose={() => setShowWeatherAlerts(false)}
          onOpenWhatsAppAlerts={() => setShowWhatsAppAlerts(true)}
        />

        <WhatsAppAlertsModal
          isOpen={showWhatsAppAlerts}
          onClose={() => setShowWhatsAppAlerts(false)}
          weather={weather}
        />

        <ForecastDetailsModal
          weather={weather}
          hourly={DEFAULT_HOURLY_FORECAST}
          daily={DEFAULT_DAILY_FORECAST}
          initialTab={forecastModalTab}
          isOpen={showForecastDetails}
          onClose={() => setShowForecastDetails(false)}
          onOpenNWP={() => setShowNWPModels(true)}
        />

        <NWPModelsModal
          isOpen={showNWPModels}
          onClose={() => setShowNWPModels(false)}
          city={weather.city}
          lat={weather.coordinates?.lat}
          lon={weather.coordinates?.lon}
        />

        <FarmerModeModal
          weather={weather}
          initialAdvisory={advisory}
          isOpen={showFarmerMode}
          onClose={() => setShowFarmerMode(false)}
        />

        <ClimateAnalyticsModal
          isOpen={showClimateAnalytics}
          onClose={() => setShowClimateAnalytics(false)}
          currentCity={weather.city}
          coordinates={weather.coordinates}
        />

        <CitySelectorModal
          currentCity={weather.city}
          isOpen={showCitySelector}
          onClose={() => setShowCitySelector(false)}
          onSelectCity={handleSelectCity}
          onSelectPinpointLocation={handleSelectPinpointLocation}
          onUseLiveLocation={handleGetLiveLocation}
          isLocating={isLocating}
          locationError={locationError}
          locationStatusText={locationStatusText}
        />

        <NotificationsModal
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onOpenAlerts={() => setShowWeatherAlerts(true)}
          onOpenBriefing={() => setShowDailyBriefing(true)}
        />

        <VoiceAssistantModal
          weather={weather}
          isOpen={showVoiceAssistant}
          onClose={() => setShowVoiceAssistant(false)}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />

        {showInstallApp && (
          <InstallAppModal onClose={() => setShowInstallApp(false)} />
        )}

        {/* Gemini Live Voice Modal (WebSocket raw PCM audio) */}
        <LiveVoiceConversationModal
          isOpen={showLiveVoice}
          onClose={() => setShowLiveVoice(false)}
          weather={weather}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />

        {/* Global Language Selector Modal */}
        <LanguageSelectorModal
          isOpen={showLanguageSelector}
          onClose={() => setShowLanguageSelector(false)}
          currentLanguage={language}
          onSelectLanguage={handleLanguageChange}
        />

        {/* Gemini Audio Transcriber Modal (gemini-3.5-transcribe) */}
        <AudioTranscriberModal
          isOpen={showAudioTranscriber}
          onClose={() => setShowAudioTranscriber(false)}
          onApplyTranscription={(text) => {
            setShowAudioTranscriber(false);
            setChatInitialQuery(text);
            setActiveTab('chat');
          }}
        />

        {/* Gemini Grounding Explorer Modal (Live Search & Geospatial Grounding) */}
        <GeminiGroundingExplorerModal
          isOpen={showGroundingExplorer}
          onClose={() => setShowGroundingExplorer(false)}
          currentCity={weather.city}
        />
      </div>
    </div>
  );
}
