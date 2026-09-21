import { WhatsAppAlertPreferences, WhatsAppAlertLog, TwilioServiceStatus, WeatherAlert } from '../types';

const PREFS_STORAGE_KEY = 'weathergpt_whatsapp_alert_prefs';

export const DEFAULT_WHATSAPP_PREFERENCES: WhatsAppAlertPreferences = {
  enabled: true,
  phoneNumber: '',
  email: 'anmolsahu118@gmail.com',
  warningBeforeMinutes: 30,
  alertLevel: 'High',
  threshold: 'HIGH_EXTREME',
  categories: {
    heavyRain: true,
    flood: true,
    cyclone: true,
    heatwave: true,
    thunderstorm: true,
    denseFog: true
  },
  monitoredCities: ['Dehradun'],
  cooldownHours: 4
};

export function getStoredWhatsAppPreferences(): WhatsAppAlertPreferences {
  if (typeof window === 'undefined') return DEFAULT_WHATSAPP_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WHATSAPP_PREFERENCES,
        ...parsed,
        categories: {
          ...DEFAULT_WHATSAPP_PREFERENCES.categories,
          ...(parsed.categories || {})
        }
      };
    }
  } catch (e) {
    console.warn('Error reading stored WhatsApp alert preferences:', e);
  }
  return DEFAULT_WHATSAPP_PREFERENCES;
}

export function saveStoredWhatsAppPreferences(prefs: WhatsAppAlertPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Error saving WhatsApp alert preferences:', e);
  }
}

export async function fetchTwilioStatus(): Promise<TwilioServiceStatus> {
  try {
    const res = await fetch('/api/weather-alert/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Error fetching Twilio status:', err);
  }
  return {
    configured: false,
    sender: 'whatsapp:+1415••••886',
    hasAuthToken: false,
    hasApiKey: false,
    recentAlertsCount: 0
  };
}

export async function sendTestWhatsAppAlert(phoneNumber: string): Promise<{
  success: boolean;
  configured: boolean;
  sid?: string;
  recipient?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/weather-alert/test-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      error: err?.message || 'Network error when requesting test WhatsApp alert.'
    };
  }
}

export async function sendCustomWhatsAppAlert(
  phoneNumber: string,
  alert: {
    severity: 'Moderate' | 'High' | 'Extreme';
    event: string;
    location: string;
    timeframe?: string;
    description: string;
    impacts?: string[];
    recommendedActions?: string[];
  },
  force: boolean = false
): Promise<{
  success: boolean;
  configured: boolean;
  sid?: string;
  suppressed?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/weather-alert/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber, alert, force })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      configured: false,
      error: err?.message || 'Failed to dispatch WhatsApp alert.'
    };
  }
}

export async function evaluateAndTriggerAlert(
  weather: any,
  preferences: WhatsAppAlertPreferences,
  sendIfTriggered: boolean = true
): Promise<{
  success: boolean;
  evaluation?: {
    shouldAlert: boolean;
    severity: 'Moderate' | 'High' | 'Extreme';
    event: string;
    location: string;
    description: string;
    impacts: string[];
    recommendedActions: string[];
    timeframe: string;
    fingerprint: string;
    reasons: string[];
  };
  sendResult?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/weather-alert/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weather,
        preferences: {
          threshold: preferences.threshold,
          categories: preferences.categories,
          cooldownHours: preferences.cooldownHours
        },
        to: preferences.phoneNumber,
        sendIfTriggered: sendIfTriggered && preferences.enabled && Boolean(preferences.phoneNumber)
      })
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Evaluation failed.'
    };
  }
}

export async function syncSubscriberToServer(prefs: WhatsAppAlertPreferences): Promise<void> {
  if (!prefs.phoneNumber) return;
  try {
    await fetch('/api/weather-alert/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: prefs.phoneNumber,
        cities: prefs.monitoredCities,
        threshold: prefs.threshold,
        categories: prefs.categories,
        enabled: prefs.enabled
      })
    });
  } catch (e) {
    console.warn('Failed to sync subscriber preferences to server:', e);
  }
}

export async function fetchAlertHistory(): Promise<WhatsAppAlertLog[]> {
  try {
    const res = await fetch('/api/weather-alert/history');
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.warn('Error fetching alert history:', err);
  }
  return [];
}

export async function clearAlertHistory(): Promise<void> {
  try {
    await fetch('/api/weather-alert/clear-history', { method: 'POST' });
  } catch (err) {
    console.warn('Error clearing alert history:', err);
  }
}
