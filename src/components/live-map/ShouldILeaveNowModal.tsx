import React from 'react';
import { X, Clock, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, ArrowRight, Navigation, Timer } from '../Icons';
import { AIWeatherRouteAnalysis, LiveMapRoute } from '../../types';

interface ShouldILeaveNowModalProps {
  analysis: AIWeatherRouteAnalysis | null;
  activeRoute: LiveMapRoute;
  fastestRoute?: LiveMapRoute;
  originName: string;
  destinationName: string;
  onClose: () => void;
  onStartNavigation: () => void;
  onActivateSmartWait: (minutes: number) => void;
}

export const ShouldILeaveNowModal: React.FC<ShouldILeaveNowModalProps> = ({
  analysis,
  activeRoute,
  fastestRoute,
  originName,
  destinationName,
  onClose,
  onStartNavigation,
  onActivateSmartWait
}) => {
  const decision = analysis?.leaveNowDecision || 'GO_NOW';
  const advice = analysis?.leaveNowAdvice || 'Conditions are currently stable.';

  const isGoNow = decision === 'GO_NOW';
  const isWait = decision === 'WAIT';
  const isAvoid = decision === 'AVOID';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 relative">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                WeatherGPT Departure Advisor
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {originName} → {destinationName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Main Decision Verdict Banner */}
        <div
          className={`p-4 rounded-2xl border mb-4 ${
            isGoNow
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : isWait
              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
              : 'bg-rose-50/90 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center space-x-2.5 mb-1.5">
            {isGoNow && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
            {isWait && <Clock className="w-6 h-6 text-amber-600 shrink-0 animate-pulse" />}
            {isAvoid && <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />}

            <div>
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isGoNow
                    ? 'bg-emerald-200 text-emerald-900'
                    : isWait
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-rose-200 text-rose-900'
                }`}
              >
                {isGoNow ? '🟢 RECOMMENDED: GO NOW' : isWait ? '🟡 ADVISORY: WAIT 20 MIN' : '🔴 WARNING: AVOID DEPARTURE'}
              </span>
              <h2 className="text-base font-black text-slate-900 mt-1">
                {isGoNow
                  ? 'Weather conditions are optimal for departure.'
                  : isWait
                  ? 'Departing 20 minutes later is safer.'
                  : 'Severe monsoon downpour along this corridor.'}
              </h2>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-2 pt-2 border-t border-slate-200/60">
            {advice}
          </p>
        </div>

        {/* 2. Weather Timeline Ahead */}
        {analysis?.weatherTimeline && analysis.weatherTimeline.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                Predicted Weather Along Route
              </span>
              <span className="text-[10px] font-bold text-slate-400">Chronological</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {analysis.weatherTimeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl text-center border ${
                    item.risk === 'High'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : item.risk === 'Moderate'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span className="text-[10px] font-black block opacity-70 truncate">{item.time}</span>
                  <div className="text-lg my-0.5">{item.icon}</div>
                  <div className="text-[10px] font-extrabold truncate">{item.weatherCondition}</div>
                  <div className="text-[9px] font-bold opacity-80">{item.rainProb}% Rain</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Fastest vs Safest Route Comparison */}
        {fastestRoute && activeRoute && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
            <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-2">
              Route Comparison: Fastest vs Safest
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Fastest Route */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                  <span>Fastest</span>
                  <span className="text-amber-600 font-black">{fastestRoute.safetyScore}/100</span>
                </div>
                <div className="text-sm font-black text-slate-900">{fastestRoute.durationMinutes} min</div>
                <div className="text-[11px] text-slate-600">{fastestRoute.distanceKm} km</div>
                <div className="text-[10px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">Low underpass prone to flooding</span>
                </div>
              </div>

              {/* Safest Route (WeatherGPT Recommended) */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-300 ring-1 ring-emerald-400">
                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 mb-1">
                  <span>🛡️ Safest</span>
                  <span className="text-emerald-700 font-black">{activeRoute.safetyScore}/100</span>
                </div>
                <div className="text-sm font-black text-emerald-950">{activeRoute.durationMinutes} min</div>
                <div className="text-[11px] text-emerald-800">{activeRoute.distanceKm} km</div>
                <div className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">Elevated bypass corridor</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 mt-2 font-medium">
              💡 {analysis?.comparisonReasoning || 'Safest route is 4 minutes longer but avoids flood-prone low points.'}
            </p>
          </div>
        )}

        {/* 4. Action Buttons */}
        <div className="space-y-2 pt-1">
          {isWait && (
            <button
              onClick={() => {
                onActivateSmartWait(20);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
            >
              <Timer className="w-4 h-4" />
              <span>Wait 20 Minutes & Start Smart Countdown</span>
            </button>
          )}

          <button
            onClick={() => {
              onStartNavigation();
              onClose();
            }}
            className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98 ${
              isGoNow
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4 fill-current stroke-none" />
            <span>{isGoNow ? 'Start Navigation Now' : 'Depart Anyway (Proceed with Caution)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
