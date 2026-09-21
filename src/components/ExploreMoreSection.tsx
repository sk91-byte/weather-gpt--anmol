import React from 'react';
import { Calendar, Wind, CloudRain, RotateCcw, Wheat, TrendingUp, Layers, ChevronRight, AlertTriangle, Cpu } from './Icons';

interface ExploreMoreSectionProps {
  onOpenForecast: () => void;
  onOpenAQI: () => void;
  onOpenMap: (layer?: string) => void;
  onOpenFarmer: () => void;
  onOpenClimate: () => void;
  onOpenDisasterNews?: () => void;
  onOpenNWP?: () => void;
}

export const ExploreMoreSection: React.FC<ExploreMoreSectionProps> = ({
  onOpenForecast,
  onOpenAQI,
  onOpenMap,
  onOpenFarmer,
  onOpenClimate,
  onOpenDisasterNews,
  onOpenNWP
}) => {
  const items = [
    {
      id: 'nwp-models',
      title: 'NWP Models',
      subtitle: 'GFS • WRF',
      icon: <Cpu className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50',
      action: onOpenNWP || onOpenForecast
    },
    {
      id: 'disaster-news',
      title: 'Disaster News',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      bg: 'bg-red-50',
      action: onOpenDisasterNews || (() => onOpenMap('storm'))
    },
    {
      id: 'forecast',
      title: '7 Day Forecast',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50',
      action: onOpenForecast
    },
    {
      id: 'aqi',
      title: 'Air Quality Index',
      icon: <Wind className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50',
      action: onOpenAQI
    },
    {
      id: 'rain-map',
      title: 'Rain Map',
      icon: <CloudRain className="w-5 h-5 text-sky-600" />,
      bg: 'bg-sky-50',
      action: () => onOpenMap('rain')
    },
    {
      id: 'cyclone',
      title: 'Cyclone Tracker',
      icon: <RotateCcw className="w-5 h-5 text-indigo-600" />,
      bg: 'bg-indigo-50',
      action: () => onOpenMap('cyclone')
    },
    {
      id: 'farmer',
      title: 'Farmer Advisory',
      icon: <Wheat className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50',
      action: onOpenFarmer
    },
    {
      id: 'climate',
      title: 'Climate Trends',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50',
      action: onOpenClimate
    }
  ];

  return (
    <div className="px-5 mt-4 mb-24">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight font-heading">
          Explore More
        </h3>
        <span className="text-[10px] font-semibold text-slate-400">Intelligence Modules</span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            id={`btn-explore-${item.id}`}
            onClick={item.action}
            className="bg-white rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center shadow-xs border border-slate-100 hover:border-blue-200 transition cursor-pointer active:scale-95 group relative"
          >
            {item.id === 'nwp-models' && (
              <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[8px] font-extrabold shadow-xs">
                NWP
              </span>
            )}
            <div className={`w-10 h-10 rounded-2xl ${item.bg} flex items-center justify-center mb-1.5 transition group-hover:scale-110`}>
              {item.icon}
            </div>
            <span className="text-[11px] font-bold text-slate-700 leading-tight">
              {item.title}
            </span>
            {item.subtitle && (
              <span className="text-[9px] text-blue-600 font-semibold mt-0.5">
                {item.subtitle}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

