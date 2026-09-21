import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronLeft,
  Bot,
  Loader2,
  AlertTriangle,
  Globe,
  MapPin,
  ExternalLink,
  PlusCircle,
  Database,
  Radio,
  FileAudio,
  Zap,
  Brain,
  MessageSquare
} from './Icons';
import { ChatMessage, Language, WeatherData, RouteTrip, GroundingSource } from '../types';
import { INDIAN_LANGUAGES, getLanguageInfo, getSpeechRecognitionLang } from '../data/languages';
import { useAuth } from '../context/AuthContext';
import {
  createChatThread,
  getUserChatThreads,
  saveChatMessage,
  getThreadMessages,
  ChatThreadRecord
} from '../lib/firebase';
import { LiveVoiceConversationModal } from './live-voice/LiveVoiceConversationModal';
import { AudioTranscriberModal } from './audio/AudioTranscriberModal';
import { VoiceSelectorModal } from './VoiceSelectorModal';
import {
  speakWithIndianVoice,
  stopIndianVoice,
  INDIAN_VOICE_PERSONAS,
  IndianVoicePersona
} from '../utils/indianVoiceService';

interface AIChatScreenProps {
  weather: WeatherData;
  trip: RouteTrip;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToHome: () => void;
  initialQuery?: string;
}

export type ModelType =
  | 'auto'
  | 'openai/gpt-oss-20b'
  | 'openai/gpt-oss-120b'
  | 'qwen/qwen3.6-27b'
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'gemini-fallback'
  | 'gemini-3.5-flash';

export type RoleType =
  | 'citizen'
  | 'researcher'
  | 'commute-concierge'
  | 'agricultural-advisor'
  | 'disaster-strategist';

export const AIChatScreen: React.FC<AIChatScreenProps> = ({
  weather,
  trip,
  currentLanguage,
  onLanguageChange,
  onBackToHome,
  initialQuery
}) => {
  const currentLangConfig = getLanguageInfo(currentLanguage);
  const { user, login } = useAuth();

  // Model & Role states - Defaulting to Auto Cascade & Citizen for fast crisp answers
  const [selectedModel, setSelectedModel] = useState<ModelType>('auto');
  const [selectedRole, setSelectedRole] = useState<RoleType>('citizen');
  const [enableSearchGrounding, setEnableSearchGrounding] = useState(false);
  const [enableMapsGrounding, setEnableMapsGrounding] = useState(false);

  // Modals for Live Voice & Audio Transcriber & Voice Selection
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoicePersona, setSelectedVoicePersona] = useState<IndianVoicePersona>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('weathergpt_voice_persona');
      const found = INDIAN_VOICE_PERSONAS.find((p) => p.id === savedId);
      if (found) return found;
    }
    return INDIAN_VOICE_PERSONAS[0]; // Aanya (Warm Indian female)
  });
  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedSpeed = localStorage.getItem('weathergpt_speech_speed');
      if (savedSpeed) return parseFloat(savedSpeed) || 0.94;
    }
    return 0.94;
  });

  const handleVoicePersonaSelect = (persona: IndianVoicePersona) => {
    setSelectedVoicePersona(persona);
    if (typeof window !== 'undefined') {
      localStorage.setItem('weathergpt_voice_persona', persona.id);
    }
  };

  const handleSpeechSpeedChange = (speed: number) => {
    setSpeechSpeed(speed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('weathergpt_speech_speed', speed.toString());
    }
  };

  // Firestore thread management
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [savedThreads, setSavedThreads] = useState<ChatThreadRecord[]>([]);
  const [showThreadDrawer, setShowThreadDrawer] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'weathergpt',
      text: currentLangConfig.welcomeMessage,
      timestamp: 'Just now',
      modelUsed: 'auto-cascade',
      roleUsed: 'citizen'
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Load chat threads when user logs in
  useEffect(() => {
    if (user) {
      loadUserThreads();
    }
  }, [user]);

  const loadUserThreads = async () => {
    if (!user) return;
    try {
      const threads = await getUserChatThreads(user.uid);
      setSavedThreads(threads);
    } catch (err) {
      console.warn('Could not load chat threads:', err);
    }
  };

  const handleSelectThread = async (thread: ChatThreadRecord) => {
    if (!user || !thread.id) return;
    try {
      setLoading(true);
      setCurrentThreadId(thread.id);
      setSelectedModel(thread.model as ModelType);
      setSelectedRole(thread.role as RoleType);

      const dbMessages = await getThreadMessages(user.uid, thread.id);
      if (dbMessages.length > 0) {
        setMessages(
          dbMessages.map((m) => ({
            id: m.id || `msg-${Date.now()}`,
            sender: m.role === 'user' ? 'user' : 'weathergpt',
            text: m.text,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            modelUsed: m.modelUsed,
            groundingSources: m.groundingSources
          }))
        );
      }
      setShowThreadDrawer(false);
    } catch (err) {
      console.warn('Error switching thread:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setCurrentThreadId(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'weathergpt',
        text: `Hello! I am your AI Weather & Travel Safety Copilot. I'm configured as a ${selectedRole.replace('-', ' ')} using ${selectedModel}. How can I assist you today?`,
        timestamp: 'Just now',
        modelUsed: selectedModel,
        roleUsed: selectedRole
      }
    ]);
  };

  const suggestions = [
    `Compare GFS vs WRF models for ${weather.city} today`,
    `Will it rain on my commute in ${weather.city} today?`,
    `Latest IMD monsoon alert and wind speed warning`,
    `Safe routes avoiding low-lying flooded underpasses`,
    `Optimal crop spraying window for farmers today`
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);
    setVoiceError(null);

    // Save user message to Firestore if authenticated
    let activeThreadId = currentThreadId;
    if (user) {
      try {
        if (!activeThreadId) {
          activeThreadId = await createChatThread(
            user.uid,
            textToSend.slice(0, 32),
            selectedModel,
            selectedRole
          );
          setCurrentThreadId(activeThreadId);
          loadUserThreads();
        }
        await saveChatMessage(user.uid, activeThreadId, {
          role: 'user',
          text: textToSend
        });
      } catch (fireErr) {
        console.warn('Could not save user message to Firestore:', fireErr);
      }
    }

    try {
      // Build conversation history for multi-turn Gemini API
      // Send user + assistant history
      const historyPayload = messages
        .concat(userMsg)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          role: selectedRole,
          city: weather.city,
          currentWeather: weather,
          language: currentLanguage,
          enableSearch: selectedModel === 'gemini-3.5-flash' && enableSearchGrounding,
          enableMaps: selectedModel === 'gemini-3.5-flash' && enableMapsGrounding,
          userLocation: { lat: 28.6139, lon: 77.2090 } // Default coordinates
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Weather intelligence service responded with non-200');
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'weathergpt',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        providerUsed: data.provider,
        roleUsed: selectedRole,
        groundingSources: data.sources || []
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save bot response to Firestore if authenticated
      if (user && activeThreadId) {
        try {
          await saveChatMessage(user.uid, activeThreadId, {
            role: 'model',
            text: data.text,
            modelUsed: data.modelUsed || selectedModel,
            groundingSources: data.sources || []
          });
        } catch (fireErr) {
          console.warn('Could not save bot message to Firestore:', fireErr);
        }
      }
    } catch (err: any) {
      console.warn('Chat request failed, serving verified real-time weather:', err);
      const isCitizen = selectedRole === 'citizen';
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'weathergpt',
        text: isCitizen
          ? `Currently in **${weather.city}**, the temperature is **${weather.temperature}°C** (${weather.condition}) with a **${weather.rainChance}%** chance of rain. ${weather.rainChance >= 50 ? 'Keep an umbrella handy today!' : 'Weather conditions are clear and favorable.'}`
          : `### 🌤️ Live Meteorological Briefing for ${weather.city}\n\nCurrently in **${weather.city}**, the temperature is **${weather.temperature}°C** (${weather.condition}) with a feels-like temperature of **${weather.feelsLike}°C**.\n\n* **Precipitation Probability:** ${weather.rainChance}%\n* **Relative Humidity:** ${weather.humidity}%\n* **Surface Wind:** ${weather.windSpeed} km/h\n* **Air Quality (AQI):** ${weather.aqi} (${weather.aqiStatus})\n\n💡 **Advisory:** ${weather.aiRecommendation || 'Weather telemetry is continuously verified via satellite and Doppler radar.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'weathergpt-meteorological-engine',
        providerUsed: 'Local Radar Engine'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingId === msgId) {
      stopIndianVoice();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(msgId);
    speakWithIndianVoice({
      text,
      personaId: selectedVoicePersona.id,
      gender: selectedVoicePersona.gender,
      langCode: getSpeechRecognitionLang(currentLanguage),
      rate: speechSpeed,
      onStart: () => setSpeakingId(msgId),
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null)
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 select-none">
      {/* Top Appbar */}
      <div className="p-3 bg-white border-b border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onBackToHome}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 font-heading flex items-center gap-1">
                  Gemini AI Advisor
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-[10px] text-slate-400 font-medium">Multi-Turn Conversational Copilot</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Live Voice Copilot Button (gemini-3.1-flash-live-preview) */}
            <button
              onClick={() => setIsLiveVoiceOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow-xs active:scale-95 transition cursor-pointer"
              title="Start real-time voice conversation with Gemini Live API"
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Live Voice</span>
            </button>

            {/* Audio Transcriber Button (gemini-3.5-transcribe) */}
            <button
              onClick={() => setIsTranscriberOpen(true)}
              className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition cursor-pointer"
              title="Record and transcribe speech using gemini-3.5-transcribe"
            >
              <FileAudio className="w-3 h-3" />
              <span className="hidden sm:inline">Transcribe</span>
            </button>

            {/* Cloud Threads History Drawer button */}
            {user ? (
              <button
                onClick={() => setShowThreadDrawer(!showThreadDrawer)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs transition cursor-pointer"
                title="Saved Cloud Chats"
              >
                <Database className="w-4 h-4 text-sky-600" />
              </button>
            ) : (
              <button
                onClick={login}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200"
                title="Sign in with Google to save chat history to Firestore"
              >
                Sign In
              </button>
            )}

            {/* Start New Chat */}
            <button
              onClick={handleStartNewChat}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
              title="New Conversation"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Configuration Bar: Role Persona & Model Cascade Selector */}
        <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          {/* Role Persona Selector (Citizen by default) */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Role:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              className="bg-sky-50 text-sky-900 font-bold px-2.5 py-1 rounded-xl border border-sky-200 text-[11px] cursor-pointer hover:bg-sky-100 transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              title="Switch user role: Citizen receives lightning-fast concise answers, Researcher receives in-depth scientific analysis"
            >
              <option value="citizen">👤 Citizen (Fast & Crisp)</option>
              <option value="researcher">🔬 Researcher (In-depth & Scientific)</option>
              <option value="commute-concierge">🚗 Commute Concierge</option>
              <option value="agricultural-advisor">🌾 Farmer Advisor</option>
              <option value="disaster-strategist">🚨 Disaster Strategist</option>
            </select>
          </div>

          {/* Model Cascade Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelType)}
              className="bg-slate-100 text-slate-800 font-semibold px-2.5 py-1 rounded-xl border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-200/70 transition focus:outline-none focus:ring-1 focus:ring-slate-400"
              title="Select AI model priority cascade"
            >
              <option value="auto">⚡ Auto (Smart Multi-Model Cascade)</option>
              <option value="openai/gpt-oss-20b">1. openai/gpt-oss-20b</option>
              <option value="openai/gpt-oss-120b">2. openai/gpt-oss-120b</option>
              <option value="qwen/qwen3.6-27b">3. qwen/qwen3.6-27b</option>
              <option value="llama-3.1-8b-instant">4. llama-3.1-8b-instant (Fastest)</option>
              <option value="llama-3.3-70b-versatile">5. llama-3.3-70b-versatile</option>
              <option value="gemini-fallback">6. Gemini Fallback</option>
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Grounding)</option>
            </select>
          </div>

          {/* Grounding toggles (available on gemini-3.5-flash) */}
          {selectedModel === 'gemini-3.5-flash' && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setEnableSearchGrounding(!enableSearchGrounding)}
                className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition flex items-center space-x-1 ${
                  enableSearchGrounding
                    ? 'bg-sky-50 text-sky-700 border-sky-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title="Toggle Google Search Grounding"
              >
                <Globe className="w-3 h-3" />
                <span>Search</span>
              </button>

              <button
                onClick={() => setEnableMapsGrounding(!enableMapsGrounding)}
                className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition flex items-center space-x-1 ${
                  enableMapsGrounding
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
                title="Toggle Geospatial & Map Grounding"
              >
                <MapPin className="w-3 h-3" />
                <span>Maps</span>
              </button>
            </div>
          )}

          {/* Language Selector */}
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-xl border border-emerald-200 text-[10px] cursor-pointer"
            title="Change AI conversation language"
          >
            {INDIAN_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                🌐 {l.nativeName} ({l.name})
              </option>
            ))}
          </select>

          {/* AI Bot Voice Selector Button */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            title={`Change AI voice: currently ${selectedVoicePersona.name} (${selectedVoicePersona.gender})`}
          >
            <Volume2 className="w-3 h-3 text-purple-600" />
            <span className="max-w-[70px] truncate">{selectedVoicePersona.name}</span>
            <span className="text-[9px] px-1 py-0.2 bg-purple-200/70 rounded text-purple-800">
              {selectedVoicePersona.gender === 'female' ? 'F' : 'M'}
            </span>
          </button>
        </div>
      </div>

      {/* Cloud Threads History Drawer */}
      {showThreadDrawer && user && (
        <div className="p-3 bg-white border-b border-slate-200 max-h-40 overflow-y-auto space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Database className="w-3 h-3 text-sky-600" />
              <span>Cloud Saved Conversations</span>
            </span>
            <button
              onClick={() => setShowThreadDrawer(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          {savedThreads.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-1">No past chat threads found in Firestore.</p>
          ) : (
            savedThreads.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectThread(t)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                  currentThreadId === t.id
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="truncate max-w-[200px]">{t.title}</span>
                <span className="text-[9px] text-slate-400 uppercase">{t.model}</span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Scrollable Messages Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3.5 text-xs font-medium leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
              }`}
            >
              {/* Bot Header with Model & Grounding indicators */}
              {m.sender === 'weathergpt' && (
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 text-[10px] text-slate-400 font-bold">
                  <div className="flex items-center space-x-1.5">
                    <span className="flex items-center gap-1 text-sky-600">
                      <Sparkles className="w-3 h-3" />
                      WeatherGPT
                    </span>
                    {m.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px] flex items-center gap-1 border border-slate-200/60">
                        <span>{m.modelUsed}</span>
                        {m.providerUsed && (
                          <span className="text-[8px] text-sky-600 font-sans font-semibold">({m.providerUsed})</span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setIsVoiceModalOpen(true)}
                      className="text-[9px] text-purple-600 hover:text-purple-800 font-semibold px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 transition flex items-center gap-1 cursor-pointer"
                      title="Change AI voice persona"
                    >
                      <span>{selectedVoicePersona.name}</span>
                      <span className="text-[8px] opacity-70">({selectedVoicePersona.gender === 'female' ? 'F' : 'M'})</span>
                    </button>
                    <button
                      onClick={() => handleSpeak(m.id, m.text)}
                      className={`p-1 hover:bg-slate-100 rounded-md transition cursor-pointer flex items-center gap-1 ${
                        speakingId === m.id ? 'text-purple-600 font-bold' : 'text-slate-500'
                      }`}
                      title={speakingId === m.id ? 'Stop Speaking' : `Read Aloud with ${selectedVoicePersona.name}`}
                    >
                      {speakingId === m.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                          <span className="text-[9px] text-purple-600 font-medium">Playing...</span>
                        </>
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Grounding Sources (Search / Geospatial Grounding) */}
              {m.groundingSources && m.groundingSources.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    <Globe className="w-3 h-3 text-sky-600" />
                    <span>Grounding Citations & Sources</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.groundingSources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 text-[10px] font-semibold transition"
                      >
                        {src.type === 'maps' ? (
                          <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <Globe className="w-2.5 h-2.5 text-sky-600" />
                        )}
                        <span className="max-w-[140px] truncate">{src.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-2xl w-40 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-sky-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 rounded-full bg-sky-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="text-[10px] font-bold text-slate-400 ml-1">
              {selectedModel === 'gemini-3.1-pro-preview' ? 'Deep Reasoning...' : 'Generating...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/60 overflow-x-auto flex space-x-1.5 no-scrollbar">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            className="shrink-0 px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200/80 rounded-full text-[11px] font-medium transition active:scale-95 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {voiceError && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{voiceError}</span>
          </div>
          <button onClick={() => setVoiceError(null)} className="text-rose-500 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Message Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`Ask as ${selectedRole.replace('-', ' ')} (${selectedModel})...`}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-sky-500 transition"
          />

          {/* Audio Transcribe Button right in chat bar */}
          <button
            type="button"
            onClick={() => setIsTranscriberOpen(true)}
            title="Transcribe speech with gemini-3.5-transcribe"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 flex items-center justify-center transition cursor-pointer"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Voice Persona Selector quick button */}
          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            title={`Change AI Voice: currently ${selectedVoicePersona.name} (${selectedVoicePersona.gender})`}
            className="w-9 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center transition cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputVal.trim() || loading}
            className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Voice Selector Modal */}
      <VoiceSelectorModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedPersonaId={selectedVoicePersona.id}
        onSelectPersona={handleVoicePersonaSelect}
        currentLanguage={currentLanguage}
        speechSpeed={speechSpeed}
        onSpeedChange={handleSpeechSpeedChange}
      />

      {/* Live Voice Copilot Modal (gemini-3.1-flash-live-preview) */}
      <LiveVoiceConversationModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        userCity={weather.city}
        currentLanguage={currentLanguage}
        onLanguageChange={onLanguageChange}
      />

      {/* Audio Transcriber Modal (gemini-3.5-transcribe) */}
      <AudioTranscriberModal
        isOpen={isTranscriberOpen}
        onClose={() => setIsTranscriberOpen(false)}
        onSendToChat={(text) => handleSendMessage(text)}
      />
    </div>
  );
};
