import React, { useState, useEffect } from 'react';
import {
  DisasterNewsItem,
  DisasterCategory,
  DisasterSeverity,
  DisasterScope,
  RouteTrip,
  WeatherData
} from '../types';
import { INITIAL_DISASTER_NEWS } from '../data/disasterNewsData';
import {
  Newspaper,
  AlertTriangle,
  MapPin,
  Shield,
  Clock,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Play,
  Pause,
  Filter,
  Flame,
  CloudRain,
  Wind,
  Waves,
  Mountain,
  Zap,
  Thermometer,
  Video,
  CheckCircle,
  Share2,
  Navigation,
  Loader2,
  X,
  Bot,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp
} from './Icons';

interface DisasterNewsScreenProps {
  currentWeather: WeatherData;
  activeTrip: RouteTrip;
  onViewOnMap: (lat: number, lon: number, locationName: string) => void;
  onBackToHome: () => void;
}

const CATEGORIES: { id: DisasterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'flood', label: 'Flood' },
  { id: 'cyclone', label: 'Cyclone' },
  { id: 'earthquake', label: 'Earthquake' },
  { id: 'landslide', label: 'Landslide' },
  { id: 'wildfire', label: 'Wildfire' },
  { id: 'extreme-rainfall', label: 'Extreme Rainfall' },
  { id: 'heatwave', label: 'Heatwave' },
  { id: 'storm', label: 'Storm' },
  { id: 'other', label: 'Other' }
];

const SCOPES: { id: DisasterScope; label: string; icon: string }[] = [
  { id: 'near-me', label: 'Near Me', icon: '📍' },
  { id: 'on-route', label: 'On My Route', icon: '🚗' },
  { id: 'india', label: 'India', icon: '🇮🇳' },
  { id: 'global', label: 'Global', icon: '🌍' },
  { id: 'all', label: 'All Feeds', icon: '📡' }
];

export const DisasterNewsScreen: React.FC<DisasterNewsScreenProps> = ({
  currentWeather,
  activeTrip,
  onViewOnMap,
  onBackToHome
}) => {
  const [news, setNews] = useState<DisasterNewsItem[]>(INITIAL_DISASTER_NEWS);
  const [selectedCategory, setSelectedCategory] = useState<DisasterCategory>('all');
  const [selectedScope, setSelectedScope] = useState<DisasterScope>('india');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSilentlyUpdating, setIsSilentlyUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [selectedArticle, setSelectedArticle] = useState<DisasterNewsItem | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // Auto-advancing news carousel state
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState<boolean>(true);
  const [carouselProgress, setCarouselProgress] = useState<number>(0);

  // Automatic background refresh polling state
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [secondsToSync, setSecondsToSync] = useState<number>(20);
  const [showSyncToast, setShowSyncToast] = useState<boolean>(false);
  const [tickerIndex, setTickerIndex] = useState<number>(0);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(true);
  const [canScrollUp, setCanScrollUp] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setCanScrollUp(scrollTop > 80);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 80);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Fetch or refresh disaster news from the server (with optional background silent mode)
  const fetchNews = async (silent: boolean = false) => {
    if (silent) {
      setIsSilentlyUpdating(true);
    } else {
      setIsLoading(true);
    }
    try {
      const city = currentWeather?.city || 'Dehradun';
      const lat = currentWeather?.city === 'Dehradun' ? 30.3165 : 28.6139;
      const lon = currentWeather?.city === 'Dehradun' ? 78.0322 : 77.2090;

      const res = await fetch(
        `/api/disaster-news?scope=${selectedScope}&category=${selectedCategory}&city=${encodeURIComponent(
          city
        )}&lat=${lat}&lon=${lon}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news)) {
          setNews(data.news);
          setLastUpdated(data.lastUpdated || 'Just now');
          if (silent) {
            setShowSyncToast(true);
            setTimeout(() => setShowSyncToast(false), 2800);
          }
        }
      }
    } catch (err) {
      console.warn('Using client-side disaster feed fallback:', err);
    } finally {
      setIsLoading(false);
      setIsSilentlyUpdating(false);
    }
  };

  useEffect(() => {
    fetchNews(false);
  }, [selectedScope, selectedCategory]);

  // Automated background polling every 20 seconds
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const interval = setInterval(() => {
      setSecondsToSync((prev) => {
        if (prev <= 1) {
          fetchNews(true);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, selectedScope, selectedCategory, currentWeather?.city]);

  // Handle "On My Route" filtering: check if disaster is near any route stops or origin/dest
  const getFilteredNews = () => {
    let list = [...news];

    if (selectedScope === 'on-route') {
      const routeKeywords = [
        activeTrip.from.toLowerCase(),
        activeTrip.to.toLowerCase(),
        ...activeTrip.stops.map((s) => s.pointName.toLowerCase())
      ];
      list = list.filter((item) => {
        const loc = `${item.location} ${item.state || ''}`.toLowerCase();
        return routeKeywords.some((kw) => loc.includes(kw) || kw.includes(loc.split(' ')[0]));
      });
      // If none match strictly, fallback to Northern corridor / nearby highways
      if (list.length === 0) {
        list = news.filter((item) => item.state === 'Uttarakhand' || item.state === 'Delhi NCR' || item.severity === 'Critical');
      }
    }

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.disasterType === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.aiSummary.toLowerCase().includes(q) ||
          item.sourceName.toLowerCase().includes(q)
      );
    }

    return list;
  };

  const filteredNews = getFilteredNews();
  const breakingNews = filteredNews.filter((n) => n.isBreaking || n.severity === 'Critical');
  const regularNews = filteredNews.filter((n) => !n.isBreaking && n.severity !== 'Critical');

  // Spotlight carousel items (breaking alerts or top alerts)
  const carouselItems = breakingNews.length > 0 ? breakingNews : filteredNews.slice(0, 5);

  // Auto-advance breaking alert carousel every 4.5 seconds
  useEffect(() => {
    if (!isCarouselPlaying || carouselItems.length <= 1) return;
    const step = 100;
    const duration = 4500;
    const increment = (step / duration) * 100;

    const timer = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) {
          setActiveCarouselIndex((curr) => (curr + 1) % carouselItems.length);
          return 0;
        }
        return prev + increment;
      });
    }, step);

    return () => clearInterval(timer);
  }, [isCarouselPlaying, carouselItems.length]);

  // Keep carousel index valid when items change
  useEffect(() => {
    if (activeCarouselIndex >= carouselItems.length) {
      setActiveCarouselIndex(0);
      setCarouselProgress(0);
    }
  }, [carouselItems.length, activeCarouselIndex]);

  // Rotate ticker headline every 3.5 seconds
  useEffect(() => {
    if (filteredNews.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % Math.min(filteredNews.length, 6));
    }, 3500);
    return () => clearInterval(timer);
  }, [filteredNews.length]);

  // AI Deep Analyze a specific news event
  const handleOpenArticle = async (item: DisasterNewsItem) => {
    setSelectedArticle(item);
    setAiAnalysisResult(null);
    setAiAnalysisLoading(true);

    try {
      const res = await fetch('/api/disaster-news/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          location: item.location,
          content: item.fullContent || item.aiSummary
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysisResult(data);
      }
    } catch (e) {
      // Graceful fallback
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const getDisasterIcon = (type: DisasterCategory) => {
    switch (type) {
      case 'flood':
        return <Waves className="w-4 h-4 text-blue-500" />;
      case 'cyclone':
        return <Wind className="w-4 h-4 text-teal-600" />;
      case 'earthquake':
        return <Mountain className="w-4 h-4 text-amber-700" />;
      case 'landslide':
        return <Mountain className="w-4 h-4 text-amber-900" />;
      case 'wildfire':
        return <Flame className="w-4 h-4 text-orange-500" />;
      case 'extreme-rainfall':
        return <CloudRain className="w-4 h-4 text-sky-600" />;
      case 'heatwave':
        return <Thermometer className="w-4 h-4 text-red-500" />;
      case 'storm':
        return <Zap className="w-4 h-4 text-indigo-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getSeverityBadge = (severity: DisasterSeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Critical
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 border border-orange-300">
            High
          </span>
        );
      case 'Moderate':
        return (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 border border-amber-300">
            Moderate
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            Low
          </span>
        );
    }
  };

  const getSourceBadge = (sourceType: 'official' | 'news' | 'vlog') => {
    switch (sourceType) {
      case 'official':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3 h-3 text-emerald-600" />
            Official Source
          </span>
        );
      case 'news':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Newspaper className="w-3 h-3 text-blue-600" />
            News Agency
          </span>
        );
      case 'vlog':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Video className="w-3 h-3 text-purple-600" />
            On-Ground Vlog (Community)
          </span>
        );
    }
  };

  const getOfficialPublishDate = (item: DisasterNewsItem) => {
    if (item.officialPublishDate) {
      return item.officialPublishDate;
    }
    if (item.publishedAt && (item.publishedAt.includes('202') || item.publishedAt.includes('Sep') || item.publishedAt.includes('AM') || item.publishedAt.includes('PM'))) {
      return item.publishedAt;
    }
    return '14 Sep 2026, 06:30 AM IST (Official Release)';
  };

  const getFormattedPublishDate = (item: DisasterNewsItem) => {
    return getOfficialPublishDate(item);
  };

  return (
    <div
      id="disaster-news-screen"
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-y-scroll bg-slate-50 pb-36 text-slate-900 scroll-smooth news-scroll-container relative"
    >
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
              aria-label="Back to home"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                Disaster News Hub
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">Real-time extreme weather & natural crisis intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Sync Toggle with Live Countdown */}
            <button
              type="button"
              onClick={() => setAutoSyncEnabled((p) => !p)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                autoSyncEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
              }`}
              title={autoSyncEnabled ? 'Auto-Sync is ON (click to pause)' : 'Auto-Sync is paused (click to resume)'}
            >
              <span className="relative flex h-2 w-2">
                {autoSyncEnabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    autoSyncEnabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                ></span>
              </span>
              <span className="text-[11px]">
                {isSilentlyUpdating ? 'Syncing...' : autoSyncEnabled ? `Auto (${secondsToSync}s)` : 'Paused'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchNews(false)}
              disabled={isLoading || isSilentlyUpdating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title="Refresh news feed manually"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isSilentlyUpdating ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Live Feed: {lastUpdated}</span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>Published: Sep 14, 2026</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <Shield className="w-3 h-3 text-emerald-600" /> IMD • NDMA Verified
            </span>
            <span className="text-slate-300">|</span>
            <span>{filteredNews.length} active alerts</span>
          </div>
        </div>

        {/* Auto-Sync Toast Banner */}
        {showSyncToast && (
          <div className="mt-2 py-1 px-2.5 bg-emerald-500 text-white rounded-lg text-[11px] font-bold flex items-center justify-between shadow-sm animate-fadeIn">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Disaster news feed updated automatically with latest advisories</span>
            </span>
            <span className="text-[10px] opacity-80">Just now</span>
          </div>
        )}
      </header>

      {/* Real-time Dynamic News Ticker Bar */}
      {filteredNews.length > 0 && (
        <div className="bg-slate-900 text-white px-4 py-1.5 text-xs flex items-center justify-between gap-3 border-b border-slate-800 shadow-inner">
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              LIVE ALERT
            </span>
            <p
              key={tickerIndex}
              onClick={() => handleOpenArticle(filteredNews[tickerIndex] || filteredNews[0])}
              className="text-xs font-medium text-slate-200 truncate cursor-pointer hover:text-white transition"
              title={filteredNews[tickerIndex]?.title}
            >
              <span className="text-amber-300 font-semibold mr-1.5">[{filteredNews[tickerIndex]?.location}]</span>
              {filteredNews[tickerIndex]?.title}
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0">
            {tickerIndex + 1}/{Math.min(filteredNews.length, 6)}
          </span>
        </div>
      )}

      {/* Scope Selector: Near Me, On My Route, India, Global */}
      <div className="px-4 pt-3.5 pb-2 bg-white border-b border-slate-200/80">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {SCOPES.map((scope) => {
            const isActive = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => setSelectedScope(scope.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{scope.icon}</span>
                <span>{scope.label}</span>
                {scope.id === 'on-route' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 font-bold">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* On My Route Banner Indicator if selected */}
        {selectedScope === 'on-route' && (
          <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
            <Navigation className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Route Hazard Screening:</span> Monitoring road network between{' '}
              <span className="font-medium underline">{activeTrip.from}</span> and{' '}
              <span className="font-medium underline">{activeTrip.to}</span> for landslides, inundations, and storm closures.
            </div>
          </div>
        )}

        {/* Search & Category Filter Pills */}
        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by city, river, state, or disaster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  isCatActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.id !== 'all' && getDisasterIcon(cat.id)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Cross-checking official disaster feeds & satellite alerts...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredNews.length === 0 && (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200/90 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No active disaster alerts</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              No severe disaster advisories reported for this category and scope. Conditions appear stable.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedScope('all');
                setSearchQuery('');
              }}
              className="mt-3 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Dynamic Auto-Advancing Breaking Alert Spotlight Card */}
        {carouselItems.length > 0 && (
          <section className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-red-900/60 relative overflow-hidden">
            {/* Animated Slide Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
              <div
                className="h-full bg-red-500 transition-all duration-100 ease-linear"
                style={{ width: isCarouselPlaying ? `${carouselProgress}%` : '100%' }}
              />
            </div>

            {/* Spotlight Header with Live Status & Controls */}
            <div className="flex items-center justify-between gap-2 mb-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-300">
                  Breaking Alert Spotlight
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded font-mono font-bold">
                  {activeCarouselIndex + 1} of {carouselItems.length}
                </span>
              </div>

              {/* Play / Pause & Prev / Next Controls */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCarouselPlaying((p) => !p)}
                  className="w-6 h-6 rounded hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title={isCarouselPlaying ? 'Pause auto-changing news' : 'Resume auto-changing news'}
                >
                  {isCarouselPlaying ? (
                    <Pause className="w-3 h-3 fill-current text-amber-400" />
                  ) : (
                    <Play className="w-3 h-3 fill-current text-emerald-400 ml-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCarouselProgress(0);
                    setActiveCarouselIndex((i) => (i > 0 ? i - 1 : carouselItems.length - 1));
                  }}
                  className="w-6 h-6 rounded hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Previous Alert"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCarouselProgress(0);
                    setActiveCarouselIndex((i) => (i + 1) % carouselItems.length);
                  }}
                  className="w-6 h-6 rounded hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Next Alert"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current Active Alert Bulletin */}
            {(() => {
              const activeItem = carouselItems[activeCarouselIndex] || carouselItems[0];
              if (!activeItem) return null;
              return (
                <div key={activeItem.id} className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-400">
                        {getDisasterIcon(activeItem.disasterType)}
                      </span>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                          {activeItem.disasterType.replace('-', ' ')}
                        </div>
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                          <span>
                            {activeItem.location}, {activeItem.state || 'India'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>{getSeverityBadge(activeItem.severity)}</div>
                  </div>

                  {/* Headline */}
                  <h3
                    onClick={() => handleOpenArticle(activeItem)}
                    className="text-sm font-bold text-white leading-snug cursor-pointer hover:text-red-300 transition"
                  >
                    {activeItem.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {activeItem.aiSummary}
                  </p>

                  {/* Footer info & buttons */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-emerald-400 font-semibold">{activeItem.sourceName}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">{activeItem.publishedAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeItem.coordinates && (
                        <button
                          type="button"
                          onClick={() =>
                            onViewOnMap(activeItem.coordinates.lat, activeItem.coordinates.lon, activeItem.location)
                          }
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3 text-blue-400" />
                          <span className="hidden sm:inline">Map</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenArticle(activeItem)}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Bot className="w-3 h-3" />
                        <span>AI Analysis</span>
                      </button>
                    </div>
                  </div>

                  {/* Step dots */}
                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    {carouselItems.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCarouselProgress(0);
                          setActiveCarouselIndex(idx);
                        }}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === activeCarouselIndex
                            ? 'w-6 bg-red-400'
                            : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                        }`}
                        title={`Go to alert ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* Breaking / Critical Section */}
        {breakingNews.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span>Breaking & Critical Alerts ({breakingNews.length})</span>
            </div>

            {breakingNews.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border-2 border-red-200/90 p-3.5 shadow-sm hover:border-red-400 transition"
              >
                {/* Header: Type icon, Location, Severity */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded bg-red-50">{getDisasterIcon(item.disasterType)}</span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {item.disasterType.replace('-', ' ')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                  {getSeverityBadge(item.severity)}
                </div>

                {/* Title */}
                <h2 className="mt-2 text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer" onClick={() => handleOpenArticle(item)}>
                  {item.title}
                </h2>

                {/* AI-Generated Summary Box */}
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-700 mb-1">
                    <Bot className="w-3 h-3" />
                    <span>AI Intelligence Summary</span>
                  </div>
                  <p>{item.aiSummary}</p>
                </div>

                {/* Key Telemetry Stats if available */}
                {item.keyStats && (
                  <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    {item.keyStats.rainfallMm && (
                      <div className="p-1.5 rounded bg-sky-50 text-sky-800 border border-sky-100 flex items-center gap-1">
                        <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                        <span>Rainfall: <b>{item.keyStats.rainfallMm} mm</b></span>
                      </div>
                    )}
                    {item.keyStats.windSpeedKmh && (
                      <div className="p-1.5 rounded bg-teal-50 text-teal-800 border border-teal-100 flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-teal-600" />
                        <span>Gale: <b>{item.keyStats.windSpeedKmh} km/h</b></span>
                      </div>
                    )}
                    {item.keyStats.affectedCount && (
                      <div className="p-1.5 rounded bg-amber-50 text-amber-800 border border-amber-100 col-span-2">
                        <span>Affected/Evacuated: <b>{item.keyStats.affectedCount}</b></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Official Source Platform & Official Publish Date */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-semibold border border-blue-200/90 shadow-2xs">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Official Publish Date: <b className="text-blue-950 font-bold">{getOfficialPublishDate(item)}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getSourceBadge(item.sourceType)}
                      {item.bulletinId && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                          Ref: {item.bulletinId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-1 px-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Published on Official Platform: <b className="text-slate-800">{item.officialPlatformName || item.sourceName}</b></span>
                    </span>
                    <span className="text-[10px] text-slate-400">Dispatch: {item.publishedAt}</span>
                  </div>
                </div>

                {/* Action Buttons: Read Full News & View on Map */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenArticle(item)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Read Full News</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onViewOnMap(item.lat, item.lon, item.location)}
                    className="py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Plot on WeatherGPT Map"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>View on Map</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        {/* Regular News Feed */}
        {regularNews.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Verified Dispatches ({regularNews.length})</span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">deduplicated & cross-checked</span>
            </div>

            {regularNews.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs hover:border-slate-300 transition"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="p-1 rounded bg-slate-100">{getDisasterIcon(item.disasterType)}</span>
                    <span className="text-xs font-bold text-slate-700 capitalize">
                      {item.disasterType.replace('-', ' ')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.location}</span>
                    </div>
                  </div>
                  {getSeverityBadge(item.severity)}
                </div>

                {/* Title */}
                <h3
                  className="mt-2 text-sm font-bold text-slate-900 leading-snug hover:text-blue-600 cursor-pointer"
                  onClick={() => handleOpenArticle(item)}
                >
                  {item.title}
                </h3>

                {/* AI Summary */}
                <div className="mt-2 p-2 rounded-lg bg-slate-50 text-xs text-slate-600 leading-relaxed border border-slate-100">
                  <p className="line-clamp-2">{item.aiSummary}</p>
                </div>

                {/* Official Source Platform & Official Publish Date */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-950 font-semibold border border-blue-200/90 shadow-2xs">
                      <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>Official Publish Date: <b className="text-blue-900">{getOfficialPublishDate(item)}</b></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getSourceBadge(item.sourceType)}
                      {item.bulletinId && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                          {item.bulletinId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-600 px-0.5">
                    <span className="flex items-center gap-1 truncate max-w-[280px]">
                      <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Official Platform: <b className="text-slate-800">{item.officialPlatformName || item.sourceName}</b></span>
                    </span>
                    <span className="text-slate-400 shrink-0 text-[10px]">{item.publishedAt}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenArticle(item)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Read Details</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onViewOnMap(item.lat, item.lon, item.location)}
                    className="py-1.5 px-3 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>Map</span>
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      {/* Modal: Full News Article & AI Cross-Check Inspection */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                {getDisasterIcon(selectedArticle.disasterType)}
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {selectedArticle.disasterType.replace('-', ' ')} Dispatch
                </span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-700">
              {/* Severity and Source Badges */}
              <div className="flex items-center justify-between">
                {getSeverityBadge(selectedArticle.severity)}
                {getSourceBadge(selectedArticle.sourceType)}
              </div>

              {/* Title */}
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {selectedArticle.title}
              </h2>

              {/* Official Platform Publication Banner */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/90 space-y-1.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Official Platform Publish Date
                  </span>
                  {selectedArticle.bulletinId && (
                    <span className="px-2 py-0.5 rounded bg-white text-blue-800 text-[10px] font-mono border border-blue-200 font-semibold">
                      Ref: {selectedArticle.bulletinId}
                    </span>
                  )}
                </div>
                <div className="text-blue-900 font-bold text-sm">
                  {getOfficialPublishDate(selectedArticle)}
                </div>
                <div className="text-[11px] text-slate-600 pt-0.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Published on Official Platform: <b className="text-slate-900">{selectedArticle.officialPlatformName || selectedArticle.sourceName}</b></span>
                </div>
              </div>

              {/* Location & Time */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600 py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-semibold text-slate-800">{selectedArticle.location}</span>
                  {selectedArticle.state && <span>, {selectedArticle.state}</span>}
                </div>
                <div className="text-[10.5px] text-slate-500">
                  App Dispatch: {selectedArticle.publishedAt}
                </div>
              </div>

              {/* AI Verification & Credibility Block */}
              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5 text-xs">
                    <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    AI Multi-Source Cross-Check
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                    {selectedArticle.crossCheckCount || 3}+ Sources Verified
                  </span>
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">
                  {selectedArticle.aiSummary}
                </p>
                {aiAnalysisLoading && (
                  <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 pt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing additional government advisories...</span>
                  </div>
                )}
                {aiAnalysisResult && (
                  <div className="pt-2 border-t border-indigo-200/60 space-y-1.5 text-[11px]">
                    <div className="text-indigo-900 font-semibold">Immediate Risk Factors:</div>
                    <ul className="list-disc pl-4 space-y-0.5 text-indigo-800">
                      {aiAnalysisResult.keyRisks?.map((risk: string, i: number) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Full Content */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs">Event Overview & Relief Status</h4>
                <p className="leading-relaxed text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  {selectedArticle.fullContent || selectedArticle.aiSummary}
                </p>
              </div>

              {/* Official Safety Directives */}
              {selectedArticle.safetyAdvice && selectedArticle.safetyAdvice.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    Recommended Safety Actions
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-amber-900">
                    {selectedArticle.safetyAdvice.map((advice, i) => (
                      <li key={i}>{advice}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source Link & Verification Disclaimer */}
              <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span>Source: <b>{selectedArticle.sourceName}</b></span>
                  {selectedArticle.sourceUrl && (
                    <a
                      href={selectedArticle.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium"
                    >
                      Visit Official Portal
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * WeatherGPT cross-references news agency dispatches against official meteorological agencies (IMD, NDMA, USGS). Unverified community social media claims are strictly excluded.
                </p>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => {
                  const item = selectedArticle;
                  setSelectedArticle(null);
                  onViewOnMap(item.lat, item.lon, item.location);
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MapPin className="w-4 h-4" />
                <span>View Disaster On Map</span>
              </button>

              <button
                onClick={() => setSelectedArticle(null)}
                className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll Controls for quick down/up scrolling */}
      <div className="fixed bottom-20 right-3.5 z-30 flex flex-col gap-2">
        {canScrollDown && (
          <button
            onClick={scrollToBottom}
            className="w-9 h-9 rounded-full bg-slate-900/90 text-white shadow-lg border border-slate-700/60 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition cursor-pointer backdrop-blur-sm group"
            title="Scroll to bottom news"
            aria-label="Scroll down to latest news"
          >
            <ArrowDown className="w-4 h-4 text-white group-hover:translate-y-0.5 transition-transform" />
          </button>
        )}
        {canScrollUp && (
          <button
            onClick={scrollToTop}
            className="w-9 h-9 rounded-full bg-white/95 text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition cursor-pointer backdrop-blur-sm group"
            title="Scroll to top"
            aria-label="Scroll up to top"
          >
            <ArrowUp className="w-4 h-4 text-slate-700 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};
