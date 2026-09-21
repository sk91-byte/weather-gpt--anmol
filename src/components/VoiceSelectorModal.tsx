import React, { useState } from 'react';
import { Volume2, VolumeX, X, Check, Play, Settings } from './Icons';
import { INDIAN_VOICE_PERSONAS, IndianVoicePersona, speakWithIndianVoice, stopIndianVoice } from '../utils/indianVoiceService';
import { Language } from '../types';
import { getSpeechRecognitionLang } from '../data/languages';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonaId: string;
  onSelectPersona: (persona: IndianVoicePersona) => void;
  currentLanguage: Language;
  speechSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedPersonaId,
  onSelectPersona,
  currentLanguage,
  speechSpeed,
  onSpeedChange
}) => {
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestVoice = (persona: IndianVoicePersona, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingId === persona.id) {
      stopIndianVoice();
      setPreviewingId(null);
      return;
    }

    setPreviewingId(persona.id);

    const samplePhrases: Record<string, string> = {
      aanya: 'Namaste! Main Aanya hoon. Aaj aapke shehar me 80 percent baarish ki sambhavna hai. Apni yatra safe rakhein.',
      kabir: 'Hello, this is Kabir. Radar shows heavy cloud build-up on highway NH-44. Please drive cautiously.',
      aarav: 'Hey there! Aarav here. Weather is super clear right now, perfect time for outdoor errands!',
      diya: 'Good day! Diya reporting. Gentle breeze and comfortable humidity expected throughout the afternoon.',
      rohan: 'Severe Weather Alert! Flash flood warning issued for coastal districts. Stay indoors and tune in for live updates.',
      priya: 'Good morning! Aaj dhoop rahegi aur hawa suhani hai. Have a wonderful day ahead!'
    };

    const sampleText = samplePhrases[persona.id] || `Hello! This is ${persona.name} from WeatherGPT.`;

    speakWithIndianVoice({
      text: sampleText,
      personaId: persona.id,
      langCode: getSpeechRecognitionLang(currentLanguage),
      rate: speechSpeed,
      onStart: () => setPreviewingId(persona.id),
      onEnd: () => setPreviewingId(null),
      onError: () => setPreviewingId(null)
    });
  };

  const handleSelect = (persona: IndianVoicePersona) => {
    onSelectPersona(persona);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Voice Personas</h3>
              <p className="text-[11px] text-blue-100">Choose preferred speech tone & pacing</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopIndianVoice();
              setPreviewingId(null);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Speed Adjustment Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Settings className="w-3.5 h-3.5 text-indigo-600" />
            <span>Speech Speed:</span>
            <span className="text-indigo-600 font-bold">{speechSpeed.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-[170px]">
            <span className="text-[10px] text-slate-400 font-medium">0.8x</span>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={speechSpeed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <span className="text-[10px] text-slate-400 font-medium">1.2x</span>
          </div>
        </div>

        {/* Voice Persona List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {INDIAN_VOICE_PERSONAS.map((persona) => {
            const isSelected = selectedPersonaId === persona.id;
            const isPlaying = previewingId === persona.id;

            return (
              <div
                key={persona.id}
                onClick={() => handleSelect(persona)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold shadow-xs shrink-0 ${
                      persona.gender === 'female'
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white'
                        : 'bg-gradient-to-tr from-sky-600 to-blue-500 text-white'
                    }`}
                  >
                    {persona.name[0]}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{persona.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {persona.gender === 'female' ? 'Female' : 'Male'}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5" /> Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{persona.description}</p>
                    <div className="pt-0.5">
                      <span className="text-[9px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs inline-block">
                        {persona.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview / Listen Sample Button */}
                <div className="shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={(e) => handleTestVoice(persona, e)}
                    className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
                      isPlaying
                        ? 'bg-indigo-600 text-white shadow-md animate-pulse'
                        : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700'
                    }`}
                    title={isPlaying ? 'Stop Voice Sample' : `Preview ${persona.name}'s voice`}
                  >
                    {isPlaying ? <VolumeX className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>Synced with Gemini Live Voice API</span>
          <button
            onClick={() => {
              stopIndianVoice();
              setPreviewingId(null);
              onClose();
            }}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Apply Voice
          </button>
        </div>
      </div>
    </div>
  );
};
