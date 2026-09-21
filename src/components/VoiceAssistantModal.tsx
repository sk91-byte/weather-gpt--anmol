import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2, VolumeX, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, Loader2, ChevronLeft } from './Icons';
import { Language, WeatherData } from '../types';
import { INDIAN_LANGUAGES, getLanguageInfo, getSpeechRecognitionLang } from '../data/languages';
import { speakWithIndianVoice, stopIndianVoice } from '../utils/indianVoiceService';

interface VoiceAssistantModalProps {
  weather: WeatherData;
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  weather,
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange
}) => {
  if (!isOpen) return null;

  const currentLangConfig = getLanguageInfo(currentLanguage);

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<'female' | 'male'>('female');
  const [transcript, setTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [response, setResponse] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 18, 24, 16, 28, 20, 14, 22, 10]);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const waveIntervalRef = useRef<any>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopListening();
      handleStopSpeaking();
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, []);

  // Smooth dynamic wave animation when speaking or listening
  useEffect(() => {
    if (isListening || isSpeaking) {
      waveIntervalRef.current = setInterval(() => {
        setWaveHeights([
          12 + Math.floor(Math.random() * 32),
          16 + Math.floor(Math.random() * 38),
          20 + Math.floor(Math.random() * 36),
          18 + Math.floor(Math.random() * 42),
          24 + Math.floor(Math.random() * 36),
          16 + Math.floor(Math.random() * 34),
          22 + Math.floor(Math.random() * 32),
          14 + Math.floor(Math.random() * 28),
          10 + Math.floor(Math.random() * 24)
        ]);
      }, 120);
    } else {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
      setWaveHeights([12, 18, 24, 16, 28, 20, 14, 22, 10]);
    }

    return () => {
      if (waveIntervalRef.current) clearInterval(waveIntervalRef.current);
    };
  }, [isListening, isSpeaking]);

  const startListening = () => {
    handleStopSpeaking();
    setMicPermissionError(null);
    transcriptRef.current = '';
    setTranscript('');

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermissionError('Speech Recognition is not supported by this browser. You can type your query below or tap any sample question!');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getSpeechRecognitionLang(currentLanguage);
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentString = '';
        for (let i = 0; i < event.results.length; i++) {
          currentString += event.results[i][0].transcript;
        }
        transcriptRef.current = currentString;
        setTranscript(currentString);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermissionError('Microphone permission was blocked. Please allow microphone access in your browser address bar or use the text box below.');
        } else if (event.error === 'no-speech') {
          // Silent timeout
          if (!transcriptRef.current.trim()) {
            setTranscript('');
          }
        } else if (event.error === 'network') {
          setMicPermissionError('Network issue connecting to voice service. Please retry or type your query below.');
        } else {
          setMicPermissionError(`Microphone issue (${event.error}). Please type below or tap a sample question.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);

        const finalText = transcriptRef.current.trim();
        if (finalText) {
          processVoiceQuery(finalText);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setMicPermissionError('Could not start microphone. Please check permissions or select a sample query.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);

    const finalText = transcriptRef.current.trim();
    if (finalText) {
      processVoiceQuery(finalText);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const processVoiceQuery = async (queryText: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          language: currentLanguage,
          city: weather.city,
          role: 'citizen'
        })
      });

      if (!res.ok) throw new Error('Failed to fetch AI voice response');

      const data = await res.json();
      const reply = data.response;
      setResponse(reply);
      speakText(reply);
    } catch (e) {
      const fallbackReply =
        currentLanguage === 'hi'
          ? `मौसम अवलोकन के अनुसार, ${weather.city} में वर्तमान तापमान ${weather.temperature}°C (${weather.condition}) है। शाम को भारी बारिश की संभावना है। कृपया छाता साथ रखें और सुरक्षित यात्रा करें।`
          : `Based on verified weather data for ${weather.city}, temperature is ${weather.temperature}°C (${weather.condition}) with a rain probability of ${weather.rainChance}%. Please carry rain gear and plan travel accordingly.`;
      setResponse(fallbackReply);
      speakText(fallbackReply);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    speakWithIndianVoice({
      text,
      gender: selectedVoiceGender,
      langCode: getSpeechRecognitionLang(currentLanguage),
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleStopSpeaking = () => {
    stopIndianVoice();
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        id="modal-voice-assistant"
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 text-white border border-blue-500/30 shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
      >
        {/* Glow orb */}
        <div className="absolute top-1/3 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Top-left Back button */}
        <button
          id="btn-voice-assistant-back-top"
          onClick={() => {
            stopListening();
            handleStopSpeaking();
            onClose();
          }}
          className="absolute top-3.5 left-4 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 flex items-center space-x-1 text-xs font-bold text-white transition cursor-pointer border border-white/10"
          aria-label="Back to previous screen"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
          <span>Back</span>
        </button>

        {/* Close button (Top-right) */}
        <button
          id="btn-voice-assistant-close-top"
          onClick={() => {
            stopListening();
            handleStopSpeaking();
            onClose();
          }}
          className="absolute top-3.5 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
          aria-label="Close voice assistant"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Header language pills - scrollable for all 23 Indian languages + Hinglish */}
        <div className="w-full mt-7 mb-2 px-1">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none no-scrollbar">
            {INDIAN_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                id={`btn-voice-lang-${lang.id}`}
                onClick={() => onLanguageChange(lang.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  currentLanguage === lang.id
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-white/10 border-white/10 text-slate-300 hover:text-white hover:bg-white/15'
                }`}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* Indian Voice Persona Switcher */}
        <div className="flex items-center justify-center space-x-2 my-1 bg-white/10 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setSelectedVoiceGender('female')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedVoiceGender === 'female'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>👩 Aanya</span>
            <span className="text-[10px] font-normal opacity-80">(Warm)</span>
          </button>
          <button
            onClick={() => setSelectedVoiceGender('male')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedVoiceGender === 'male'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>👨 Kabir</span>
            <span className="text-[10px] font-normal opacity-80">(Deep)</span>
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-white font-heading mt-1">
          Talk to WeatherGPT
        </h3>
        <p className="text-xs text-blue-200 mt-0.5 font-medium">
          Indian Human Voice • {weather.city}
        </p>

        {/* Permission warning banner if microphone blocked */}
        {micPermissionError && (
          <div className="w-full mt-3 p-2.5 bg-red-950/70 border border-red-500/40 rounded-xl text-left text-xs text-red-200 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{micPermissionError}</p>
              <button
                onClick={startListening}
                className="mt-1.5 text-[11px] font-bold text-red-300 underline hover:text-white cursor-pointer"
              >
                Retry microphone access
              </button>
            </div>
          </div>
        )}

        {/* Animated Waveform Visualizer */}
        <div className="h-14 flex items-center justify-center space-x-1.5 my-4">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isListening
                  ? 'bg-gradient-to-t from-red-500 to-pink-300'
                  : isSpeaking
                  ? 'bg-gradient-to-t from-blue-400 to-emerald-300 animate-pulse'
                  : 'bg-white/20'
              }`}
              style={{
                height: `${isListening || isSpeaking ? h : 8}px`
              }}
            />
          ))}
        </div>

        {/* Giant Pulsing Microphone Button */}
        <button
          id="btn-voice-record-main"
          onClick={toggleListening}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 shadow-[0_0_35px_rgba(56,189,248,0.4)] cursor-pointer ring-8 ${
            isListening
              ? 'bg-red-500 ring-red-400/50 scale-105 animate-pulse'
              : isProcessing
              ? 'bg-amber-600 ring-amber-400/40'
              : 'bg-gradient-to-tr from-blue-600 to-sky-400 ring-blue-400/20 hover:scale-105'
          }`}
          title={isListening ? 'Tap to finish speaking' : 'Tap to start speaking'}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : (
            <Mic className="w-10 h-10 text-white stroke-[2.5]" />
          )}
        </button>

        {/* Status text */}
        <p className="text-xs font-bold mt-4">
          {isListening ? (
            <span className="text-red-400 animate-pulse flex items-center gap-1.5 justify-center">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
              Listening... Tap to send
            </span>
          ) : isProcessing ? (
            <span className="text-amber-400">Analyzing weather decision...</span>
          ) : isSpeaking ? (
            <span className="text-emerald-400 flex items-center gap-1 justify-center">
              <Volume2 className="w-3.5 h-3.5" /> Speaking response...
            </span>
          ) : (
            <span className="text-slate-300">Tap microphone to speak</span>
          )}
        </p>

        {/* Live Transcription Box */}
        {transcript && (
          <div className="w-full mt-3 p-3 bg-white/10 rounded-2xl border border-white/15 text-left text-xs">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
              You Asked:
            </span>
            <p className="text-slate-100 font-medium mt-0.5 italic">"{transcript}"</p>
          </div>
        )}

        {/* Response Box */}
        {response && (
          <div className="w-full mt-3 p-3.5 bg-blue-900/50 border border-blue-400/30 rounded-2xl text-left text-xs max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> WeatherGPT Intelligence
              </span>
              <div className="flex items-center space-x-2">
                {isSpeaking ? (
                  <button
                    onClick={handleStopSpeaking}
                    className="text-[10px] text-red-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <VolumeX className="w-3 h-3" /> Stop
                  </button>
                ) : (
                  <button
                    onClick={() => speakText(response)}
                    className="text-[10px] text-blue-300 hover:text-white underline cursor-pointer flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" /> Replay
                  </button>
                )}
              </div>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{response}</p>
          </div>
        )}

        {/* Post-Query Action Bar: Dedicated Back & Ask Another Button */}
        {response && (
          <div className="w-full grid grid-cols-2 gap-2 mt-3 animate-in fade-in duration-200">
            <button
              id="btn-voice-assistant-back-bottom"
              onClick={() => {
                stopListening();
                handleStopSpeaking();
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              <span>Back to Weather</span>
            </button>
            <button
              id="btn-voice-assistant-ask-another"
              onClick={() => {
                handleStopSpeaking();
                setTranscript('');
                setResponse('');
                startListening();
              }}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-lg shadow-blue-500/30"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Ask Another</span>
            </button>
          </div>
        )}

        {/* Quick Type fallback box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typedInput.trim()) {
              setTranscript(typedInput.trim());
              transcriptRef.current = typedInput.trim();
              processVoiceQuery(typedInput.trim());
              setTypedInput('');
            }
          }}
          className="w-full mt-3 flex items-center space-x-1.5"
        >
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder={
              currentLanguage === 'hi'
                ? 'या यहाँ प्रश्न लिखकर पूछें...'
                : 'Or type your question here...'
            }
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-400 font-medium"
          />
          <button
            type="submit"
            disabled={!typedInput.trim() || isProcessing}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Ask
          </button>
        </form>

        {/* Preset Sample Prompts for Instant Testing */}
        <div className="w-full mt-4 pt-3 border-t border-white/10 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Or tap to ask instant question:
          </span>
          <div className="space-y-1.5">
            {currentLangConfig.sampleQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTranscript(q);
                  transcriptRef.current = q;
                  processVoiceQuery(q);
                }}
                className="w-full text-left p-2.5 bg-white/5 hover:bg-white/15 rounded-xl text-[11px] font-medium text-slate-200 transition flex items-center justify-between cursor-pointer border border-white/5"
              >
                <span className="truncate">{q}</span>
                <span className="text-sky-400 font-bold ml-1">▶</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
