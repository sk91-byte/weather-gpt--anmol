import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Copy, Check, Sparkles, X, ArrowRight, Clock, FileAudio, Database, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { saveAudioTranscription, AudioTranscriptionRecord } from '../../lib/firebase';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onSendToChat
}) => {
  const { user, transcriptions, refreshUserData } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (isRecording) stopRecording();
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      setTranscribedText('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToTranscribe(audioBlob, recordingSeconds);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      setErrorMsg(err.message || 'Microphone permission denied or not available.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToTranscribe = async (blob: Blob, duration: number) => {
    setIsTranscribing(true);
    setErrorMsg(null);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: 'audio/webm'
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Transcription failed');
        }

        const resultText = data.text || '';
        setTranscribedText(resultText);
        setModelUsed(data.modelUsed || 'gemini-3.5-transcribe');

        // Persist to Cloud Firestore if user is authenticated
        if (user && resultText) {
          try {
            await saveAudioTranscription(user.uid, resultText, duration);
            await refreshUserData();
          } catch (fireErr) {
            console.warn('Could not persist transcription to Firestore:', fireErr);
          }
        }
      };
    } catch (err: any) {
      console.error('Transcription API error:', err);
      setErrorMsg(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = () => {
    if (!transcribedText) return;
    navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900">Audio Transcription</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-500">Record voice observations or weather memos</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {user && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  showHistory ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>History ({transcriptions.length})</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History Drawer */}
        {showHistory && (
          <div className="my-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Saved Voice Transcriptions (Cloud Firestore)</span>
            </h4>
            {transcriptions.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No transcriptions saved yet.</p>
            ) : (
              transcriptions.map((item) => (
                <div key={item.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs">
                  <p className="text-slate-800 font-medium line-clamp-2">{item.text}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(item.text);
                          onClose();
                        }}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Send to Chat →
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Recording Zone */}
        <div className="my-6 flex flex-col items-center justify-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isTranscribing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition active:scale-95 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-rose-500/40 ring-4 ring-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/30'
              }`}
            >
              {isRecording ? <Square className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="mt-4 text-center">
            {isRecording ? (
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span>Recording... {formatTime(recordingSeconds)}</span>
              </div>
            ) : isTranscribing ? (
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm animate-pulse">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Transcribing via gemini-3.5-transcribe...</span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-600">
                Tap microphone to start speaking. Tap square to transcribe.
              </p>
            )}
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Transcription Output */}
        {transcribedText && (
          <div className="mb-4 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center space-x-1">
                <span>✨ Transcribed Output</span>
                <span className="text-indigo-400">• {modelUsed}</span>
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1 text-xs font-bold text-indigo-700 hover:text-indigo-800 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-indigo-100/60 shadow-sm">
              "{transcribedText}"
            </p>

            {/* Quick Actions */}
            <div className="flex items-center justify-end space-x-2 pt-1">
              {onSendToChat && (
                <button
                  onClick={() => {
                    onSendToChat(transcribedText);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  <span>Ask in Gemini Chatbot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Auth Notice */}
        {!user && (
          <p className="text-[11px] text-slate-400 text-center">
            💡 Sign in with Google to automatically save your audio transcriptions to Cloud Firestore.
          </p>
        )}
      </div>
    </div>
  );
};
