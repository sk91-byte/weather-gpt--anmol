import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Calendar,
  Search,
  Sparkles,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Zap,
  ChevronRight,
  BarChart2,
  Table as TableIcon,
  Info,
  Layers,
  ArrowRight,
  Flame,
  Droplets
} from './Icons';
import {
  generateClimateProfileForLocation,
  HISTORICAL_CLIMATE_DATABASE,
  CityClimateProfile,
  AnnualClimateRecord
} from '../services/climateService';

interface ClimateAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  coordinates?: { lat: number; lon: number };
}

type ChartTab = 'temperature' | 'rainfall' | 'extreme' | 'normals' | 'table';

export const ClimateAnalyticsModal: React.FC<ClimateAnalyticsModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  coordinates
}) => {
  if (!isOpen) return null;

  // Selected city & query state
  const [selectedCityName, setSelectedCityName] = useState<string>(currentCity || 'Dehradun');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<ChartTab>('temperature');
  const [hoveredYear, setHoveredYear] = useState<number | null>(2026);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(6); // July default
  const [nlQuery, setNlQuery] = useState('');
  const [nlAnswer, setNlAnswer] = useState<string | null>(null);

  // Active climate profile
  const climateProfile: CityClimateProfile = useMemo(() => {
    return generateClimateProfileForLocation(
      selectedCityName,
      coordinates?.lat,
      coordinates?.lon
    );
  }, [selectedCityName, coordinates]);

  const records = climateProfile.annualRecords;
  const currentHoveredRecord = useMemo(() => {
    if (!hoveredYear) return records[records.length - 1];
    return records.find((r) => r.year === hoveredYear) || records[records.length - 1];
  }, [records, hoveredYear]);

  // Handle Natural Language Climate Questions
  const handleAskClimate = (query: string) => {
    setNlQuery(query);
    const q = query.toLowerCase();
    if (q.includes('hot') || q.includes('temp') || q.includes('warm')) {
      setNlAnswer(
        `Observational climate records for ${climateProfile.cityName} (2016-2026) demonstrate a mean temperature increase of +${(climateProfile.warmingRatePerDecade).toFixed(2)}°C per decade. Summer peak maximums have pushed from ${records[0].maxSummerTemp}°C (2016) to ${records[records.length - 1].maxSummerTemp}°C (2026), expanding severe heat days by ${(climateProfile.extremeEventTrendPct * 0.1).toFixed(1)} days annually.`
      );
    } else if (q.includes('rain') || q.includes('monsoon') || q.includes('flood')) {
      setNlAnswer(
        `Monsoon analysis for ${climateProfile.cityName} reveals that while annual precipitation volume has varied between ${Math.min(...records.map(r => r.annualRainfallMm))}mm and ${Math.max(...records.map(r => r.annualRainfallMm))}mm, the distribution has become heavily skewed toward high-intensity cloudbursts (>65mm/day), producing higher runoff peaks and flash urban waterlogging.`
      );
    } else if (q.includes('extreme') || q.includes('hazard') || q.includes('risk')) {
      setNlAnswer(
        `Severe weather frequency in ${climateProfile.cityName} has accelerated by ${climateProfile.extremeEventTrendPct}%. Annual extreme event days (heatwaves >40°C or torrential rains) rose from ${records[0].extremeEventDays} days in 2016 to ${records[records.length - 1].extremeEventDays} days in 2026.`
      );
    } else {
      setNlAnswer(
        `WeatherGPT Decadal Assessment for ${climateProfile.cityName}: Long-term baseline comparison (1991-2020 normal vs 2021-2026) confirms an anomaly of +${records[records.length - 1].anomalyVsBaseline}°C. Peak seasonal variance is concentrated in pre-monsoon convective thunderstorms and extended thermal heat retention.`
      );
    }
  };

  const handleSelectPredefinedCity = (name: string) => {
    setSelectedCityName(name);
    setHoveredYear(2026);
    setNlAnswer(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCityName(searchQuery.trim());
      setSearchQuery('');
      setHoveredYear(2026);
      setNlAnswer(null);
    }
  };

  // SVG Chart Geometry Constants
  const chartWidth = 620;
  const chartHeight = 220;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Temperature scales
  const minTemp = Math.min(...records.map(r => r.minWinterTemp)) - 1;
  const maxTemp = Math.max(...records.map(r => r.maxSummerTemp)) + 2;
  const getX = (index: number) => padding.left + (index / (records.length - 1)) * innerWidth;
  const getYTemp = (temp: number) => padding.top + innerHeight - ((temp - minTemp) / (maxTemp - minTemp)) * innerHeight;

  // Rainfall scales
  const maxRain = Math.max(...records.map(r => r.annualRainfallMm), climateProfile.baselineNormalRainfall) * 1.15;
  const getYRain = (rain: number) => padding.top + innerHeight - (rain / maxRain) * innerHeight;

  // Extreme event scales
  const maxExtreme = Math.max(...records.map(r => r.extremeEventDays)) + 4;
  const getYExtreme = (days: number) => padding.top + innerHeight - (days / maxExtreme) * innerHeight;

  // Temperature Line Paths
  const avgTempPoints = records.map((r, i) => `${getX(i)},${getYTemp(r.avgTemp)}`).join(' ');
  const maxTempPoints = records.map((r, i) => `${getX(i)},${getYTemp(r.maxSummerTemp)}`).join(' ');
  const minTempPoints = records.map((r, i) => `${getX(i)},${getYTemp(r.minWinterTemp)}`).join(' ');
  const avgTempArea = `${getX(0)},${padding.top + innerHeight} ` + avgTempPoints + ` ${getX(records.length - 1)},${padding.top + innerHeight}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="modal-climate-analytics"
        className="w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight">Climate Trends & Historical Intelligence</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40">
                  2016 – 2026 Archive
                </span>
              </div>
              <p className="text-xs text-purple-200/90 flex items-center gap-1.5 mt-0.5">
                <span>{climateProfile.cityName}</span>
                <span>•</span>
                <span className="capitalize">{climateProfile.regionType} Region</span>
                <span>•</span>
                <span className="text-amber-300 font-semibold">+{climateProfile.warmingRatePerDecade}°C/decade</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer active:scale-90"
            title="Close Modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Top Control Bar: City Presets & Search */}
        <div className="bg-slate-50 p-3 sm:px-5 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Quick City Presets */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1 shrink-0">Region:</span>
            {[
              { id: 'Dehradun', label: '🏔️ Dehradun' },
              { id: 'Delhi', label: '🏛️ Delhi NCR' },
              { id: 'Mumbai', label: '🌊 Mumbai' },
              { id: 'Bengaluru', label: '🌳 Bengaluru' }
            ].map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelectPredefinedCity(city.id)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                  selectedCityName.toLowerCase().includes(city.id.toLowerCase())
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {city.label}
              </button>
            ))}
            {currentCity && !['dehradun', 'delhi', 'mumbai', 'bengaluru'].some(c => currentCity.toLowerCase().includes(c)) && (
              <button
                type="button"
                onClick={() => handleSelectPredefinedCity(currentCity)}
                className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                  selectedCityName.toLowerCase() === currentCity.toLowerCase()
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                📍 {currentCity}
              </button>
            )}
          </div>

          {/* Search any city */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1.5 sm:max-w-xs w-full">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any city or district..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition cursor-pointer shrink-0"
            >
              Analyze
            </button>
          </form>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 bg-white">
          {/* Executive Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-purple-50/80 border border-purple-200/70 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 mb-1">
                <span>Warming Pace</span>
                <Thermometer className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-xl font-black text-purple-950">
                +{climateProfile.warmingRatePerDecade}°C <span className="text-[10px] font-semibold text-purple-700">/ dec</span>
              </div>
              <p className="text-[10px] text-purple-700 mt-1 font-medium">
                Baseline shift vs 1991-2020 normal
              </p>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-1">
                <span>Summer Peak</span>
                <Flame className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-950">
                {records[records.length - 1].maxSummerTemp}°C
              </div>
              <p className="text-[10px] text-amber-700 mt-1 font-medium">
                Up from {records[0].maxSummerTemp}°C in 2016
              </p>
            </div>

            <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 mb-1">
                <span>Annual Rainfall</span>
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-xl font-black text-blue-950">
                {records[records.length - 1].annualRainfallMm} <span className="text-[10px] font-semibold text-blue-700">mm</span>
              </div>
              <p className="text-[10px] text-blue-700 mt-1 font-medium">
                {records[records.length - 1].monsoonAnomalyPct >= 0 ? '+' : ''}{records[records.length - 1].monsoonAnomalyPct}% vs baseline ({climateProfile.baselineNormalRainfall}mm)
              </p>
            </div>

            <div className="p-3 bg-rose-50/80 border border-rose-200/70 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-900 mb-1">
                <span>Extreme Days</span>
                <Zap className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-950">
                {records[records.length - 1].extremeEventDays} <span className="text-[10px] font-semibold text-rose-700">days/yr</span>
              </div>
              <p className="text-[10px] text-rose-700 mt-1 font-medium">
                +{climateProfile.extremeEventTrendPct}% surge in severe anomalies
              </p>
            </div>
          </div>

          {/* Chart Tabs Navigation */}
          <div className="flex items-center space-x-1.5 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('temperature')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'temperature'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature Trends</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rainfall')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'rainfall'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Rainfall & Monsoon</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('extreme')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'extreme'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Extreme Anomalies</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('normals')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'normals'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>12-Month Climatology</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-purple-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Historical Ledger</span>
            </button>
          </div>

          {/* TAB 1: TEMPERATURE TRENDS CHART */}
          {activeTab === 'temperature' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Decadal Temperature Evolution (2016 – 2026)</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold border border-purple-200">
                      Mean: +{(records[records.length - 1].avgTemp - records[0].avgTemp).toFixed(1)}°C Net Change
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Hover over any year point to inspect exact Summer High, Mean Average, and Winter Low values.
                  </p>
                </div>
                {/* Series Legend */}
                <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-600">
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-0.5 bg-rose-500 rounded"></span>
                    <span>Summer Peak</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-1 bg-purple-600 rounded"></span>
                    <span>Annual Mean</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-0.5 bg-sky-500 rounded"></span>
                    <span>Winter Min</span>
                  </span>
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="relative bg-slate-900 rounded-2xl p-2 sm:p-4 shadow-md border border-slate-800 overflow-hidden">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 sm:h-64 overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9333ea" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#9333ea" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[minTemp, (minTemp + maxTemp) / 2, maxTemp].map((t, idx) => {
                    const y = getYTemp(t);
                    return (
                      <g key={idx}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 3}
                          fill="#94a3b8"
                          fontSize="9"
                          textAnchor="end"
                          fontWeight="bold"
                        >
                          {Math.round(t)}°C
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill under Mean Temp */}
                  <polygon points={avgTempArea} fill="url(#tempAreaGrad)" />

                  {/* Summer Max Line */}
                  <polyline
                    points={maxTempPoints}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />

                  {/* Winter Min Line */}
                  <polyline
                    points={minTempPoints}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />

                  {/* Mean Temp Line */}
                  <polyline
                    points={avgTempPoints}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                  />

                  {/* Data Points and X-Axis Year Labels */}
                  {records.map((rec, i) => {
                    const x = getX(i);
                    const yMean = getYTemp(rec.avgTemp);
                    const yMax = getYTemp(rec.maxSummerTemp);
                    const yMin = getYTemp(rec.minWinterTemp);
                    const isSelected = hoveredYear === rec.year;

                    return (
                      <g
                        key={rec.year}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredYear(rec.year)}
                        onClick={() => setHoveredYear(rec.year)}
                      >
                        {/* Hover vertical highlight bar */}
                        {isSelected && (
                          <line
                            x1={x}
                            y1={padding.top}
                            x2={x}
                            y2={padding.top + innerHeight}
                            stroke="#c084fc"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Max point */}
                        <circle cx={x} cy={yMax} r={isSelected ? 4 : 2.5} fill="#f43f5e" stroke="#fff" strokeWidth="1" />
                        {/* Min point */}
                        <circle cx={x} cy={yMin} r={isSelected ? 4 : 2.5} fill="#0284c7" stroke="#fff" strokeWidth="1" />
                        {/* Mean point */}
                        <circle
                          cx={x}
                          cy={yMean}
                          r={isSelected ? 6 : 3.5}
                          fill={isSelected ? '#f3e8ff' : '#a855f7'}
                          stroke="#7e22ce"
                          strokeWidth="2"
                        />

                        {/* Year text on X-axis */}
                        <text
                          x={x}
                          y={chartHeight - 10}
                          fill={isSelected ? '#f3e8ff' : '#94a3b8'}
                          fontSize={isSelected ? '10' : '9'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          {rec.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Interactive Year Inspector Card */}
                {currentHoveredRecord && (
                  <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500 text-white font-black text-xs">
                        {currentHoveredRecord.year}
                      </span>
                      <span className="text-slate-300 font-bold">
                        Historical Meteorological Reading:
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-bold">
                      <span className="text-rose-400">
                        Max Peak: <span className="text-white">{currentHoveredRecord.maxSummerTemp}°C</span>
                      </span>
                      <span className="text-purple-300">
                        Annual Mean: <span className="text-white">{currentHoveredRecord.avgTemp}°C</span>
                      </span>
                      <span className="text-sky-400">
                        Winter Low: <span className="text-white">{currentHoveredRecord.minWinterTemp}°C</span>
                      </span>
                      <span className="text-amber-400">
                        Anomaly: <span className="text-white">+{currentHoveredRecord.anomalyVsBaseline}°C</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RAINFALL & MONSOON VARIANCE CHART */}
          {activeTab === 'rainfall' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Annual Precipitation & Monsoon Volume (2016 – 2026)</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-semibold border border-blue-200">
                      Normal: {climateProfile.baselineNormalRainfall} mm
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dual visualizer comparing Total Annual Rain against Long-Term Baseline Normal.
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-600">
                  <span className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span>
                    <span>Annual Rainfall (mm)</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-4 h-0.5 bg-amber-400 rounded"></span>
                    <span>Baseline Normal</span>
                  </span>
                </div>
              </div>

              {/* Rainfall Bar Chart */}
              <div className="bg-slate-900 rounded-2xl p-2 sm:p-4 shadow-md border border-slate-800">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 sm:h-64 overflow-visible select-none"
                >
                  {/* Baseline reference line */}
                  <line
                    x1={padding.left}
                    y1={getYRain(climateProfile.baselineNormalRainfall)}
                    x2={chartWidth - padding.right}
                    y2={getYRain(climateProfile.baselineNormalRainfall)}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                  />
                  <text
                    x={chartWidth - padding.right}
                    y={getYRain(climateProfile.baselineNormalRainfall) - 6}
                    fill="#fbbf24"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    Baseline: {climateProfile.baselineNormalRainfall}mm
                  </text>

                  {/* Bars for each year */}
                  {records.map((rec, i) => {
                    const barWidth = 24;
                    const x = getX(i) - barWidth / 2;
                    const y = getYRain(rec.annualRainfallMm);
                    const height = Math.max(4, padding.top + innerHeight - y);
                    const isSelected = hoveredYear === rec.year;
                    const isSurplus = rec.monsoonAnomalyPct >= 0;

                    return (
                      <g
                        key={rec.year}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredYear(rec.year)}
                        onClick={() => setHoveredYear(rec.year)}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx={5}
                          fill={
                            isSelected
                              ? '#38bdf8'
                              : isSurplus
                              ? '#2563eb'
                              : '#f59e0b'
                          }
                          className="transition-colors duration-200"
                        />
                        <text
                          x={getX(i)}
                          y={y - 5}
                          fill={isSelected ? '#ffffff' : '#94a3b8'}
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {rec.annualRainfallMm}
                        </text>
                        <text
                          x={getX(i)}
                          y={chartHeight - 10}
                          fill={isSelected ? '#ffffff' : '#94a3b8'}
                          fontSize={isSelected ? '10' : '9'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          {rec.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Rainfall Info Card */}
                {currentHoveredRecord && (
                  <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-xs">
                        {currentHoveredRecord.year} Precipitation
                      </span>
                      <span className="text-slate-300 font-bold">
                        Annual Total: <span className="text-white">{currentHoveredRecord.annualRainfallMm} mm</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs font-bold">
                      <span className="text-sky-300">
                        Monsoon Season Share: <span className="text-white">{currentHoveredRecord.monsoonRainfallMm} mm</span>
                      </span>
                      <span className={currentHoveredRecord.monsoonAnomalyPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        Departure: {currentHoveredRecord.monsoonAnomalyPct >= 0 ? '+' : ''}{currentHoveredRecord.monsoonAnomalyPct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EXTREME WEATHER ANOMALIES CHART */}
          {activeTab === 'extreme' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Extreme Weather Anomaly Frequency (2016 – 2026)</span>
                    <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-semibold border border-rose-200">
                      +{climateProfile.extremeEventTrendPct}% Increase
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Annual tally of days with acute heatwave threshold (&gt;40°C) or torrential rain downbursts (&gt;65mm/day).
                  </p>
                </div>
              </div>

              {/* Extreme Events Bar Visualizer */}
              <div className="bg-slate-900 rounded-2xl p-2 sm:p-4 shadow-md border border-slate-800">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-48 sm:h-64 overflow-visible select-none"
                >
                  {records.map((rec, i) => {
                    const barWidth = 22;
                    const x = getX(i) - barWidth / 2;
                    const y = getYExtreme(rec.extremeEventDays);
                    const height = Math.max(4, padding.top + innerHeight - y);
                    const isSelected = hoveredYear === rec.year;

                    return (
                      <g
                        key={rec.year}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredYear(rec.year)}
                        onClick={() => setHoveredYear(rec.year)}
                      >
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx={5}
                          fill={isSelected ? '#f43f5e' : '#e11d48'}
                          opacity={isSelected ? 1 : 0.85}
                          className="transition-all duration-200"
                        />
                        <text
                          x={getX(i)}
                          y={y - 5}
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {rec.extremeEventDays}
                        </text>
                        <text
                          x={getX(i)}
                          y={chartHeight - 10}
                          fill={isSelected ? '#ffffff' : '#94a3b8'}
                          fontSize={isSelected ? '10' : '9'}
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          {rec.year}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {currentHoveredRecord && (
                  <div className="mt-3 p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs">
                        {currentHoveredRecord.year} Impact
                      </span>
                      <span className="text-slate-300 font-bold">
                        Total Severe Anomaly Days: <span className="text-rose-400">{currentHoveredRecord.extremeEventDays} days</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Baseline frequency was ~{records[0].extremeEventDays} days/year in 2016.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: 12-MONTH CLIMATOLOGY NORMALS */}
          {activeTab === 'normals' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">
                    Monthly Climatological Normals (Jan – Dec Cycle)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Long-term typical distribution of temperature highs, lows, and monthly precipitation volumes.
                  </p>
                </div>
              </div>

              {/* Monthly Normals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {climateProfile.monthlyNormals.map((m, idx) => {
                  const isHovered = hoveredMonthIndex === idx;
                  const isMonsoonPeak = m.rainfallMm > 200;
                  const isHeatPeak = m.avgHigh > 38;

                  return (
                    <div
                      key={m.month}
                      onMouseEnter={() => setHoveredMonthIndex(idx)}
                      className={`p-2.5 rounded-2xl border transition cursor-pointer ${
                        isHovered
                          ? 'bg-purple-50 border-purple-400 shadow-sm'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-black mb-1">
                        <span className="text-slate-800">{m.monthShort}</span>
                        {isMonsoonPeak && <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-bold">RAIN</span>}
                        {isHeatPeak && <span className="text-[9px] bg-rose-100 text-rose-800 px-1 rounded font-bold">HEAT</span>}
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">High / Low:</span>
                          <span className="font-bold text-slate-900">{m.avgHigh}° / {m.avgLow}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rainfall:</span>
                          <span className="font-bold text-blue-700">{m.rainfallMm} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Rainy Days:</span>
                          <span className="font-medium text-slate-700">{m.rainyDays} d</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: HISTORICAL DATA TABLE */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-slate-900">
                  Complete Meteorological Archive (2016 – 2026)
                </h4>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Source: WeatherGPT Ground Stations & Meteorological Reanalysis
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3">Annual Mean</th>
                      <th className="py-2.5 px-3">Summer Peak</th>
                      <th className="py-2.5 px-3">Winter Low</th>
                      <th className="py-2.5 px-3">Annual Rain</th>
                      <th className="py-2.5 px-3">Monsoon Vol</th>
                      <th className="py-2.5 px-3">Departure</th>
                      <th className="py-2.5 px-3">Extreme Days</th>
                      <th className="py-2.5 px-3">Baseline Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {records.map((r) => (
                      <tr key={r.year} className="hover:bg-purple-50/50 transition">
                        <td className="py-2 px-3 font-bold text-slate-900">{r.year}</td>
                        <td className="py-2 px-3 font-bold text-purple-700">{r.avgTemp}°C</td>
                        <td className="py-2 px-3 text-rose-600">{r.maxSummerTemp}°C</td>
                        <td className="py-2 px-3 text-sky-600">{r.minWinterTemp}°C</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{r.annualRainfallMm} mm</td>
                        <td className="py-2 px-3 text-blue-700">{r.monsoonRainfallMm} mm</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.monsoonAnomalyPct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.monsoonAnomalyPct >= 0 ? '+' : ''}{r.monsoonAnomalyPct}%
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-rose-700">{r.extremeEventDays} d</td>
                        <td className="py-2 px-3 font-bold text-purple-800">+{r.anomalyVsBaseline}°C</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Regional Climate Vulnerability & AI Risk Assessment */}
          <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-amber-950 uppercase tracking-wider text-[10px] block">
                Regional Climate Anomaly & Risk Insight:
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {climateProfile.insight}
              </p>
              <p className="text-amber-900 text-[11px] font-semibold pt-1 border-t border-amber-200/60">
                💡 Outlook: {climateProfile.aiRiskSummary}
              </p>
            </div>
          </div>

          {/* Interactive AI Climate Assistant */}
          <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Ask AI Climate Assistant:</span>
              </label>
              <span className="text-[10px] font-semibold text-purple-700">Empirical Historical Synthesis</span>
            </div>

            {/* Prompt presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                `How has summer temperature changed in ${climateProfile.cityName}?`,
                `Are extreme rainfall cloudburst events increasing?`,
                `What is the 10-year monsoon variance pattern?`
              ].map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAskClimate(q)}
                  className="text-[11px] font-medium text-left px-2.5 py-1.5 bg-white hover:bg-purple-100 text-purple-900 rounded-xl border border-purple-200 transition cursor-pointer active:scale-95"
                >
                  {q}
                </button>
              ))}
            </div>

            {nlAnswer && (
              <div className="p-3 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 leading-relaxed space-y-1 shadow-xs animate-in fade-in">
                <span className="font-black text-purple-900 text-[10px] uppercase tracking-wider block">
                  AI Empirical Trend Analysis:
                </span>
                <p>{nlAnswer}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:px-5 bg-slate-50 border-t border-slate-200 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            Observational Archive: <span className="font-bold text-slate-700">2016 – 2026 Historical Baselines</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
