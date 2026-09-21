import React from 'react';
import { Volume2, Sparkles } from './Icons';
import { Language } from '../types';
import { getTranslation } from '../data/translations';

interface GreetingSectionProps {
  name?: string;
  userName?: string;
  greetingText?: string;
  subtitleText?: string;
  onOpenBriefing: () => void;
  language?: Language;
}

export const GreetingSection: React.FC<GreetingSectionProps> = ({
  name,
  userName = 'Anmol',
  greetingText,
  subtitleText,
  onOpenBriefing,
  language = 'en'
}) => {
  const displayName = name || userName;
  const t = getTranslation(language);

  // Determine appropriate time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? t.greetingMorning : hour < 17 ? t.greetingAfternoon : t.greetingEvening;

  return (
    <div className="px-5 pt-1 pb-3 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 font-heading">
          {greetingText || `${timeGreeting}, ${displayName}!`} <span>👋</span>
        </h2>
        <p className="text-xs font-medium text-slate-500 mt-0.5">
          {subtitleText || t.weatherOverview}
        </p>
      </div>

      <button
        id="btn-daily-briefing-pill"
        onClick={onOpenBriefing}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200/60 shadow-xs transition active:scale-95 cursor-pointer"
        title="Listen to Morning AI Briefing"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        <span>{t.aiBriefingBtn}</span>
        <Volume2 className="w-3.5 h-3.5 ml-0.5 text-blue-500" />
      </button>
    </div>
  );
};
