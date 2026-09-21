import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, X, Sparkles, Activity, ShieldCheck, AlertCircle, User, Check, Globe, ChevronDown } from 'lucide-react';
import { INDIAN_VOICE_PERSONAS, IndianVoicePersona } from '../../utils/indianVoiceService';
import { Language } from '../../types';
import { INDIAN_LANGUAGES, getLanguageInfo } from '../../data/languages';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCity?: string;
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export const LiveVoiceConversationModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  userCity = 'Delhi NCR',
  currentLanguage = 'en',
  onLanguageChange
}) => {
  const [selectedPersona, setSelectedPersona] = useState<IndianVoicePersona>(INDIAN_VOICE_PERSONAS[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState('Tap to Start Live Voice Conversation');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [showLangDropdown, setShowLangDropdown] = useState<boolean>(false);

  const activeLangInfo = getLanguageInfo(currentLanguage);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen) {
      stopVoiceSession();
    }
  }, [isOpen]);

  // Convert Float32Array PCM to 16-bit PCM Base64
  const pcmFloat32ToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    let binary = '';
    const bytes = new Uint8Array(int16Array.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play audio chunk at 24kHz with gapless scheduling
  const playAudioChunk = (audioCtx: AudioContext, base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.push(source);

      setIsSpeaking(true);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsSpeaking(false);
        }
      };
    } catch (err) {
      console.warn('Error playing live audio chunk:', err);
    }
  };

  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  };

  const startVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setLiveTranscript('');
      setStatusText(`Connecting to ${selectedPersona.name} (Indian Human Voice)...`);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      streamRef.current = stream;

      // Initialize AudioContexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      const outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputAudioCtx;
      outputAudioCtxRef.current = outputAudioCtx;

      // Connect WebSocket to /live passing selected persona, voice, current city, and selected language
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${selectedPersona.liveVoiceName}&persona=${encodeURIComponent(selectedPersona.name)}&city=${encodeURIComponent(userCity)}&lang=${encodeURIComponent(currentLanguage || 'en')}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText(`${selectedPersona.name} is listening in ${activeLangInfo.name} (${activeLangInfo.nativeName}). Ask anything in your language!`);

        // Start streaming mic audio
        const source = inputAudioCtx.createMediaStreamSource(stream);
        const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtx.destination);

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current) return;
          const channelData = e.inputBuffer.getChannelData(0);

          // Calculate visual RMS level
          let sum = 0;
          for (let i = 0; i < channelData.length; i++) {
            sum += channelData[i] * channelData[i];
          }
          const rms = Math.sqrt(sum / channelData.length);
          setAudioLevel(Math.min(100, Math.round(rms * 400)));

          if (ws.readyState === WebSocket.OPEN) {
            const base64Audio = pcmFloat32ToBase64(channelData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            setErrorMessage(data.error);
            setStatusText(`Error: ${data.error}`);
            return;
          }
          if (data.interrupted) {
            stopAllPlayback();
            setStatusText('Listening to you...');
            setLiveTranscript('');
          }
          if (data.text) {
            setLiveTranscript((prev) => (prev ? prev + ' ' + data.text : data.text));
          }
          if (data.audio && outputAudioCtxRef.current) {
            playAudioChunk(outputAudioCtxRef.current, data.audio);
            setStatusText(`${selectedPersona.name} is speaking...`);
          }
        } catch (err) {
          console.warn('Error parsing WS message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Live API error:', err);
        setErrorMessage('Connection error with Live Voice server.');
        setStatusText('Live Voice session disconnected.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText('Live session ended.');
      };
    } catch (err: any) {
      console.error('Failed to initiate live voice session:', err);
      setIsConnecting(false);
      setIsConnected(false);
      setErrorMessage(err?.message || 'Could not start live voice. Please check microphone permissions.');
      setStatusText('Microphone access denied or connection failed.');
    }
  };

  const stopVoiceSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    stopAllPlayback();
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setAudioLevel(0);
    setStatusText('Tap to Start Live Voice Conversation');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between relative z-10 mb-4 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">Live Voice Copilot</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-emerald-500/20 text-amber-300 border border-amber-400/30">
                  Indian Human Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">Natural accent & bilingual cadence • Gemini Live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Spoken Language Bar */}
        <div className="relative z-10 mb-3 px-3 py-2 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Spoken Voice Language</span>
              <span className="text-xs font-bold text-white">{activeLangInfo.nativeName} ({activeLangInfo.name})</span>
            </div>
          </div>
          {onLanguageChange && (
            <div className="relative">
              <button
                type="button"
                disabled={isConnected || isConnecting}
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-700/80 hover:bg-slate-600 text-slate-200 border border-slate-600 transition cursor-pointer ${
                  isConnected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>Change</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-56 max-h-48 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 z-30">
                  {INDIAN_LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        if (onLanguageChange) onLanguageChange(l.id);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition ${
                        currentLanguage === l.id ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{l.nativeName}</span>
                      <span className="text-[10px] text-slate-400">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Persona Selector (Aanya, Kabir, Aarav, Diya) */}
        <div className="relative z-10 mb-4 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Select Indian Voice Persona
            </span>
            <span className="text-[10px] text-amber-400 font-medium">Authentic Indian Accent</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INDIAN_VOICE_PERSONAS.map((persona) => {
              const isSelected = selectedPersona.id === persona.id;
              return (
                <button
                  key={persona.id}
                  disabled={isConnected || isConnecting}
                  onClick={() => setSelectedPersona(persona)}
                  className={`p-2 rounded-xl border text-left transition relative cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500/60 shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  } ${isConnected ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {persona.gender === 'female' ? '👩' : '👨'} {persona.name}
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight truncate">
                    {persona.gender === 'female' ? 'Warm Female' : 'Calm Male'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Status Orb & Audio Visualizer */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2 shrink-0">
          <div className="relative flex items-center justify-center">
            {/* Outer pulsating rings */}
            {isConnected && (
              <>
                <span
                  className={`absolute rounded-full transition-all duration-300 ${
                    isSpeaking
                      ? 'w-40 h-40 bg-emerald-500/25 animate-ping'
                      : 'w-36 h-36 bg-amber-500/20 animate-pulse'
                  }`}
                  style={{ transform: `scale(${1 + audioLevel / 120})` }}
                />
                <span
                  className={`absolute rounded-full transition-all duration-150 ${
                    isSpeaking ? 'w-32 h-32 bg-emerald-400/30' : 'w-28 h-28 bg-amber-400/25'
                  }`}
                  style={{ transform: `scale(${1 + audioLevel / 200})` }}
                />
              </>
            )}

            {/* Central Interactive Voice Button */}
            <button
              onClick={isConnected ? stopVoiceSession : startVoiceSession}
              disabled={isConnecting}
              className={`relative z-10 w-22 h-22 rounded-full flex flex-col items-center justify-center shadow-xl transition-all duration-300 active:scale-95 cursor-pointer ${
                isConnected
                  ? isSpeaking
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/50 ring-4 ring-emerald-400/40'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/50 ring-4 ring-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-slate-600 shadow-slate-900/60'
              }`}
            >
              {isConnecting ? (
                <Activity className="w-8 h-8 animate-spin text-amber-400" />
              ) : isConnected ? (
                isSpeaking ? (
                  <Volume2 className="w-8 h-8 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )
              ) : (
                <Mic className="w-8 h-8 text-slate-300" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="mt-3 text-center px-4">
            <div className="flex items-center justify-center space-x-2 text-xs font-semibold mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? isSpeaking
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-amber-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
              <span className={isConnected ? (isSpeaking ? 'text-emerald-400 font-bold' : 'text-amber-400') : 'text-slate-400'}>
                {isConnected ? (isSpeaking ? `${selectedPersona.name} Speaking...` : 'Listening in Real Time...') : 'Ready to Connect'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300 leading-snug">{statusText}</p>
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="mt-2 mx-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Real-time speech wave bars */}
          {isConnected && (
            <div className="flex items-center justify-center space-x-1.5 mt-3 h-7">
              {[35, 65, 95, 55, 85, 110, 75, 45, 90, 60, 40].map((height, i) => {
                const activeHeight = Math.max(6, Math.round((height * (audioLevel + 20)) / 120));
                return (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      isSpeaking ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ height: `${Math.min(26, activeHeight)}px` }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Live Subtitles / Spoken Transcript Display */}
        {liveTranscript && (
          <div className="relative z-10 mb-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 max-h-24 overflow-y-auto shrink-0">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span>{selectedPersona.name}'s Spoken Response:</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">"{liveTranscript}"</p>
          </div>
        )}

        {/* Action Controls */}
        <div className="relative z-10 pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {isConnected ? (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                  isMuted
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>
              <button
                onClick={stopVoiceSession}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center space-x-1.5 shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                <span>End Conversation</span>
              </button>
            </>
          ) : (
            <button
              onClick={startVoiceSession}
              disabled={isConnecting}
              className="w-full py-3 px-5 rounded-2xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-white shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Speaking with {selectedPersona.name}</span>
            </button>
          )}
        </div>

        {/* Feature info footer */}
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Persona: {selectedPersona.name} ({selectedPersona.badge})</span>
          </div>
          <span className="font-semibold text-slate-300">City: {userCity}</span>
        </div>
      </div>
    </div>
  );
};
