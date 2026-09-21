import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Globe,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Layers,
  Sparkles,
  Info,
  GitCompare,
  ArrowRight
} from './Icons';
import { NWPComparisonData, NWPModelId, NWPModelPrediction } from '../types';
import { fetchNWPModelComparison, getModelColor } from '../services/nwpService';

interface NWPModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  lat?: number;
  lon?: number;
}

type MetricType = 'temperature' | 'precipitation' | 'wind' | 'pressure';
type ViewMode = 'comparison' | 'model-detail' | 'synoptic';

export const NWPModelsModal: React.FC<NWPModelsModalProps> = ({
  isOpen,
  onClose,
  city,
  lat,
  lon
}) => {
  if (!isOpen) return null;

  const [data, setData] = useState<NWPComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('temperature');
  const [activeModelId, setActiveModelId] = useState<NWPModelId>('wrf');
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchNWPModelComparison(city, lat, lon);
      setData(res);
      // Default selected hour to first entry
      setSelectedHourIndex(0);
    } catch (err: any) {
      console.error('Failed to load NWP data:', err);
      setError(err?.message || 'Failed to connect to NWP model simulation engines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [city, lat, lon]);

  // Models list for comparison
  const modelKeys: NWPModelId[] = ['consensus', 'wrf', 'gfs', 'ecmwf', 'icon'];

  const getMetricLabel = (m: MetricType) => {
    switch (m) {
      case 'temperature':
        return 'Temperature (°C)';
      case 'precipitation':
        return 'Rain Accumulation (mm)';
      case 'wind':
        return 'Wind Velocity (km/h)';
      case 'pressure':
        return 'Surface Pressure (hPa)';
    }
  };

  const getMetricValue = (pred: NWPModelPrediction, idx: number, m: MetricType) => {
    const pt = pred.hourly[idx];
    if (!pt) return 0;
    switch (m) {
      case 'temperature':
        return pt.temp;
      case 'precipitation':
        return pt.precipitationMm;
      case 'wind':
        return pt.windSpeed;
      case 'pressure':
        return pt.pressure;
    }
  };

  const getMetricUnit = (m: MetricType) => {
    switch (m) {
      case 'temperature':
        return '°C';
      case 'precipitation':
        return 'mm';
      case 'wind':
        return 'km/h';
      case 'pressure':
        return 'hPa';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        id="modal-nwp-models"
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center space-x-2.5 z-10">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight">NWP Models Intelligence</h3>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  GFS • WRF • ECMWF
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {city} • High-Resolution Dynamical Atmospheric Simulation
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 z-10">
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              title="Refresh NWP Model Runs"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="px-4 pt-3 pb-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex space-x-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'comparison'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Multi-Model Compare</span>
            </button>
            <button
              onClick={() => setViewMode('model-detail')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'model-detail'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Model Specs</span>
            </button>
            <button
              onClick={() => setViewMode('synoptic')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                viewMode === 'synoptic'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Synoptic Briefing</span>
            </button>
          </div>

          {data && (
            <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">
              Run: {data.lastUpdated}
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                <Cpu className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-700">Ingesting NOAA GFS & NCMRWF WRF-ARW Grids...</p>
              <p className="text-[11px] text-slate-400">Computing non-hydrostatic mesoscale thermodynamics for {city}</p>
            </div>
          ) : error || !data ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-red-600 mx-auto" />
              <p className="text-xs font-bold text-red-800">Unable to retrieve NWP model telemetry</p>
              <p className="text-[11px] text-red-600">{error}</p>
              <button
                onClick={() => loadData(true)}
                className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition cursor-pointer"
              >
                Retry Fetch
              </button>
            </div>
          ) : (
            <>
              {/* Top Executive Consensus Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 rounded-2xl border border-blue-200/70 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {data.consensusScore}%
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          NWP Multi-Model Consensus
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            data.divergenceLevel === 'Low'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : data.divergenceLevel === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {data.divergenceLevel} Divergence
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        GFS (25km) • WRF-ARW (3km) • ECMWF (9km) • ICON (13km)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Elevation
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {data.elevationMeters}m MSL
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-blue-100 text-[11px] text-slate-600 leading-relaxed flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{data.divergenceReason}</span>
                </div>
              </div>

              {/* VIEW 1: Multi-Model Comparison View */}
              {viewMode === 'comparison' && (
                <div className="space-y-3.5">
                  {/* Metric Switcher */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Select Weather Metric:</span>
                    </span>
                    <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                      {[
                        { id: 'temperature', label: 'Temp', icon: Thermometer },
                        { id: 'precipitation', label: 'Rain', icon: Droplets },
                        { id: 'wind', label: 'Wind', icon: Wind },
                        { id: 'pressure', label: 'Pressure', icon: Compass }
                      ].map((btn) => {
                        const IconComponent = btn.icon;
                        const isSelected = selectedMetric === btn.id;
                        return (
                          <button
                            key={btn.id}
                            onClick={() => setSelectedMetric(btn.id as MetricType)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <IconComponent className="w-3 h-3" />
                            <span>{btn.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Comparison Grid Across Models */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {modelKeys.map((mKey) => {
                      const pred = data.models[mKey];
                      const spec = data.modelSpecs[mKey];
                      if (!pred || !spec) return null;
                      const isWRF = mKey === 'wrf';
                      const isGFS = mKey === 'gfs';

                      return (
                        <div
                          key={mKey}
                          className={`p-2.5 rounded-xl border transition ${
                            isWRF
                              ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/30'
                              : isGFS
                              ? 'bg-indigo-50/60 border-indigo-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getModelColor(mKey) }}
                            />
                            <span className="text-[9px] font-bold text-slate-400">
                              {spec.resolution.split(' ')[0]}
                            </span>
                          </div>
                          <div className="font-extrabold text-xs text-slate-800 truncate">
                            {pred.name.split(' ')[0]}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mb-1">
                            {spec.agency.split('/')[0]}
                          </div>

                          <div className="mt-1 pt-1 border-t border-slate-200/60">
                            {selectedMetric === 'temperature' && (
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-slate-400">Max/Min:</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {pred.maxTemp}° / {pred.minTemp}°
                                </span>
                              </div>
                            )}
                            {selectedMetric === 'precipitation' && (
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-slate-400">24h Rain:</span>
                                <span className="text-xs font-bold text-blue-700">
                                  {pred.next24hRainTotal}mm
                                </span>
                              </div>
                            )}
                            {selectedMetric === 'wind' && (
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-slate-400">Peak Gust:</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {pred.peakWindSpeed} km/h
                                </span>
                              </div>
                            )}
                            {selectedMetric === 'pressure' && (
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] text-slate-400">Mean:</span>
                                <span className="text-xs font-bold text-slate-800">
                                  {pred.hourly[0]?.pressure || 1012} hPa
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hourly Side-by-Side Model Comparison Visualizer */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-800">
                          Synchronized Model Timeline ({getMetricLabel(selectedMetric)})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Tap any hour to inspect
                      </span>
                    </div>

                    {/* Scrollable Hourly Row */}
                    <div className="overflow-x-auto pb-2 pt-1 flex space-x-2">
                      {data.models.consensus.hourly.slice(0, 16).map((pt, idx) => {
                        const isSelected = selectedHourIndex === idx;
                        const wrfVal = getMetricValue(data.models.wrf, idx, selectedMetric);
                        const gfsVal = getMetricValue(data.models.gfs, idx, selectedMetric);
                        const ecmwfVal = getMetricValue(data.models.ecmwf, idx, selectedMetric);
                        const consVal = getMetricValue(data.models.consensus, idx, selectedMetric);

                        // Highlight if WRF and GFS diverge significantly at this hour
                        const isDivergentHour =
                          selectedMetric === 'temperature'
                            ? Math.abs(wrfVal - gfsVal) >= 1.5
                            : selectedMetric === 'precipitation'
                            ? Math.abs(wrfVal - gfsVal) >= 1.0
                            : false;

                        return (
                          <button
                            key={pt.timestamp}
                            onClick={() => setSelectedHourIndex(idx)}
                            className={`px-2.5 py-2 rounded-xl text-center shrink-0 border transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                                : isDivergentHour
                                ? 'bg-amber-50 border-amber-300 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                            }`}
                          >
                            <div className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              {pt.time}
                            </div>
                            <div className="text-xs font-black my-0.5">
                              {consVal}
                              <span className="text-[9px] font-normal ml-0.5">
                                {getMetricUnit(selectedMetric)}
                              </span>
                            </div>
                            <div className="text-[9px] space-y-0.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className={isSelected ? 'text-blue-200' : 'text-slate-400'}>WRF:</span>
                                <span className="font-semibold">{wrfVal}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className={isSelected ? 'text-blue-200' : 'text-slate-400'}>GFS:</span>
                                <span className="font-semibold">{gfsVal}</span>
                              </div>
                            </div>
                            {isDivergentHour && !isSelected && (
                              <span className="mt-1 block text-[8px] font-bold px-1 rounded-sm bg-amber-200 text-amber-900">
                                SPREAD
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Hour Deep Breakdown */}
                    {data.models.consensus.hourly[selectedHourIndex] && (
                      <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">
                            Telemetry at {data.models.consensus.hourly[selectedHourIndex].time} (Today)
                          </span>
                          <span className="text-[10px] text-blue-600 font-bold">
                            Consensus: {getMetricValue(data.models.consensus, selectedHourIndex, selectedMetric)}{getMetricUnit(selectedMetric)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {modelKeys.filter(k => k !== 'consensus').map((mKey) => {
                            const val = getMetricValue(data.models[mKey], selectedHourIndex, selectedMetric);
                            const spec = data.modelSpecs[mKey];
                            return (
                              <div key={mKey} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] font-bold text-slate-500 block truncate">
                                    {spec.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400">
                                    {spec.resolution.split(' ')[0]}
                                  </span>
                                </div>
                                <div className="text-right font-black text-xs text-slate-800">
                                  {val}
                                  <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                                    {getMetricUnit(selectedMetric)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* GFS vs WRF Key Physical Difference Callout */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-indigo-900">
                      <Cpu className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-extrabold">
                        GFS (Global 25km) vs WRF-ARW (Regional 3km) Dynamics:
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-950/80 leading-relaxed">
                      {data.meteorologistNotes.gfsVsWrf}
                    </p>
                  </div>
                </div>
              )}

              {/* VIEW 2: Detailed Model Specifications & Scientific Architectures */}
              {viewMode === 'model-detail' && (
                <div className="space-y-3">
                  <div className="flex space-x-1 overflow-x-auto pb-1">
                    {modelKeys.map((mKey) => {
                      const spec = data.modelSpecs[mKey];
                      const isSelected = activeModelId === mKey;
                      return (
                        <button
                          key={mKey}
                          onClick={() => setActiveModelId(mKey)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: isSelected ? '#ffffff' : getModelColor(mKey) }}
                          />
                          <span>{spec.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Model Specification Card */}
                  {data.modelSpecs[activeModelId] && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-extrabold text-slate-900">
                              {data.modelSpecs[activeModelId].fullName}
                            </h4>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {data.modelSpecs[activeModelId].cycle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {data.modelSpecs[activeModelId].agency} ({data.modelSpecs[activeModelId].country})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Spatial Grid Resolution
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {data.modelSpecs[activeModelId].resolution}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Dynamical Core Type
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs truncate block">
                            {data.modelSpecs[activeModelId].coreType}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Operational Cycles
                          </span>
                          <span className="font-extrabold text-slate-800 text-xs">
                            {data.modelSpecs[activeModelId].updateFrequency}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">
                            Predicted 24h Rainfall
                          </span>
                          <span className="font-extrabold text-blue-600 text-xs">
                            {data.models[activeModelId]?.next24hRainTotal ?? 0} mm
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-bold text-slate-800 block">Physics Description:</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {data.modelSpecs[activeModelId].description}
                        </p>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-xs font-bold text-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Key Strengths & Ideal Use Cases:</span>
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                          {data.modelSpecs[activeModelId].strengths}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: Synoptic Meteorology Briefing */}
              {viewMode === 'synoptic' && (
                <div className="space-y-3">
                  <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl space-y-3 shadow-md">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold tracking-tight text-indigo-200 uppercase">
                        Synoptic Atmospheric Synthesis
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-indigo-50">
                      {data.synopticSummary}
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Meteorological Model Divergence Assessment</span>
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                          1. Convective Rain & Diurnal Heating Trigger
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {data.meteorologistNotes.convectiveRainTiming}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-800 block text-[11px] mb-0.5">
                          2. Tropical Depression & Cyclone Track Agreement
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {data.meteorologistNotes.cycloneTrackAgreement}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Card */}
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        Actionable Guidance:
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                        For immediate (0–12h) outdoor and commute decisions, trust the high-resolution{' '}
                        <strong>WRF-ARW 3km</strong> mesoscale model for local rainbursts. For 3–7 day travel planning and synoptic depressions, monitor the{' '}
                        <strong>NOAA GFS</strong> and <strong>ECMWF</strong> multi-model consensus.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Operational Ingest: NCMRWF • IMD • NOAA • ECMWF</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
