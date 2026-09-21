/**
 * Indian Voice Service
 * Provides human-like Indian English and Hindi voice synthesis,
 * smart voice selection (Google, Microsoft Neural, Apple, Android),
 * and markdown-to-speech cleaning to eliminate robotic artifacts.
 */

export interface IndianVoicePersona {
  id: string;
  name: string;
  gender: 'female' | 'male';
  description: string;
  liveVoiceName: 'Kore' | 'Fenrir' | 'Puck' | 'Aoede' | 'Zephyr';
  badge: string;
  rate?: number;
  pitch?: number;
}

export const INDIAN_VOICE_PERSONAS: IndianVoicePersona[] = [
  {
    id: 'aanya',
    name: 'Aanya',
    gender: 'female',
    description: 'Warm, natural Indian female voice with empathetic conversational cadence',
    liveVoiceName: 'Kore',
    badge: 'Most Popular • Natural Warmth',
    rate: 0.94,
    pitch: 1.05
  },
  {
    id: 'kabir',
    name: 'Kabir',
    gender: 'male',
    description: 'Calm, deep Indian male voice with reassuring road advisory tone',
    liveVoiceName: 'Fenrir',
    badge: 'Deep & Reassuring',
    rate: 0.88,
    pitch: 0.88
  },
  {
    id: 'aarav',
    name: 'Aarav',
    gender: 'male',
    description: 'Upbeat, friendly Indian companion voice with energetic rhythm',
    liveVoiceName: 'Puck',
    badge: 'Friendly & Upbeat',
    rate: 0.98,
    pitch: 1.02
  },
  {
    id: 'diya',
    name: 'Diya',
    gender: 'female',
    description: 'Clear, gentle Indian voice ideal for detailed travel forecasts',
    liveVoiceName: 'Aoede',
    badge: 'Clear & Gentle',
    rate: 0.92,
    pitch: 1.12
  },
  {
    id: 'rohan',
    name: 'Rohan',
    gender: 'male',
    description: 'Authoritative meteorologist voice for emergency weather alerts',
    liveVoiceName: 'Zephyr',
    badge: 'Authoritative & Crisp',
    rate: 0.93,
    pitch: 0.94
  },
  {
    id: 'priya',
    name: 'Priya',
    gender: 'female',
    description: 'Sweet, expressive Hindi & Hinglish voice for daily lifestyle updates',
    liveVoiceName: 'Kore',
    badge: 'Expressive & Melodic',
    rate: 0.95,
    pitch: 1.18
  }
];

/**
 * Clean raw text/markdown into natural spoken prose.
 * Eliminates markdown tokens, formatting, and expands weather symbols
 * so the speech engine sounds like a human instead of reading code.
 */
export function cleanTextForNaturalSpeech(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold and italics
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove inline code
    .replace(/`{1,3}.*?`{1,3}/g, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove blockquotes and list symbols
    .replace(/^[>\-\*•]\s+/gm, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Expand weather and numeric symbols
    .replace(/°C/g, ' degrees Celsius')
    .replace(/°F/g, ' degrees Fahrenheit')
    .replace(/(\d+)\s*km\/h/gi, '$1 kilometers per hour')
    .replace(/km\/h/gi, 'kilometers per hour')
    .replace(/(\d+)\s*mm/gi, '$1 millimeters')
    .replace(/hPa/gi, 'hectopascals')
    .replace(/(\d+)\s*%/g, '$1 percent')
    .replace(/AQI\s*(\d+)/gi, 'Air Quality Index $1')
    .replace(/AQI/gi, 'Air Quality Index')
    .replace(/approx\./gi, 'approximately')
    .replace(/min\./gi, 'minutes')
    .replace(/(\d+)\s*-\s*(\d+)/g, '$1 to $2')
    // Clean emojis if they cause speech stutter
    .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')
    // Normalize spacing and newlines
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned;
}

/**
 * Find the best natural Indian voice available in the client browser.
 */
export function getBestIndianVoice(
  preferredGender: 'female' | 'male' = 'female',
  langCode: string = 'hi-IN'
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return null;
  }

  // Priority Indian female voices
  const preferredFemaleVoiceNames = [
    'Microsoft Heera',      // Natural female Indian English (Edge/Windows)
    'Microsoft Neerja',     // Natural female Indian English
    'Microsoft Swara',      // Natural female Hindi
    'Google हिन्दी',        // Natural Google Hindi
    'Google Hindi',
    'Google English (India)',
    'Veena',                // Apple Indian English
    'Lekha',                // Apple Hindi
    'Kavya',
    'Meera',
    'Kajal',
    'hi-in-x-hie-local',
    'hi-in-x-hic-local'
  ];

  // Priority Indian male voices
  const preferredMaleVoiceNames = [
    'Microsoft Madhur',     // Natural male Hindi
    'Microsoft Ravi',       // Natural male Indian English
    'Microsoft Prabhat',    // Natural male Indian English
    'Rishi',                // Apple Indian English
    'Google हिन्दी',
    'Google English (India)',
    'hi-in-x-hia-local'
  ];

  const primarySearchList = preferredGender === 'female' ? preferredFemaleVoiceNames : preferredMaleVoiceNames;
  const secondarySearchList = preferredGender === 'female' ? preferredMaleVoiceNames : preferredFemaleVoiceNames;

  // 1. Search in primary list
  for (const name of primarySearchList) {
    const found = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }

  // 2. Search in secondary list
  for (const name of secondarySearchList) {
    const found = voices.find((v) => v.name.toLowerCase().includes(name.toLowerCase()));
    if (found) return found;
  }

  // 3. Search by language tags (hi-IN, en-IN, ta-IN, etc.)
  const exactLangMatch = voices.find((v) => {
    const vLang = v.lang.toLowerCase().replace('_', '-');
    return vLang === langCode.toLowerCase() || vLang === 'hi-in' || vLang === 'en-in';
  });
  if (exactLangMatch) return exactLangMatch;

  // 4. Any voice containing "India" or "Hindi"
  const anyIndianMatch = voices.find((v) => {
    const lowerName = v.name.toLowerCase();
    const lowerLang = v.lang.toLowerCase();
    return lowerName.includes('india') || lowerName.includes('hindi') || lowerLang.endsWith('-in');
  });
  if (anyIndianMatch) return anyIndianMatch;

  // 5. Fallback to default voice
  return voices.find((v) => v.default) || voices[0] || null;
}

/**
 * Speak text using natural Indian human parameters.
 */
export function speakWithIndianVoice(options: {
  text: string;
  gender?: 'female' | 'male';
  personaId?: string;
  langCode?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const cleanedText = cleanTextForNaturalSpeech(options.text);
  if (!cleanedText) return;

  const persona = options.personaId
    ? INDIAN_VOICE_PERSONAS.find((p) => p.id === options.personaId)
    : null;

  const targetGender = persona ? persona.gender : (options.gender || 'female');

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  const bestVoice = getBestIndianVoice(targetGender, options.langCode || 'hi-IN');

  if (bestVoice) {
    utterance.voice = bestVoice;
    utterance.lang = bestVoice.lang;
  } else {
    utterance.lang = options.langCode || 'hi-IN';
  }

  // Voice pace and pitch tuned per persona
  utterance.rate = options.rate || (persona && persona.rate) || 0.92;
  utterance.pitch = options.pitch || (persona && persona.pitch) || (targetGender === 'female' ? 1.05 : 0.94);

  utterance.onstart = () => {
    if (options.onStart) options.onStart();
  };

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = (e) => {
    if (options.onError) options.onError(e);
    if (options.onEnd) options.onEnd();
  };

  // Prevent garbage collection bug in Chromium
  (window as any)._activeIndianUtterance = utterance;

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any active speech synthesis
 */
export function stopIndianVoice(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
