import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Phone,
  Send,
  Loader2,
  Sparkles,
  Smartphone,
  Check,
  Clock,
  Info,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Trash2
} from './Icons';
import { WeatherData, WhatsAppAlertPreferences, WhatsAppAlertLog, TwilioServiceStatus } from '../types';
import {
  getStoredWhatsAppPreferences,
  saveStoredWhatsAppPreferences,
  fetchTwilioStatus,
  sendTestWhatsAppAlert,
  evaluateAndTriggerAlert,
  syncSubscriberToServer,
  fetchAlertHistory,
  clearAlertHistory
} from '../services/whatsappAlertClient';

interface WhatsAppAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
}

export const WhatsAppAlertsModal: React.FC<WhatsAppAlertsModalProps> = ({
  isOpen,
  onClose,
  weather
}) => {
  const [prefs, setPrefs] = useState<WhatsAppAlertPreferences>(() => getStoredWhatsAppPreferences());
  const [twilioStatus, setTwilioStatus] = useState<TwilioServiceStatus>({
    configured: false,
    sender: 'whatsapp:+1415••••886',
    hasAuthToken: false,
    hasApiKey: false,
    recentAlertsCount: 0
  });

  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    sid?: string;
  }>({ loading: false });

  const [evalStatus, setEvalStatus] = useState<{
    loading: boolean;
    evaluated?: boolean;
    result?: any;
    message?: string;
  }>({ loading: false });

  const [history, setHistory] = useState<WhatsAppAlertLog[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showArchInfo, setShowArchInfo] = useState(false);

  // Load status and history on modal open
  useEffect(() => {
    if (isOpen) {
      loadStatusAndHistory();
    }
  }, [isOpen]);

  const loadStatusAndHistory = async () => {
    const [statusData, historyData] = await Promise.all([
      fetchTwilioStatus(),
      fetchAlertHistory()
    ]);
    setTwilioStatus(statusData);
    setHistory(historyData);
  };

  if (!isOpen) return null;

  const handleSavePreferences = async () => {
    saveStoredWhatsAppPreferences(prefs);
    await syncSubscriberToServer(prefs);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTestAlert = async () => {
    if (!prefs.phoneNumber.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your WhatsApp phone number first.'
      });
      return;
    }

    setTestStatus({ loading: true });
    const res = await sendTestWhatsAppAlert(prefs.phoneNumber);
    setTestStatus({
      loading: false,
      success: res.success,
      sid: res.sid,
      message: res.success
        ? `Test alert dispatched successfully to WhatsApp! (Twilio SID: ${res.sid?.slice(0, 10)}...)`
        : res.error || 'Failed to send test alert. Check Twilio credentials.'
    });

    // Refresh history
    const historyData = await fetchAlertHistory();
    setHistory(historyData);
  };

  const handleRunEvaluation = async () => {
    setEvalStatus({ loading: true });
    const res = await evaluateAndTriggerAlert(weather, prefs, prefs.enabled);
    setEvalStatus({
      loading: false,
      evaluated: true,
      result: res.evaluation,
      message: res.evaluation?.shouldAlert
        ? `Early Warning Triggered: ${res.evaluation.event} (${res.evaluation.severity} Risk).`
        : 'Telemetry Evaluated: No high-risk anomaly detected under current threshold.'
    });

    // Refresh history if alert was sent
    if (res.sendResult) {
      const historyData = await fetchAlertHistory();
      setHistory(historyData);
    }
  };

  const handleClearHistory = async () => {
    await clearAlertHistory();
    setHistory([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div
        id="modal-whatsapp-alerts"
        className="w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-extrabold tracking-tight">Twilio WhatsApp Early Warning</h3>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                  Real Twilio SDK
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">
                Automated early alerts for cloudbursts, floods & severe gales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Twilio Configuration Status Banner */}
          <div
            className={`p-3.5 rounded-2xl border ${
              twilioStatus.configured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2.5">
                {twilioStatus.configured ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold font-heading">
                      {twilioStatus.configured
                        ? 'Twilio WhatsApp Service Active'
                        : 'Twilio Credentials Needed in Secrets'}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        twilioStatus.configured
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {twilioStatus.configured ? 'Configured' : 'Setup Required'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {twilioStatus.configured ? (
                      <>
                        Twilio credentials detected server-side. Sender:{' '}
                        <code className="bg-white/80 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-800">
                          {twilioStatus.sender}
                        </code>
                      </>
                    ) : (
                      <>
                        To enable real WhatsApp delivery, add your{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">
                          TWILIO_ACCOUNT_SID
                        </code>{' '}
                        and{' '}
                        <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">
                          TWILIO_AUTH_TOKEN
                        </code>{' '}
                        in the Google AI Studio <strong>Settings &gt; Secrets</strong> menu.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={loadStatusAndHistory}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-lg transition cursor-pointer"
                title="Refresh Twilio status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Twilio Sandbox Tip */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>💡 Using Twilio Sandbox? Send "join &lt;keyword&gt;" to +1 415 523 8886 first.</span>
              <span className="font-semibold text-slate-700">Protected by 4-hr Deduplication</span>
            </div>
          </div>

          {/* Master Enable/Disable & Phone Number Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block font-heading">
                  Automatic WhatsApp Early Alerts
                </span>
                <span className="text-[11px] text-slate-500">
                  Sends actionable warnings when danger thresholds are reached
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.enabled}
                  onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Phone Number Input */}
            <div className="pt-2 border-t border-slate-200/80 space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Recipient WhatsApp Phone Number
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                    📱
                  </span>
                  <input
                    type="tel"
                    value={prefs.phoneNumber}
                    onChange={(e) => setPrefs({ ...prefs, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210 (with country code)"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                  />
                </div>
                <button
                  onClick={handleSavePreferences}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 shrink-0 shadow-xs"
                >
                  {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{savedSuccess ? 'Saved' : 'Save'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Format: <code>+919876543210</code> or 10-digit number. Normalizes to WhatsApp international format.
              </p>
            </div>
          </div>

          {/* Alert Threshold & Categories */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block font-heading">
              Alert Trigger Thresholds
            </span>

            {/* Threshold Selector */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPrefs({ ...prefs, threshold: 'HIGH_EXTREME' })}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                  prefs.threshold === 'HIGH_EXTREME'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold block text-xs">High & Extreme Only</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Cloudburst, Flash Flood, Cyclone, Extreme Heat (Recommended)
                </span>
              </button>

              <button
                onClick={() => setPrefs({ ...prefs, threshold: 'MODERATE_HIGH_EXTREME' })}
                className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                  prefs.threshold === 'MODERATE_HIGH_EXTREME'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="font-bold block text-xs">Moderate & Above</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Includes heavy rainfall downpours & dense expressway fog
                </span>
              </button>
            </div>

            {/* Categories Checkboxes */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">Monitored Hazard Types:</span>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                {[
                  { key: 'flood', label: '🌊 Flash Flood & Cloudburst' },
                  { key: 'cyclone', label: '🌪️ Cyclone & Gale Winds' },
                  { key: 'heavyRain', label: '🌧️ Heavy Rainfall Downpour' },
                  { key: 'thunderstorm', label: '⚡ Severe Thunderstorm' },
                  { key: 'heatwave', label: '☀️ Dangerous Heatwave' },
                  { key: 'denseFog', label: '🌫️ Dense Fog & Zero Visibility' }
                ].map((cat) => (
                  <label key={cat.key} className="flex items-center space-x-2 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(prefs.categories as any)[cat.key] ?? true}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          categories: {
                            ...prefs.categories,
                            [cat.key]: e.target.checked
                          }
                        })
                      }
                      className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-medium">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Instant Test & Evaluation Buttons */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block font-heading">
              Verification & Live Evaluation
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSendTestAlert}
                disabled={testStatus.loading}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
              >
                {testStatus.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send Test WhatsApp Alert</span>
              </button>

              <button
                onClick={handleRunEvaluation}
                disabled={evalStatus.loading}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
              >
                {evalStatus.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Evaluate Current Weather Now</span>
              </button>
            </div>

            {/* Test result status display */}
            {testStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                  testStatus.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{testStatus.message}</p>
                  {testStatus.sid && (
                    <p className="text-[10px] font-mono opacity-80 mt-0.5">
                      Twilio SID: {testStatus.sid}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Evaluation result status display */}
            {evalStatus.evaluated && evalStatus.result && (
              <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Evaluated for {evalStatus.result.location}:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        evalStatus.result.severity === 'Extreme' || evalStatus.result.severity === 'High'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {evalStatus.result.severity} Risk
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {evalStatus.result.shouldAlert ? '⚠️ Trigger Met' : '✓ Normal'}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{evalStatus.result.description}</p>
                {evalStatus.result.reasons?.length > 0 && (
                  <div className="text-[10px] text-slate-500">
                    Reasons: {evalStatus.result.reasons.join(' • ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Alert History Feed */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide font-heading">
                  WhatsApp Alert History ({history.length})
                </span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No alerts sent yet. Use "Send Test WhatsApp Alert" above to verify your phone number.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'sent' || item.status === 'delivered'
                              ? 'bg-emerald-500'
                              : item.status === 'suppressed'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-bold text-slate-800 truncate max-w-[180px]">
                          {item.event}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>📍 {item.location} → {item.recipient}</span>
                      <span
                        className={`font-semibold uppercase ${
                          item.status === 'sent' || item.status === 'delivered'
                            ? 'text-emerald-600'
                            : item.status === 'suppressed'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Architecture & Background Scheduling Details */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <button
              onClick={() => setShowArchInfo(!showArchInfo)}
              className="w-full flex items-center justify-between font-bold text-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-1.5 text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Production 24/7 Autonomous Alert Architecture</span>
              </span>
              <span className="text-blue-600 text-[10px]">{showArchInfo ? 'Hide' : 'Show Details'}</span>
            </button>

            {showArchInfo && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-2 text-[11px] leading-relaxed text-slate-600">
                <p>
                  <strong>Google AI Studio Runtime:</strong> In the active AI Studio container, a background timer
                  evaluates live Doppler & meteorological telemetry every 10 minutes for all registered subscribers.
                </p>
                <p>
                  <strong>24/7 Production Deployment:</strong> When deploying to Google Cloud Run, Cloud Run containers
                  can scale to zero when idle. To run 24/7 continuous autonomous alerts without keeping a browser open:
                </p>
                <ol className="list-decimal list-inside pl-1 space-y-1 text-slate-700 font-medium">
                  <li>Deploy WeatherGPT to Google Cloud Run via AI Studio settings.</li>
                  <li>Configure <strong>Google Cloud Scheduler</strong> to call <code>POST /api/weather-alert/evaluate</code> every 15 minutes.</li>
                  <li>Ensure <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code> are added in Cloud Run environment variables.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
