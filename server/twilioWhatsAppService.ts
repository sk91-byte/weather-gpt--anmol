import twilio from 'twilio';

export interface WeatherTelemetryInput {
  city: string;
  state?: string;
  temperature?: number;
  condition?: string;
  rainChance?: number;
  windSpeed?: number;
  visibility?: number;
  riskScore?: number;
  riskStatus?: string;
  risks?: {
    rain?: 'LOW' | 'MEDIUM' | 'HIGH';
    flood?: 'LOW' | 'MEDIUM' | 'HIGH';
    lightning?: 'LOW' | 'MEDIUM' | 'HIGH';
    heat?: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  activeAlerts?: Array<{
    title: string;
    severity: string;
    description: string;
  }>;
}

export interface WhatsAppAlertEvaluation {
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
}

export interface WhatsAppAlertLogItem {
  id: string;
  sid?: string;
  recipient: string;
  location: string;
  event: string;
  severity: 'Moderate' | 'High' | 'Extreme';
  status: 'sent' | 'delivered' | 'failed' | 'simulated' | 'suppressed';
  timestamp: string;
  messageText: string;
  fingerprint: string;
  error?: string;
}

// In-memory alert log and fingerprint cache (retained during container runtime)
const alertHistoryLog: WhatsAppAlertLogItem[] = [];
const alertFingerprints = new Map<string, number>(); // fingerprint -> timestamp (ms)

// Normalize phone number to WhatsApp E.164 format: whatsapp:+[country][number]
export function normalizeWhatsAppNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim().replace(/\s+/g, '').replace(/[-()]/g, '');

  // If already starts with whatsapp:, extract the number part
  if (cleaned.startsWith('whatsapp:')) {
    cleaned = cleaned.replace('whatsapp:', '');
  }

  // Ensure leading plus
  if (!cleaned.startsWith('+')) {
    // If 10-digit Indian number, prepend +91
    if (/^\d{10}$/.test(cleaned)) {
      cleaned = `+91${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }

  return `whatsapp:${cleaned}`;
}

// Get Twilio Sender number (defaulting to Twilio WhatsApp Sandbox number if not set)
export function getTwilioSender(): string {
  const fromEnv = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (fromEnv) {
    return fromEnv.startsWith('whatsapp:') ? fromEnv : `whatsapp:${fromEnv}`;
  }
  return 'whatsapp:+14155238886'; // Official Twilio WhatsApp Sandbox default
}

// Check configuration status without exposing credentials
export function getTwilioConfigStatus() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();

  const hasAccountSid = Boolean(accountSid && accountSid.startsWith('AC'));
  const hasAuthToken = Boolean(authToken && authToken.length > 8);
  const hasApiKeySecret = Boolean(apiKey && apiSecret && apiKey.startsWith('SK'));
  const isConfigured = hasAccountSid && (hasAuthToken || hasApiKeySecret);

  const sender = getTwilioSender();
  // Mask sender for safe display
  const maskedSender = sender.replace(/(\+\d{3})\d+(\d{4})/, '$1••••$2');

  return {
    configured: isConfigured,
    sender: maskedSender,
    hasAuthToken,
    hasApiKey: hasApiKeySecret,
    accountSidPrefix: hasAccountSid ? `${accountSid!.substring(0, 6)}••••` : undefined,
    recentAlertsCount: alertHistoryLog.length
  };
}

// Lazy-initialize Twilio REST client
let twilioClientInstance: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (twilioClientInstance) return twilioClientInstance;

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKey = process.env.TWILIO_API_KEY?.trim();
  const apiSecret = process.env.TWILIO_API_SECRET?.trim();

  if (!accountSid) {
    return null;
  }

  try {
    if (apiKey && apiSecret) {
      twilioClientInstance = twilio(apiKey, apiSecret, { accountSid });
    } else if (authToken) {
      twilioClientInstance = twilio(accountSid, authToken);
    }
  } catch (err) {
    console.warn('Failed to initialize Twilio client:', err);
  }

  return twilioClientInstance;
}

// Compute a fingerprint to prevent duplicate alerts within a cooldown window (4 hours)
export function generateAlertFingerprint(
  location: string,
  event: string,
  severity: string,
  cooldownWindowHours: number = 4
): { fingerprint: string; timeWindowBucket: number } {
  const now = Date.now();
  const windowMs = cooldownWindowHours * 60 * 60 * 1000;
  // Floor to time bucket so alerts for the same event in the same 4-hour window share a key
  const timeWindowBucket = Math.floor(now / windowMs);
  const locKey = location.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const eventKey = event.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const sevKey = severity.toLowerCase().trim();

  const fingerprint = `${locKey}:${eventKey}:${sevKey}:${timeWindowBucket}`;
  return { fingerprint, timeWindowBucket };
}

// Check whether an alert was already sent within cooldown period
export function isDuplicateAlert(fingerprint: string, cooldownHours: number = 4): boolean {
  const lastSent = alertFingerprints.get(fingerprint);
  if (!lastSent) return false;
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastSent < cooldownMs;
}

// Record a fingerprint to prevent duplicates
export function recordAlertFingerprint(fingerprint: string) {
  alertFingerprints.set(fingerprint, Date.now());
  // Prune old fingerprints (older than 24 hours)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [k, timestamp] of alertFingerprints.entries()) {
    if (timestamp < cutoff) {
      alertFingerprints.delete(k);
    }
  }
}

// Core weather risk evaluation engine
export function evaluateWeatherAlert(
  weather: WeatherTelemetryInput,
  options?: {
    threshold?: 'HIGH_EXTREME' | 'MODERATE_HIGH_EXTREME';
    categories?: {
      heavyRain?: boolean;
      flood?: boolean;
      cyclone?: boolean;
      heatwave?: boolean;
      thunderstorm?: boolean;
      denseFog?: boolean;
    };
    cooldownHours?: number;
  }
): WhatsAppAlertEvaluation {
  const threshold = options?.threshold || 'HIGH_EXTREME';
  const categories = options?.categories || {
    heavyRain: true,
    flood: true,
    cyclone: true,
    heatwave: true,
    thunderstorm: true,
    denseFog: true
  };
  const cooldownHours = options?.cooldownHours || 4;

  const loc = weather.city || 'Your Location';
  const cond = (weather.condition || '').toLowerCase();
  const rainChance = weather.rainChance ?? 0;
  const windSpeed = weather.windSpeed ?? 0;
  const temp = weather.temperature ?? 28;
  const visibility = weather.visibility ?? 10000;
  const riskStatus = (weather.riskStatus || '').toLowerCase();

  const risks = weather.risks || {
    rain: 'LOW',
    flood: 'LOW',
    lightning: 'LOW',
    heat: 'LOW'
  };

  const reasons: string[] = [];
  let severity: 'Moderate' | 'High' | 'Extreme' = 'Moderate';
  let event = 'Severe Weather Warning';
  let description = '';
  const impacts: string[] = [];
  const recommendedActions: string[] = [];
  let timeframe = 'Next 3–6 Hours';
  let shouldTrigger = false;

  // 1. Cyclone / Destructive Storm check
  if (categories.cyclone && (windSpeed >= 65 || cond.includes('cyclone') || cond.includes('gale'))) {
    shouldTrigger = true;
    severity = windSpeed >= 85 ? 'Extreme' : 'High';
    event = 'Cyclone & High Wind Gale Advisory';
    reasons.push(`Wind gusts reaching ${windSpeed} km/h`);
    description = `Doppler radar and atmospheric pressure indicate intense cyclonic circulation approaching ${loc} with wind speeds up to ${windSpeed} km/h.`;
    impacts.push('Risk of falling branches, power disruption, and unsecured structure damage.');
    impacts.push('Hazardous highway and flyover driving conditions.');
    recommendedActions.push('Secure loose rooftop solar panels, tin sheets, and outdoor furniture.');
    recommendedActions.push('Stay indoors away from large trees and high-voltage power lines.');
  }

  // 2. Flash Flood & Cloudburst check
  else if (categories.flood && (risks.flood === 'HIGH' || cond.includes('cloudburst') || (rainChance >= 85 && risks.rain === 'HIGH'))) {
    shouldTrigger = true;
    severity = (risks.flood === 'HIGH' || cond.includes('cloudburst')) ? 'Extreme' : 'High';
    event = 'Flash Flood & Cloudburst Alert';
    reasons.push(`Flash flood risk evaluated as ${risks.flood}, rain probability ${rainChance}%`);
    description = `Heavy precipitation runoff detected over foothill drainages and low-lying storm channels in ${loc}. Inundation risk is elevated.`;
    impacts.push('Rapid waterlogging of underpasses, arterial ring roads, and basement parkings.');
    impacts.push('Potential flash surge in localized riverbeds and nullahs.');
    recommendedActions.push('Avoid commuting through known waterlogged underpasses or riverbeds.');
    recommendedActions.push('Move vehicles and sensitive electrical inventory to elevated ground.');
    timeframe = 'Immediate / Next 2 Hours';
  }

  // 3. Heavy Rain & Downpour check
  else if (categories.heavyRain && (rainChance >= 75 || risks.rain === 'HIGH' || cond.includes('heavy rain') || cond.includes('downpour'))) {
    shouldTrigger = true;
    severity = (rainChance >= 85 && risks.rain === 'HIGH') ? 'High' : 'Moderate';
    event = 'Heavy Rainfall Downpour Warning';
    reasons.push(`Rain probability ${rainChance}%, rain risk ${risks.rain}`);
    description = `Sustained convective storm clouds active over ${loc}. Precipitation probability is ${rainChance}%.`;
    impacts.push('Severe commute slowdowns, poor roadway visibility, and localized ponding.');
    recommendedActions.push('Allow 20-30 minutes extra for daily travel; carry waterproof gear.');
    recommendedActions.push('Keep headlights on low-beam and maintain double stopping distance.');
  }

  // 4. Thunderstorm & Lightning check
  else if (categories.thunderstorm && (risks.lightning === 'HIGH' || cond.includes('thunder') || cond.includes('lightning'))) {
    shouldTrigger = true;
    severity = risks.lightning === 'HIGH' ? 'High' : 'Moderate';
    event = 'Severe Thunderstorm & Lightning Alert';
    reasons.push(`Lightning hazard rated ${risks.lightning}`);
    description = `Active electrical storm cells detected over ${loc}. Cloud-to-ground lightning discharge probability is high.`;
    impacts.push('High risk of electrical surges and outdoor electrocution hazards.');
    recommendedActions.push('Do NOT seek shelter under isolated trees, metal sheds, or open fields.');
    recommendedActions.push('Unplug sensitive electronics and suspend outdoor farming activities.');
  }

  // 5. Extreme Heatwave check
  else if (categories.heatwave && (temp >= 42 || risks.heat === 'HIGH' || cond.includes('extreme heat') || cond.includes('heatwave'))) {
    shouldTrigger = true;
    severity = temp >= 45 ? 'Extreme' : 'High';
    event = 'Dangerous Extreme Heatwave Warning';
    reasons.push(`Temperature reached ${temp}°C, heat risk ${risks.heat}`);
    description = `Severe thermal radiation with temperatures near ${temp}°C. Dangerous wet-bulb conditions for prolonged exposure.`;
    impacts.push('Rapid onset of heat cramps, exhaustion, and sunstroke during peak noon hours.');
    recommendedActions.push('Avoid direct outdoor exposure between 12:00 PM and 04:00 PM.');
    recommendedActions.push('Consume oral rehydration solutions (ORS), lemon water, and electrolyte fluids.');
  }

  // 6. Dense Fog / Zero Visibility check
  else if (categories.denseFog && (visibility <= 400 || cond.includes('dense fog'))) {
    shouldTrigger = true;
    severity = visibility <= 150 ? 'High' : 'Moderate';
    event = 'Dense Fog & Low Visibility Hazard';
    reasons.push(`Surface visibility dropped to ${visibility}m`);
    description = `Dense radiation fog blanket reduced horizontal visibility to ${visibility} meters in ${loc}.`;
    impacts.push('Severe disruption to expressway traffic, train schedules, and airport operations.');
    recommendedActions.push('Use yellow fog lamps and drive strictly at reduced speeds on expressways.');
    recommendedActions.push('Check airport/train status before heading out.');
  }

  // 7. Check if existing active alert from data matches
  if (!shouldTrigger && weather.activeAlerts && weather.activeAlerts.length > 0) {
    const topAlert = weather.activeAlerts[0];
    const sev = (topAlert.severity || 'Moderate').toLowerCase();
    severity = (sev === 'extreme' ? 'Extreme' : sev === 'high' ? 'High' : 'Moderate');
    event = topAlert.title || 'Meteorological Alert';
    description = topAlert.description;
    impacts.push('Impact on transit, infrastructure, and outdoor activities.');
    recommendedActions.push('Follow local disaster management authority instructions.');
    shouldTrigger = true;
    reasons.push(`Active official weather bulletin: ${topAlert.title}`);
  }

  // Filter based on user's threshold preference
  let meetsThreshold = false;
  if (threshold === 'HIGH_EXTREME') {
    meetsThreshold = severity === 'High' || severity === 'Extreme';
  } else {
    meetsThreshold = severity === 'Moderate' || severity === 'High' || severity === 'Extreme';
  }

  const { fingerprint } = generateAlertFingerprint(loc, event, severity, cooldownHours);

  return {
    shouldAlert: shouldTrigger && meetsThreshold,
    severity,
    event,
    location: loc,
    description: description || `Weather anomaly detected in ${loc}.`,
    impacts: impacts.length > 0 ? impacts : ['Localized disruptions possible.'],
    recommendedActions: recommendedActions.length > 0 ? recommendedActions : ['Stay updated with official bulletins.'],
    timeframe,
    fingerprint,
    reasons
  };
}

// Build WhatsApp text template formatted with markdown
export function formatWhatsAppMessage(alert: {
  severity: 'Moderate' | 'High' | 'Extreme';
  event: string;
  location: string;
  timeframe?: string;
  description: string;
  impacts?: string[];
  recommendedActions?: string[];
}): string {
  const severityEmoji = alert.severity === 'Extreme' ? '🔴' : alert.severity === 'High' ? '🟠' : '🟡';
  const severityBadge = alert.severity.toUpperCase();

  const lines = [
    `⚠️ *WEATHERGPT EARLY WARNING* ⚠️`,
    ``,
    `${severityEmoji} *Risk Level:* ${severityBadge}`,
    `📍 *Location:* ${alert.location}`,
    `⏱️ *Timeframe:* ${alert.timeframe || 'Immediate / Next 3–6 Hours'}`,
    ``,
    `🌪️ *Event:* *${alert.event}*`,
    `📝 *Details:* ${alert.description}`,
    ``
  ];

  if (alert.impacts && alert.impacts.length > 0) {
    lines.push(`⚠️ *Possible Impacts:*`);
    alert.impacts.forEach((imp) => lines.push(`• ${imp}`));
    lines.push(``);
  }

  if (alert.recommendedActions && alert.recommendedActions.length > 0) {
    lines.push(`🛡️ *What To Do (Action Plan):*`);
    alert.recommendedActions.forEach((act) => lines.push(`✓ ${act}`));
    lines.push(``);
  }

  lines.push(`📞 *Helpline:* NDMA 1078 | Emergency 112`);
  lines.push(`_Powered by WeatherGPT AI Meteorological Engine_`);

  return lines.join('\n');
}

// Send WhatsApp alert via Twilio SDK
export async function sendTwilioWhatsAppAlert(params: {
  to: string;
  alert: {
    severity: 'Moderate' | 'High' | 'Extreme';
    event: string;
    location: string;
    timeframe?: string;
    description: string;
    impacts?: string[];
    recommendedActions?: string[];
    fingerprint?: string;
  };
  force?: boolean;
}): Promise<{
  success: boolean;
  configured: boolean;
  sid?: string;
  status?: string;
  suppressed?: boolean;
  reason?: string;
  recipient: string;
  timestamp: string;
  fingerprint: string;
  error?: string;
}> {
  const toWhatsApp = normalizeWhatsAppNumber(params.to);
  const timestamp = new Date().toISOString();

  if (!toWhatsApp || toWhatsApp.length < 10) {
    return {
      success: false,
      configured: false,
      recipient: params.to,
      timestamp,
      fingerprint: '',
      error: 'Invalid recipient phone number. Please include a valid country code (e.g. +91 98765 43210).'
    };
  }

  const { fingerprint } = generateAlertFingerprint(
    params.alert.location,
    params.alert.event,
    params.alert.severity,
    4
  );
  const activeFingerprint = params.alert.fingerprint || fingerprint;

  // Check duplicate fingerprint unless force = true
  if (!params.force && isDuplicateAlert(activeFingerprint, 4)) {
    const logItem: WhatsAppAlertLogItem = {
      id: `suppressed_${Date.now()}`,
      recipient: toWhatsApp,
      location: params.alert.location,
      event: params.alert.event,
      severity: params.alert.severity,
      status: 'suppressed',
      timestamp,
      messageText: formatWhatsAppMessage(params.alert),
      fingerprint: activeFingerprint
    };
    alertHistoryLog.unshift(logItem);
    if (alertHistoryLog.length > 50) alertHistoryLog.pop();

    return {
      success: true,
      configured: true,
      suppressed: true,
      reason: 'Duplicate alert suppressed (within 4-hour cooldown period).',
      recipient: toWhatsApp,
      timestamp,
      fingerprint: activeFingerprint
    };
  }

  const client = getTwilioClient();
  const fromWhatsApp = getTwilioSender();
  const messageBody = formatWhatsAppMessage(params.alert);

  if (!client) {
    const errorMsg =
      'Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Google AI Studio Secrets.';

    const logItem: WhatsAppAlertLogItem = {
      id: `err_${Date.now()}`,
      recipient: toWhatsApp,
      location: params.alert.location,
      event: params.alert.event,
      severity: params.alert.severity,
      status: 'failed',
      timestamp,
      messageText: messageBody,
      fingerprint: activeFingerprint,
      error: errorMsg
    };
    alertHistoryLog.unshift(logItem);
    if (alertHistoryLog.length > 50) alertHistoryLog.pop();

    return {
      success: false,
      configured: false,
      recipient: toWhatsApp,
      timestamp,
      fingerprint: activeFingerprint,
      error: errorMsg
    };
  }

  try {
    const messageOptions: any = {
      from: fromWhatsApp,
      to: toWhatsApp,
      body: messageBody
    };

    // If a Twilio Content SID is provided (for WhatsApp Business Templates), pass it
    if (process.env.TWILIO_CONTENT_SID?.trim()) {
      messageOptions.contentSid = process.env.TWILIO_CONTENT_SID.trim();
    }

    const message = await client.messages.create(messageOptions);

    // Record fingerprint in deduplication cache
    recordAlertFingerprint(activeFingerprint);

    const logItem: WhatsAppAlertLogItem = {
      id: message.sid,
      sid: message.sid,
      recipient: toWhatsApp,
      location: params.alert.location,
      event: params.alert.event,
      severity: params.alert.severity,
      status: 'sent',
      timestamp,
      messageText: messageBody,
      fingerprint: activeFingerprint
    };
    alertHistoryLog.unshift(logItem);
    if (alertHistoryLog.length > 50) alertHistoryLog.pop();

    return {
      success: true,
      configured: true,
      sid: message.sid,
      status: message.status,
      recipient: toWhatsApp,
      timestamp,
      fingerprint: activeFingerprint
    };
  } catch (err: any) {
    console.warn('Twilio WhatsApp API Error:', err?.message || err);

    let helpfulError = err?.message || 'Twilio WhatsApp sending failed.';
    // Handle specific Twilio Sandbox opt-in guidance:
    if (err?.code === 21608 || err?.message?.includes('unregistered') || err?.message?.includes('Sandbox')) {
      helpfulError =
        'WhatsApp Sandbox requires the recipient to send "join <sandbox-keyword>" to the Twilio number first. Please send the join keyword from WhatsApp to activate testing.';
    } else if (err?.code === 20003) {
      helpfulError = 'Twilio authentication failed. Please verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Secrets.';
    }

    const logItem: WhatsAppAlertLogItem = {
      id: `err_${Date.now()}`,
      recipient: toWhatsApp,
      location: params.alert.location,
      event: params.alert.event,
      severity: params.alert.severity,
      status: 'failed',
      timestamp,
      messageText: messageBody,
      fingerprint: activeFingerprint,
      error: helpfulError
    };
    alertHistoryLog.unshift(logItem);
    if (alertHistoryLog.length > 50) alertHistoryLog.pop();

    return {
      success: false,
      configured: true,
      recipient: toWhatsApp,
      timestamp,
      fingerprint: activeFingerprint,
      error: helpfulError
    };
  }
}

// Send a test WhatsApp alert to verify connection
export async function sendTestWhatsAppAlert(recipientPhone: string): Promise<{
  success: boolean;
  configured: boolean;
  sid?: string;
  recipient: string;
  error?: string;
  timestamp: string;
}> {
  const toWhatsApp = normalizeWhatsAppNumber(recipientPhone);
  const timestamp = new Date().toISOString();

  if (!toWhatsApp || toWhatsApp.length < 10) {
    return {
      success: false,
      configured: false,
      recipient: recipientPhone,
      timestamp,
      error: 'Invalid recipient phone number. Provide full international number (e.g., +91 98765 43210).'
    };
  }

  const testAlert = {
    severity: 'High' as const,
    event: 'WeatherGPT WhatsApp Early Alerts Active',
    location: 'Dehradun, Uttarakhand',
    timeframe: 'System Verification Test',
    description: 'This is a live test notification from your WeatherGPT Early Warning System. Your WhatsApp number has been successfully verified to receive automated high-severity weather alerts.',
    impacts: [
      'Automated early warnings will be delivered directly to this WhatsApp chat whenever flash flood, cloudburst, or severe gales are predicted.'
    ],
    recommendedActions: [
      'Save this contact as "WeatherGPT Emergency Alerts" on WhatsApp.',
      'Ensure WhatsApp notifications are set to high priority.'
    ]
  };

  const res = await sendTwilioWhatsAppAlert({
    to: toWhatsApp,
    alert: testAlert,
    force: true // Allow immediate test even if repeated
  });

  return {
    success: res.success,
    configured: res.configured,
    sid: res.sid,
    recipient: toWhatsApp,
    error: res.error,
    timestamp
  };
}

// Get in-memory alert history log
export function getAlertHistory(): WhatsAppAlertLogItem[] {
  return alertHistoryLog;
}

// Clear alert history log
export function clearAlertHistory(): void {
  alertHistoryLog.length = 0;
  alertFingerprints.clear();
}
