import React from 'react';
import { CheckCircle2, ShieldCheck, CloudRain, Clock, MapPin, Sparkles, Navigation, X } from '../Icons';
import { JourneySummaryData } from '../../types';

interface JourneySummaryModalProps {
  summary: JourneySummaryData;
  onClose: () => void;
  onNewTrip: () => void;
}

export const JourneySummaryModal: React.FC<JourneySummaryModalProps> = ({
  summary,
  onClose,
  onNewTrip
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Celebration Header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Journey Complete ✅
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">
            Safely Arrived!
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {summary.destinationName}
          </p>
        </div>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Distance
            </div>
            <div className="text-lg font-black text-slate-900">
              {summary.distanceKm} <span className="text-xs font-semibold text-slate-500">km</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              Travel Time
            </div>
            <div className="text-lg font-black text-slate-900">
              {summary.travelTimeMinutes} <span className="text-xs font-semibold text-slate-500">min</span>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center justify-center space-x-1">
              <CloudRain className="w-3 h-3" />
              <span>Rain Encountered</span>
            </div>
            <div className="text-lg font-black text-blue-900">
              {summary.rainMinutes} <span className="text-xs font-semibold text-blue-700">min</span>
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-center">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Hazards Avoided</span>
            </div>
            <div className="text-lg font-black text-emerald-900">
              {summary.highRiskZonesAvoided} <span className="text-xs font-semibold text-emerald-700">zones</span>
            </div>
          </div>
        </div>

        {/* WeatherGPT AI Debriefing Card */}
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 mb-5">
          <div className="flex items-center space-x-2 text-indigo-900 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-wider">
              WeatherGPT Travel Debriefing
            </span>
          </div>
          <p className="text-xs text-indigo-950 font-medium leading-relaxed">
            {summary.aiSummary}
          </p>
          <div className="mt-2 pt-2 border-t border-indigo-200/70 flex items-center justify-between text-[11px] text-indigo-800">
            <span className="font-semibold">Route Chosen:</span>
            <span className="font-black text-indigo-900">{summary.routeName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onNewTrip();
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
          >
            <Navigation className="w-4 h-4 fill-white stroke-none" />
            <span>Start Another Trip</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
