import { Language } from '../types';

export interface AppTranslations {
  // Navigation & Header
  navHome: string;
  navMap: string;
  navChat: string;
  navNews: string;
  navVoice: string;
  offlineBadge: string;
  liveSync: string;
  selectLanguage: string;
  changeLanguage: string;
  
  // Greeting Section
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  weatherOverview: string;
  aiBriefingBtn: string;
  
  // Main Weather Card
  feelsLike: string;
  humidity: string;
  wind: string;
  rainChance: string;
  airQuality: string;
  nwpModels: string;
  viewDetails: string;
  
  // Weather Conditions
  condClear: string;
  condPartlyCloudy: string;
  condCloudy: string;
  condRain: string;
  condThunderstorm: string;
  condFog: string;
  condExtremeHeat: string;

  // Weather Risk Card
  weatherRisk: string;
  safeToTravel: string;
  cautionAdvised: string;
  highRisk: string;
  explainableAiBtn: string;

  // Your Next Trip Card
  yourNextTrip: string;
  departureWindow: string;
  planNewTrip: string;
  viewRoute: string;

  // Live Map Card
  liveMapTitle: string;
  liveMapSubtitle: string;
  openFullMap: string;

  // Weather Alerts Card
  weatherAlerts: string;
  viewAll: string;
  noAlerts: string;

  // Ask WeatherGPT Card
  askTitle: string;
  askSubtitle: string;
  askPlaceholder: string;
  voiceMic: string;

  // Explore More Section
  exploreTitle: string;
  forecast7Day: string;
  aqiTitle: string;
  rainMap: string;
  farmerMode: string;
  climateAnalytics: string;
  disasterNews: string;

  // AI Chat & Voice
  chatPlaceholder: string;
  voiceListening: string;
  voiceSpeaking: string;
  connectingVoice: string;
}

const DEFAULT_EN: AppTranslations = {
  navHome: 'Home',
  navMap: 'Map',
  navChat: 'Chat',
  navNews: 'Disaster News',
  navVoice: 'Voice',
  offlineBadge: 'OFFLINE',
  liveSync: 'Live IMD Satellite synced',
  selectLanguage: 'Language',
  changeLanguage: 'Change Language',

  greetingMorning: 'Good Morning',
  greetingAfternoon: 'Good Afternoon',
  greetingEvening: 'Good Evening',
  weatherOverview: "Here's your weather overview",
  aiBriefingBtn: 'AI Briefing',

  feelsLike: 'Feels like',
  humidity: 'Humidity',
  wind: 'Wind',
  rainChance: 'Rain Chance',
  airQuality: 'Air Quality',
  nwpModels: 'NWP Models',
  viewDetails: 'Hourly & 7-Day',

  condClear: 'Clear Sky',
  condPartlyCloudy: 'Partly Cloudy',
  condCloudy: 'Overcast & Cloudy',
  condRain: 'Rain / Showers',
  condThunderstorm: 'Thunderstorm & Lightning',
  condFog: 'Fog & Mist',
  condExtremeHeat: 'Extreme Heatwave',

  weatherRisk: 'Weather Risk',
  safeToTravel: 'Safe to Commute',
  cautionAdvised: 'Caution Advised',
  highRisk: 'High Risk Weather',
  explainableAiBtn: 'AI Analysis',

  yourNextTrip: 'Your Next Trip',
  departureWindow: 'Safe Departure Window',
  planNewTrip: 'Plan New Trip',
  viewRoute: 'View Live Route & Radar',

  liveMapTitle: 'LIVE WEATHER MAP',
  liveMapSubtitle: 'Commute intelligence & flood-safe route guidance',
  openFullMap: 'Full Map',

  weatherAlerts: 'Weather Alerts',
  viewAll: 'View All',
  noAlerts: 'No Active Severe Alerts',

  askTitle: 'Ask WeatherGPT',
  askSubtitle: 'AI Assistant',
  askPlaceholder: 'Ask anything about weather, rain, commute...',
  voiceMic: 'Voice Query',

  exploreTitle: 'Explore Meteorological Tools',
  forecast7Day: '7 Day Forecast',
  aqiTitle: 'Air Quality Index',
  rainMap: 'Rain Map',
  farmerMode: 'Farmer Advisory',
  climateAnalytics: 'Climate Analytics',
  disasterNews: 'Disaster News',

  chatPlaceholder: 'Ask WeatherGPT anything...',
  voiceListening: 'Listening to your voice...',
  voiceSpeaking: 'Speaking with Indian Human Voice...',
  connectingVoice: 'Connecting live voice...'
};

export const TRANSLATIONS: Partial<Record<Language, AppTranslations>> = {
  en: DEFAULT_EN,
  hi: {
    navHome: 'होम',
    navMap: 'मैप',
    navChat: 'चैट',
    navNews: 'आपदा समाचार',
    navVoice: 'आवाज़',
    offlineBadge: 'ऑफ़लाइन',
    liveSync: 'लाइव उपग्रह रडार सक्रिय',
    selectLanguage: 'भाषा',
    changeLanguage: 'भाषा बदलें',

    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    weatherOverview: 'यह रहा आपका संपूर्ण मौसम विवरण',
    aiBriefingBtn: 'एआई सारांश',

    feelsLike: 'महसूस',
    humidity: 'आर्द्रता',
    wind: 'हवा',
    rainChance: 'बारिश की संभावना',
    airQuality: 'वायु गुणवत्ता',
    nwpModels: 'मौसम मॉडल',
    viewDetails: 'घंटेवार व 7-दिन',

    condClear: 'साफ आसमान',
    condPartlyCloudy: 'आंशिक रूप से बादल',
    condCloudy: 'घने बादल',
    condRain: 'बारिश / बौछारें',
    condThunderstorm: 'गरज-चमक के साथ तूफान',
    condFog: 'कोहरा व धुंध',
    condExtremeHeat: 'अत्यधिक लू व गर्मी',

    weatherRisk: 'मौसम जोखिम',
    safeToTravel: 'यात्रा के लिए सुरक्षित',
    cautionAdvised: 'सावधानी बरतें',
    highRisk: 'उच्च जोखिम मौसम',
    explainableAiBtn: 'एआई विश्लेषण',

    yourNextTrip: 'आपकी अगली यात्रा',
    departureWindow: 'सुरक्षित प्रस्थान समय',
    planNewTrip: 'नई यात्रा जोड़ें',
    viewRoute: 'लाइव रूट व रडार देखें',

    liveMapTitle: 'लाइव मौसम व रडार मैप',
    liveMapSubtitle: 'जलभराव से सुरक्षित यात्रा मार्गदर्शन',
    openFullMap: 'पूरा मैप',

    weatherAlerts: 'मौसम अलर्ट',
    viewAll: 'सभी देखें',
    noAlerts: 'कोई गंभीर मौसम चेतावनी नहीं',

    askTitle: 'WeatherGPT से पूछें',
    askSubtitle: 'एआई सहायक',
    askPlaceholder: 'मौसम, बारिश, छाता या यात्रा के बारे में पूछें...',
    voiceMic: 'आवाज़ से पूछें',

    exploreTitle: 'मौसम उपकरण व विश्लेषण',
    forecast7Day: '7-दिवसीय पूर्वानुमान',
    aqiTitle: 'वायु गुणवत्ता सूचकांक (AQI)',
    rainMap: 'बारिश मैप',
    farmerMode: 'किसान मौसम सलाह',
    climateAnalytics: 'जलवायु विश्लेषण',
    disasterNews: 'आपदा समाचार व रडार',

    chatPlaceholder: 'WeatherGPT से हिन्दी में कुछ भी पूछें...',
    voiceListening: 'आपकी आवाज़ सुन रहा हूँ...',
    voiceSpeaking: 'सहज भारतीय आवाज़ में बोल रहा हूँ...',
    connectingVoice: 'लाइव आवाज़ से जुड़ रहे हैं...'
  },
  hinglish: {
    navHome: 'Home',
    navMap: 'Live Map',
    navChat: 'AI Chat',
    navNews: 'Disaster News',
    navVoice: 'Voice',
    offlineBadge: 'OFFLINE',
    liveSync: 'Live IMD feed synced',
    selectLanguage: 'Language',
    changeLanguage: 'Language Change Karein',

    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
    weatherOverview: 'Ye raha aapka aaj ka weather update',
    aiBriefingBtn: 'AI Briefing',

    feelsLike: 'Feels like',
    humidity: 'Humidity',
    wind: 'Hawa',
    rainChance: 'Rain Chances',
    airQuality: 'Air Quality (AQI)',
    nwpModels: 'NWP Models',
    viewDetails: 'Hourly & 7-Day Forecast',

    condClear: 'Clear Sky',
    condPartlyCloudy: 'Thode Badal (Partly Cloudy)',
    condCloudy: 'Ghane Badal',
    condRain: 'Baarish (Rain)',
    condThunderstorm: 'Bijli aur Aandhi-Toofan',
    condFog: 'Kohra (Fog)',
    condExtremeHeat: 'Tez Garmi / Heatwave',

    weatherRisk: 'Weather Risk',
    safeToTravel: 'Travel ke liye Safe',
    cautionAdvised: 'Dhyaan se niklein',
    highRisk: 'High Risk Alert',
    explainableAiBtn: 'AI Analysis',

    yourNextTrip: 'Aapki Next Trip',
    departureWindow: 'Safe Leave Window',
    planNewTrip: 'New Trip Plan Karein',
    viewRoute: 'Live Route Check Karein',

    liveMapTitle: 'LIVE WEATHER MAP',
    liveMapSubtitle: 'Waterlogging safe route guidance',
    openFullMap: 'Full Map',

    weatherAlerts: 'Weather Alerts',
    viewAll: 'Sabhi Dekhein',
    noAlerts: 'Koi severe alert nahi hai',

    askTitle: 'Ask WeatherGPT',
    askSubtitle: 'AI Assistant',
    askPlaceholder: 'Baarish, umbrella ya safe time ke baare mein poochein...',
    voiceMic: 'Voice Mic',

    exploreTitle: 'Meteorological Tools',
    forecast7Day: '7-Day Forecast',
    aqiTitle: 'Air Quality (AQI)',
    rainMap: 'Rain Map',
    farmerMode: 'Kisan Salah Mode',
    climateAnalytics: 'Climate Analytics',
    disasterNews: 'Disaster News',

    chatPlaceholder: 'WeatherGPT se Hinglish mein sawaal poochein...',
    voiceListening: 'Aapki awaaz sun raha hoon...',
    voiceSpeaking: 'Natural Indian voice bol rahi hai...',
    connectingVoice: 'Live voice connect ho rahi hai...'
  },
  bn: {
    navHome: 'হোম',
    navMap: 'মানচিত্র',
    navChat: 'চ্যাট',
    navNews: 'দুর্যোগ বার্তা',
    navVoice: 'ভয়েস',
    offlineBadge: 'অফলাইন',
    liveSync: 'লাইভ উপগ্রহ সিঙ্ক সম্পন্ন',
    selectLanguage: 'ভাষা',
    changeLanguage: 'ভাষা পরিবর্তন করুন',

    greetingMorning: 'সুপ্রভাত',
    greetingAfternoon: 'শুভ অপরাহ্ন',
    greetingEvening: 'শুভ সন্ধ্যা',
    weatherOverview: 'এখানে আপনার আবহাওয়ার বিবরণ রয়েছে',
    aiBriefingBtn: 'এআই ব্রিফিং',

    feelsLike: 'অনুভূত',
    humidity: 'আর্দ্রতা',
    wind: 'বাতাসের গতি',
    rainChance: 'বৃষ্টির সম্ভাবনা',
    airQuality: 'বাতাসের মান',
    nwpModels: 'মডেল',
    viewDetails: 'ঘণ্টা ও ৭-দিনের পূর্বাভাস',

    condClear: 'পরিষ্কার আকাশ',
    condPartlyCloudy: 'আংশিক মেঘলা',
    condCloudy: 'মেঘলা আকাশ',
    condRain: 'বৃষ্টিপাত',
    condThunderstorm: 'বজ্রঝড়',
    condFog: 'কুয়াশাচ্ছন্ন',
    condExtremeHeat: 'তীব্র তাপপ্রবাহ',

    weatherRisk: 'আবহাওয়া ঝুঁকি',
    safeToTravel: 'যাতায়াত নিরাপদ',
    cautionAdvised: 'সতর্কতা প্রয়োজন',
    highRisk: 'উচ্চ ঝুঁকিযুক্ত',
    explainableAiBtn: 'এআই বিশ্লেষণ',

    yourNextTrip: 'আপনার পরবর্তী যাত্রা',
    departureWindow: 'নিরাপদ প্রস্থানের সময়',
    planNewTrip: 'নতুন যাত্রা যোগ করুন',
    viewRoute: 'লাইভ রুট দেখুন',

    liveMapTitle: 'লাইভ আবহাওয়া মানচিত্র',
    liveMapSubtitle: 'নিরাপদ যাতায়াত ও রুট গাইডেন্স',
    openFullMap: 'সম্পূর্ণ মানচিত্র',

    weatherAlerts: 'আবহাওয়া সতর্কতা',
    viewAll: 'সব দেখুন',
    noAlerts: 'কোনো গুরুতর সতর্কতা নেই',

    askTitle: 'WeatherGPT-কে জিজ্ঞাসা করুন',
    askSubtitle: 'এআই সহকারী',
    askPlaceholder: 'বৃষ্টি, ছাতা বা আবহাওয়া সম্পর্কে জানুন...',
    voiceMic: 'ভয়েস ইনপুট',

    exploreTitle: 'আবহাওয়া সরঞ্জাম',
    forecast7Day: '৭ দিনের পূর্বাভাস',
    aqiTitle: 'বায়ু মানের সূচক (AQI)',
    rainMap: 'বৃষ্টির মানচিত্র',
    farmerMode: 'কৃষক পরামর্শ',
    climateAnalytics: 'জলবায়ু বিশ্লেষণ',
    disasterNews: 'দুর্যোগ সংবাদ',

    chatPlaceholder: 'বাংলায় যেকোনো আবহাওয়া প্রশ্ন লিখুন...',
    voiceListening: 'আপনার কথা শুনছি...',
    voiceSpeaking: 'স্বাভাবিক ভারতীয় কণ্ঠে উত্তর দেওয়া হচ্ছে...',
    connectingVoice: 'লাইভ ভয়েস সংযোগ করা হচ্ছে...'
  },
  te: {
    navHome: 'హోమ్',
    navMap: 'మ్యాప్',
    navChat: 'చాట్',
    navNews: 'విపత్తు వార్తలు',
    navVoice: 'వాయిస్',
    offlineBadge: 'ఆఫ్‌లైన్',
    liveSync: 'లైవ్ ఉపగ్రహ సమాచారం సిద్ధం',
    selectLanguage: 'భాష',
    changeLanguage: 'భాష మార్చండి',

    greetingMorning: 'శుభోదయం',
    greetingAfternoon: 'శుభ మధ్యాహ్నం',
    greetingEvening: 'శుభ సాయంత్రం',
    weatherOverview: 'ఇది మీ తాజా వాతావరణ సమాచారం',
    aiBriefingBtn: 'AI బ్రీఫింగ్',

    feelsLike: 'అనిపిస్తుంది',
    humidity: 'తేమ',
    wind: 'గాలి వేగం',
    rainChance: 'వర్ష సూచన',
    airQuality: 'గాలి నాణ్యత',
    nwpModels: 'మోడల్స్',
    viewDetails: 'గంటల & 7 రోజుల వివరాలు',

    condClear: 'స్వచ్ఛమైన ఆకాశం',
    condPartlyCloudy: 'పాక్షిక మేఘావృతం',
    condCloudy: 'పూర్తి మేఘావృతం',
    condRain: 'వర్షం',
    condThunderstorm: 'ఉరుములు, మెరుపులతో వర్షం',
    condFog: 'పొగమంచు',
    condExtremeHeat: 'తీవ్ర ఎండలు',

    weatherRisk: 'వాతావరణ ప్రమాదం',
    safeToTravel: 'ప్రయాణానికి సురక్షితం',
    cautionAdvised: 'జాగ్రత్త అవసరం',
    highRisk: 'అధిక ప్రమాదం',
    explainableAiBtn: 'AI విశ్లేషణ',

    yourNextTrip: 'మీ తదుపరి ప్రయాణం',
    departureWindow: 'సురక్షిత ప్రయాణ సమయం',
    planNewTrip: 'కొత్త ప్రయాణం చేర్చండి',
    viewRoute: 'లైవ్ రూట్ చూడండి',

    liveMapTitle: 'లైవ్ వాతావరణ మ్యాప్',
    liveMapSubtitle: 'సురక్షిత ప్రయాణ మార్గదర్శకత్వం',
    openFullMap: 'పూర్తి మ్యాప్',

    weatherAlerts: 'వాతావరణ హెచ్చరికలు',
    viewAll: 'అన్నీ చూడండి',
    noAlerts: 'తీవ్రమైన హెచ్చరికలు లేవు',

    askTitle: 'WeatherGPT ని అడగండి',
    askSubtitle: 'AI అసిస్టెంట్',
    askPlaceholder: 'వర్షం, ప్రయాణ సమయం గురించి అడగండి...',
    voiceMic: 'వాయిస్ ద్వారా',

    exploreTitle: 'వాతావరణ సాధనాలు',
    forecast7Day: '7 రోజుల సూచన',
    aqiTitle: 'గాలి నాణ్యత సూచిక (AQI)',
    rainMap: 'వర్ష మ్యాప్',
    farmerMode: 'రైతు సలహా',
    climateAnalytics: 'వాతావరణ విశ్లేషణ',
    disasterNews: 'విపత్తు సమాచారం',

    chatPlaceholder: 'తెలుగులో ఏదైనా వాతావరణ ప్రశ్న అడగండి...',
    voiceListening: 'మీ మాట వింటున్నాను...',
    voiceSpeaking: 'భారతీయ మానవ స్వరంతో మాట్లాడుతోంది...',
    connectingVoice: 'లైవ్ వాయిస్ కనెక్ట్ అవుతోంది...'
  },
  ta: {
    navHome: 'முகப்பு',
    navMap: 'வரைபடம்',
    navChat: 'உரையாடல்',
    navNews: 'பேரிடர் செய்தி',
    navVoice: 'குரல்',
    offlineBadge: 'ஆஃப்லைன்',
    liveSync: 'செயற்கைக்கோள் தரவு தயார்',
    selectLanguage: 'மொழி',
    changeLanguage: 'மொழியை மாற்றுக',

    greetingMorning: 'காலை வணக்கம்',
    greetingAfternoon: 'மதிய வணக்கம்',
    greetingEvening: 'மாலை வணக்கம்',
    weatherOverview: 'உங்கள் வானிலை கண்ணோட்டம்',
    aiBriefingBtn: 'AI சுருக்கம்',

    feelsLike: 'உணர்கிறது',
    humidity: 'ஈரப்பதம்',
    wind: 'காற்று வேகம்',
    rainChance: 'மழை வாய்ப்பு',
    airQuality: 'காற்று தரம்',
    nwpModels: 'வானிலை மாதிரி',
    viewDetails: 'மணிநேர & 7-நாள் விவரம்',

    condClear: 'தெளிவான வானம்',
    condPartlyCloudy: 'பகுதி மேகமூட்டம்',
    condCloudy: 'மேகமூட்டம்',
    condRain: 'மழைப்பொழிவு',
    condThunderstorm: 'இடியுடன் கூடிய மழை',
    condFog: 'பனிமூட்டம்',
    condExtremeHeat: 'கடும் வெப்ப அலை',

    weatherRisk: 'வானிலை ஆபத்து',
    safeToTravel: 'பயணத்திற்குப் பாதுகாப்பானது',
    cautionAdvised: 'எச்சரிக்கை தேவை',
    highRisk: 'அதிக ஆபத்து',
    explainableAiBtn: 'AI பகுப்பாய்வு',

    yourNextTrip: 'உங்கள் அடுத்த பயணம்',
    departureWindow: 'பாதுகாப்பான புறப்படும் நேரம்',
    planNewTrip: 'புதிய பயணம்',
    viewRoute: 'நேரலை வழி காண்க',

    liveMapTitle: 'நேரலை வானிலை வரைபடம்',
    liveMapSubtitle: 'வெள்ளம் இல்லாத பாதுகாப்பான வழி',
    openFullMap: 'முழு வரைபடம்',

    weatherAlerts: 'வானிலை எச்சரிக்கைகள்',
    viewAll: 'அனைத்தும்',
    noAlerts: 'எச்சரிக்கைகள் இல்லை',

    askTitle: 'WeatherGPT-யிடம் கேட்கவும்',
    askSubtitle: 'AI உதவியாளர்',
    askPlaceholder: 'மழை, பயண நேரம் பற்றி தமிழில் கேளுங்கள்...',
    voiceMic: 'குரல் உள்ளீடு',

    exploreTitle: 'வானிலை கருவிகள்',
    forecast7Day: '7 நாள் முன்னறிவிப்பு',
    aqiTitle: 'காற்று தரக் குறியீடு (AQI)',
    rainMap: 'மழை வரைபடம்',
    farmerMode: 'விவசாய ஆலோசனை',
    climateAnalytics: 'காலநிலை ஆய்வு',
    disasterNews: 'பேரிடர் செய்தி',

    chatPlaceholder: 'தமிழில் வானிலை கேள்விகளைக் கேளுங்கள்...',
    voiceListening: 'கேட்கிறது...',
    voiceSpeaking: 'இயற்கையான குரலில் பேசுகிறது...',
    connectingVoice: 'இணைக்கப்படுகிறது...'
  },
  mr: {
    navHome: 'होम',
    navMap: 'नकाशा',
    navChat: 'चॅट',
    navNews: 'आपत्ती वार्ता',
    navVoice: 'आवाज',
    offlineBadge: 'ऑफलाइन',
    liveSync: 'थेट सॅटेलाइट अपडेट सक्रिय',
    selectLanguage: 'भाषा',
    changeLanguage: 'भाषा बदला',

    greetingMorning: 'शुभ सकाळ',
    greetingAfternoon: 'शुभ दुपार',
    greetingEvening: 'शुभ संध्याकाळ',
    weatherOverview: 'आजचा हवामान आढावा',
    aiBriefingBtn: 'AI सारांश',

    feelsLike: 'जाणवते',
    humidity: 'आर्द्रता',
    wind: 'वाऱ्याचा वेग',
    rainChance: 'पावसाची शक्यता',
    airQuality: 'हवेची गुणवत्ता',
    nwpModels: 'हवामान मॉडेल्स',
    viewDetails: 'तासनिहाय व ७ दिवसांचे',

    condClear: 'निरभ्र आकाश',
    condPartlyCloudy: 'अंशतः ढगाळ',
    condCloudy: 'ढगाळ वातावरण',
    condRain: 'पाऊस',
    condThunderstorm: 'वादळी पाऊस व वीज',
    condFog: 'धुके',
    condExtremeHeat: 'तीव्र उष्णता लाट',

    weatherRisk: 'हवामान जोखीम',
    safeToTravel: 'प्रवासासाठी सुरक्षित',
    cautionAdvised: 'काळजी घ्या',
    highRisk: 'धोकादायक हवामान',
    explainableAiBtn: 'AI विश्लेषण',

    yourNextTrip: 'तुमचा पुढील प्रवास',
    departureWindow: 'सुरक्षित निघण्याची वेळ',
    planNewTrip: 'नवीन प्रवास जोडा',
    viewRoute: 'थेट मार्ग व रडार पहा',

    liveMapTitle: 'थेट हवामान नकाशा',
    liveMapSubtitle: 'पाणी साचण्यापासून सुरक्षित मार्ग',
    openFullMap: 'पूर्ण नकाशा',

    weatherAlerts: 'हवामान सूचना',
    viewAll: 'सर्व पहा',
    noAlerts: 'गंभीर सूचना नाही',

    askTitle: 'WeatherGPT ला विचारा',
    askSubtitle: 'AI सहाय्यक',
    askPlaceholder: 'पाऊस, छत्री, प्रवासाविषयी विचारा...',
    voiceMic: 'आवाज इनपुट',

    exploreTitle: 'हवामान साधने',
    forecast7Day: '७ दिवसांचा अंदाज',
    aqiTitle: 'हवा गुणवत्ता निर्देशांक (AQI)',
    rainMap: 'पाऊस नकाशा',
    farmerMode: 'शेतकरी सल्लागार',
    climateAnalytics: 'हवामान विश्लेषण',
    disasterNews: 'आपत्ती वृत्त',

    chatPlaceholder: 'मराठीत हवामानाविषयी काहीही विचारा...',
    voiceListening: 'ऐकत आहे...',
    voiceSpeaking: 'नैसर्गिक भारतीय आवाजात बोलत आहे...',
    connectingVoice: 'थेट आवाज जोडत आहे...'
  },
  gu: {
    navHome: 'હોમ',
    navMap: 'નકશો',
    navChat: 'ચેટ',
    navNews: 'આપત્તિ સમાચાર',
    navVoice: 'અવાજ',
    offlineBadge: 'ઑફલાઇન',
    liveSync: 'લાઈવ ઉપગ્રહ ડેટા સક્રિય',
    selectLanguage: 'ભાષા',
    changeLanguage: 'ભાષા બદલો',

    greetingMorning: 'શુભ સવાર',
    greetingAfternoon: 'શુભ બપોર',
    greetingEvening: 'શુભ સાંજ',
    weatherOverview: 'તમારો હવામાન અહેવાલ',
    aiBriefingBtn: 'AI બ્રીફિંગ',

    feelsLike: 'અનુભવાય છે',
    humidity: 'ભેજ',
    wind: 'પવનની ગતિ',
    rainChance: 'વરસાદની શક્યતા',
    airQuality: 'હવાની ગુણવત્તા',
    nwpModels: 'હવામાન મૉડેલ',
    viewDetails: 'કલાકદીઠ અને ૭ દિવસ',

    condClear: 'સ્વચ્છ આકાશ',
    condPartlyCloudy: 'અંશતઃ વાદળછાયું',
    condCloudy: 'વાદળછાયું',
    condRain: 'વરસાદ',
    condThunderstorm: 'ગાજવીજ સાથે વરસાદ',
    condFog: 'ધુમ્મસ',
    condExtremeHeat: 'તીવ્ર હીટવેવ',

    weatherRisk: 'હવામાન જોખમ',
    safeToTravel: 'મુસાફરી માટે સલામત',
    cautionAdvised: 'સાવચેતી જરૂરી',
    highRisk: 'ઉચ્ચ જોખમ',
    explainableAiBtn: 'AI વિશ્લેષણ',

    yourNextTrip: 'તમારી આગામી યાત્રા',
    departureWindow: 'સલામત પ્રસ્થાન સમય',
    planNewTrip: 'નવી યાત્રા ઉમેરો',
    viewRoute: 'લાઈવ રૂટ જુઓ',

    liveMapTitle: 'લાઈવ હવામાન નકશો',
    liveMapSubtitle: 'પાણી ભરાવાથી મુક્ત સલામત માર્ગદર્શન',
    openFullMap: 'સંપૂર્ણ નકશો',

    weatherAlerts: 'હવામાન ચેતવણી',
    viewAll: 'બધું જુઓ',
    noAlerts: 'કોઈ ગંભીર ચેતવણી નથી',

    askTitle: 'WeatherGPT ને પૂછો',
    askSubtitle: 'AI સહાયક',
    askPlaceholder: 'વરસાદ, છત્રી કે મુસાફરી અંગે પૂછો...',
    voiceMic: 'અવાજથી પૂછો',

    exploreTitle: 'હવામાન સાધનો',
    forecast7Day: '૭ દિવસની આગાહી',
    aqiTitle: 'હવા ગુણવત્તા આંક (AQI)',
    rainMap: 'વરસાદ નકશો',
    farmerMode: 'ખેડૂત સલાહ',
    climateAnalytics: 'આબોહવા વિશ્લેષણ',
    disasterNews: 'આપત્તિ સમાચાર',

    chatPlaceholder: 'ગુજરાતીમાં હવામાન વિશે પ્રશ્ન પૂછો...',
    voiceListening: 'સાંભળી રહ્યું છે...',
    voiceSpeaking: 'કુદરતી ભારતીય અવાજમાં બોલે છે...',
    connectingVoice: 'જોડાઈ રહ્યું છે...'
  },
  kn: {
    navHome: 'ಮುಖಪುಟ',
    navMap: 'ನಕ್ಷೆ',
    navChat: 'ಚಾಟ್',
    navNews: 'ವಿಪತ್ತು ಸುದ್ದಿ',
    navVoice: 'ಧ್ವನಿ',
    offlineBadge: 'ಆಫ್‌ಲೈನ್',
    liveSync: 'ಲೈವ್ ಉಪಗ್ರಹ ಸಿಂಕ್ ಸಕ್ರಿಯ',
    selectLanguage: 'ಭಾಷೆ',
    changeLanguage: 'ಭಾಷೆ ಬದಲಾಯಿಸಿ',

    greetingMorning: 'ಶುಭೋದಯ',
    greetingAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    greetingEvening: 'ಶುಭ ಸಂಜೆ',
    weatherOverview: 'ಇಂದಿನ ಹವಾಮಾನ ವಿವರಣೆ',
    aiBriefingBtn: 'AI ಬ್ರೀಫಿಂಗ್',

    feelsLike: 'ಅನಿಸುತ್ತದೆ',
    humidity: 'ತೇವಾಂಶ',
    wind: 'ಗಾಳಿಯ ವೇಗ',
    rainChance: 'ಮಳೆಯ ಸಾಧ್ಯತೆ',
    airQuality: 'ಗಾಳಿಯ ಗುಣಮಟ್ಟ',
    nwpModels: 'ಹವಾಮಾನ ಮಾದರಿ',
    viewDetails: 'ಗಂಟೆವಾರು ಮತ್ತು 7 ದಿನಗಳ ಮಾಹಿತಿ',

    condClear: 'ಸ್ವಚ್ಛ ಆಕಾಶ',
    condPartlyCloudy: 'ಭಾಗಶಃ ಮೋಡ',
    condCloudy: 'ಮೋಡ ಕವಿದ ವಾತಾವರಣ',
    condRain: 'ಮಳೆ',
    condThunderstorm: 'ಗುಡುಗು ಸಹಿತ ಮಳೆ',
    condFog: 'ಮಂಜು',
    condExtremeHeat: 'ತೀವ್ರ ಶಾಖದ ಅಲೆ',

    weatherRisk: 'ಹವಾಮಾನ ಅಪಾಯ',
    safeToTravel: 'ಪ್ರಯಾಣಕ್ಕೆ ಸುರಕ್ಷಿತ',
    cautionAdvised: 'ಎಚ್ಚರಿಕೆ ಅಗತ್ಯ',
    highRisk: 'ಹೆಚ್ಚಿನ ಅಪಾಯ',
    explainableAiBtn: 'AI ವಿಶ್ಲೇಷಣೆ',

    yourNextTrip: 'ನಿಮ್ಮ ಮುಂದಿನ ಪ್ರಯಾಣ',
    departureWindow: 'ಸುರಕ್ಷಿತ ನಿರ್ಗಮನ ಸಮಯ',
    planNewTrip: 'ಹೊಸ ಪ್ರಯಾಣ ಸೇರಿಸಿ',
    viewRoute: 'ಲೈವ್ ರೂಟ್ ವೀಕ್ಷಿಸಿ',

    liveMapTitle: 'ಲೈವ್ ಹವಾಮಾನ ನಕ್ಷೆ',
    liveMapSubtitle: 'ನೀರು ನಿಲ್ಲದ ಸುರಕ್ಷಿತ ಮಾರ್ಗದರ್ಶನ',
    openFullMap: 'ಪೂರ್ಣ ನಕ್ಷೆ',

    weatherAlerts: 'ಹವಾಮಾನ ಎಚ್ಚರಿಕೆಗಳು',
    viewAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    noAlerts: 'ಯಾವುದೇ ತೀವ್ರ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ',

    askTitle: 'WeatherGPT ಗೆ ಕೇಳಿ',
    askSubtitle: 'AI ಸಹಾಯಕ',
    askPlaceholder: 'ಮಳೆ, ಛತ್ರಿ ಅಥವಾ ಪ್ರಯಾಣದ ಬಗ್ಗೆ ಕೇಳಿ...',
    voiceMic: 'ಧ್ವನಿ ಇನ್‌ಪುಟ್',

    exploreTitle: 'ಹವಾಮಾನ ಉಪಕರಣಗಳು',
    forecast7Day: '7 ದಿನಗಳ ಮುನ್ಸೂಚನೆ',
    aqiTitle: 'ವಾಯು ಗುಣಮಟ್ಟ ಸೂಚ್ಯಂಕ (AQI)',
    rainMap: 'ಮಳೆ ನಕ್ಷೆ',
    farmerMode: 'ರೈತ ಸಲಹೆ',
    climateAnalytics: 'ಹವಾಮಾನ ವಿಶ್ಲೇಷಣೆ',
    disasterNews: 'ವಿಪತ್ತು ಸುದ್ದಿ',

    chatPlaceholder: 'ಕನ್ನಡದಲ್ಲಿ ಹವಾಮಾನ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ...',
    voiceListening: 'ಕೇಳಿಸಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ...',
    voiceSpeaking: 'ಸ್ವಾಭಾವಿಕ ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡುತ್ತಿದೆ...',
    connectingVoice: 'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...'
  },
  ml: {
    navHome: 'ഹോം',
    navMap: 'മാപ്പ്',
    navChat: 'ചാറ്റ്',
    navNews: 'ദുരന്ത വാർത്തകൾ',
    navVoice: 'വോയ്‌സ്',
    offlineBadge: 'ഓഫ്‌ലൈൻ',
    liveSync: 'ലൈവ് ഉപഗ്രഹ വിവരങ്ങൾ ലഭ്യമാണ്',
    selectLanguage: 'ഭാഷ',
    changeLanguage: 'ഭാഷ മാറ്റുക',

    greetingMorning: 'സുപ്രഭാതം',
    greetingAfternoon: 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
    greetingEvening: 'ശുഭ സന്ധ്യ',
    weatherOverview: 'ഇന്നത്തെ കാലാവസ്ഥാ അവലോകനം',
    aiBriefingBtn: 'AI ബ്രീഫിംഗ്',

    feelsLike: 'അനുഭവപ്പെടുന്നത്',
    humidity: 'ഈർപ്പം',
    wind: 'കാറ്റിന്റെ വേഗത',
    rainChance: 'മഴ സാധ്യത',
    airQuality: 'വായു ഗുണനിലവാരം',
    nwpModels: 'കാലാവസ്ഥ മോഡലുകൾ',
    viewDetails: 'മണിക്കൂർ & 7 ദിവസ വിവരങ്ങൾ',

    condClear: 'തെളിഞ്ഞ ആകാശം',
    condPartlyCloudy: 'ഭാഗികമായി മേഘാവൃതം',
    condCloudy: 'മേഘാവൃതം',
    condRain: 'മഴ',
    condThunderstorm: 'ഇടിമിന്നലോടുകൂടിയ മഴ',
    condFog: 'മൂടൽമഞ്ഞ്',
    condExtremeHeat: 'കഠിനമായ ഉഷ്ണതരംഗം',

    weatherRisk: 'കാലാവസ്ഥാ അപകടസാധ്യത',
    safeToTravel: 'യാത്രയ്ക്ക് സുരക്ഷിതം',
    cautionAdvised: 'ജാഗ്രത പാലിക്കുക',
    highRisk: 'ഉയർന്ന അപകടസാധ്യത',
    explainableAiBtn: 'AI വിശകലനം',

    yourNextTrip: 'നിങ്ങളുടെ അടുത്ത യാത്ര',
    departureWindow: 'സുരക്ഷിത പുറപ്പെടൽ സമയം',
    planNewTrip: 'പുതിയ യാത്ര ആസൂത്രണം ചെയ്യുക',
    viewRoute: 'റൂട്ട് കാണുക',

    liveMapTitle: 'ലൈവ് കാലാവസ്ഥ മാപ്പ്',
    liveMapSubtitle: 'സുരക്ഷിത റൂട്ട് മാർഗ്ഗനിർദ്ദേശം',
    openFullMap: 'പൂർണ്ണ മാപ്പ്',

    weatherAlerts: 'കാലാവസ്ഥ മുന്നറിയിപ്പുകൾ',
    viewAll: 'എല്ലാം കാണുക',
    noAlerts: 'മുന്നറിയിപ്പുകളൊന്നുമില്ല',

    askTitle: 'WeatherGPT-യോട് ചോദിക്കുക',
    askSubtitle: 'AI അസിസ്റ്റന്റ്',
    askPlaceholder: 'മഴ, യാത്രാ സമയം എന്നിവ ചോദിക്കൂ...',
    voiceMic: 'വോയ്‌സ് ഇൻപുട്ട്',

    exploreTitle: 'കാലാവസ്ഥ ഉപകരണങ്ങൾ',
    forecast7Day: '7 ദിവസത്തെ പ്രവചനം',
    aqiTitle: 'വായു ഗുണനിലവാര സൂചിക (AQI)',
    rainMap: 'മഴ മാപ്പ്',
    farmerMode: 'കർഷക ഉപദേശം',
    climateAnalytics: 'കാലാവസ്ഥാ പഠനം',
    disasterNews: 'ദുരന്ത വിവരങ്ങൾ',

    chatPlaceholder: 'മലയാളത്തിൽ ചോദിക്കൂ...',
    voiceListening: 'കേൾക്കുന്നു...',
    voiceSpeaking: 'സംസാരിക്കുന്നു...',
    connectingVoice: 'കണക്റ്റ് ചെയ്യുന്നു...'
  },
  pa: {
    navHome: 'ਹੋਮ',
    navMap: 'ਮੈਪ',
    navChat: 'ਚੈਟ',
    navNews: 'ਆਫ਼ਤ ਖ਼ਬਰਾਂ',
    navVoice: 'ਆਵਾਜ਼',
    offlineBadge: 'ਔਫਲਾਈਨ',
    liveSync: 'ਲਾਈਵ ਸੈਟੇਲਾਈਟ ਡਾਟਾ ਸਰਗਰਮ',
    selectLanguage: 'ਭਾਸ਼ਾ',
    changeLanguage: 'ਭਾਸ਼ਾ ਬਦਲੋ',

    greetingMorning: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ / ਗੁੱਡ ਮੌਰਨਿੰਗ',
    greetingAfternoon: 'ਸ਼ੁਭ ਦੁਪਹਿਰ',
    greetingEvening: 'ਸ਼ੁਭ ਸ਼ਾਮ',
    weatherOverview: 'ਅੱਜ ਦਾ ਮੌਸਮ ਵੇਰਵਾ',
    aiBriefingBtn: 'AI ਬ੍ਰੀਫਿੰਗ',

    feelsLike: 'ਮਹਿਸੂਸ ਹੁੰਦਾ ਹੈ',
    humidity: 'ਨਮੀ',
    wind: 'ਹਵਾ ਦੀ ਗਤੀ',
    rainChance: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ',
    airQuality: 'ਹਵਾ ਦੀ ਗੁਣਵੱਤਾ (AQI)',
    nwpModels: 'ਮੌਸਮ ਮਾਡਲ',
    viewDetails: 'ਘੰਟੇਵਾਰ ਅਤੇ 7-ਦਿਨ',

    condClear: 'ਸਾਫ਼ ਅਸਮਾਨ',
    condPartlyCloudy: 'ਅੰਸ਼ਕ ਬੱਦਲਵਾਈ',
    condCloudy: 'ਬੱਦਲਵਾਈ',
    condRain: 'ਮੀਂਹ',
    condThunderstorm: 'ਗਰਜ-ਚਮਕ ਨਾਲ ਤੂਫ਼ਾਨ',
    condFog: 'ਧੁੰਦ',
    condExtremeHeat: 'ਬਹੁਤ ਜ਼ਿਆਦਾ ਗਰਮੀ',

    weatherRisk: 'ਮੌਸਮ ਦਾ ਖਤਰਾ',
    safeToTravel: 'ਸਫ਼ਰ ਲਈ ਸੁਰੱਖਿਅਤ',
    cautionAdvised: 'ਸਾਵਧਾਨੀ ਵਰਤੋ',
    highRisk: 'ਵੱਡਾ ਖਤਰਾ',
    explainableAiBtn: 'AI ਵਿਸ਼ਲੇਸ਼ਣ',

    yourNextTrip: 'ਤੁਹਾਡਾ ਅਗਲਾ ਸਫ਼ਰ',
    departureWindow: 'ਸੁਰੱਖਿਅਤ ਰਵਾਨਗੀ ਸਮਾਂ',
    planNewTrip: 'ਨਵਾਂ ਸਫ਼ਰ ਸ਼ਾਮਲ ਕਰੋ',
    viewRoute: 'ਲਾਈਵ ਰੂਟ ਵੇਖੋ',

    liveMapTitle: 'ਲਾਈਵ ਮੌਸਮ ਨਕਸ਼ਾ',
    liveMapSubtitle: 'ਪਾਣੀ ਭਰਨ ਤੋਂ ਬਚਾਅ ਸਹਿਤ ਰਸਤਾ',
    openFullMap: 'ਪੂਰਾ ਨਕਸ਼ਾ',

    weatherAlerts: 'ਮੌਸਮ ਚੇਤਾਵਨੀਆਂ',
    viewAll: 'ਸਾਰੇ ਵੇਖੋ',
    noAlerts: 'ਕੋਈ ਗੰਭੀਰ ਚੇਤਾਵਨੀ ਨਹੀਂ',

    askTitle: 'WeatherGPT ਨੂੰ ਪੁੱਛੋ',
    askSubtitle: 'AI ਸਹਾਇਕ',
    askPlaceholder: 'ਮੀਂਹ, ਛਤਰੀ ਜਾਂ ਸਫ਼ਰ ਬਾਰੇ ਪੁੱਛੋ...',
    voiceMic: 'ਆਵਾਜ਼ ਰਾਹੀਂ ਪੁੱਛੋ',

    exploreTitle: 'ਮੌਸਮ ਸੰਦ',
    forecast7Day: '7 ਦਿਨਾਂ ਦੀ ਭਵਿੱਖਬਾਣੀ',
    aqiTitle: 'ਹਵਾ ਗੁਣਵੱਤਾ ਸੂਚਕਾਂਕ',
    rainMap: 'ਮੀਂਹ ਦਾ ਨਕਸ਼ਾ',
    farmerMode: 'ਕਿਸਾਨ ਸਲਾਹ',
    climateAnalytics: 'ਜਲਵਾਯੂ ਵਿਸ਼ਲੇਸ਼ਣ',
    disasterNews: 'ਆਫ਼ਤ ਖ਼ਬਰਾਂ',

    chatPlaceholder: 'ਪੰਜਾਬੀ ਵਿੱਚ ਮੌਸਮ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ...',
    voiceListening: 'ਸੁਣ ਰਿਹਾ ਹੈ...',
    voiceSpeaking: 'ਬੋਲ ਰਿਹਾ ਹੈ...',
    connectingVoice: 'ਜੁੜ ਰਿਹਾ ਹੈ...'
  },
  ur: {
    navHome: 'ہوم',
    navMap: 'نقشہ',
    navChat: 'چیٹ',
    navNews: 'آفات کی خبریں',
    navVoice: 'آواز',
    offlineBadge: 'آف لائن',
    liveSync: 'لائیو سیٹلائٹ ڈیٹا فعال ہے',
    selectLanguage: 'زبان',
    changeLanguage: 'زبان تبدیل کریں',

    greetingMorning: 'صبح بخیر',
    greetingAfternoon: 'دوپہر بخیر',
    greetingEvening: 'شام بخیر',
    weatherOverview: 'آپ کی موسم کی تازہ رپورٹ',
    aiBriefingBtn: 'AI بریفنگ',

    feelsLike: 'محسوس ہوتا ہے',
    humidity: 'نمی',
    wind: 'ہوا کی رفتار',
    rainChance: 'بارش کے امکانات',
    airQuality: 'ہوا کا معیار (AQI)',
    nwpModels: 'موسمی ماڈلز',
    viewDetails: 'گھنٹہ وار اور 7 روزہ تفصیل',

    condClear: 'صاف آسمان',
    condPartlyCloudy: 'جزوی ابر آلود',
    condCloudy: 'ابر آلود',
    condRain: 'بارش',
    condThunderstorm: 'گرج چمک کے ساتھ طوفان',
    condFog: 'دھند',
    condExtremeHeat: 'شدید گرمی کی لہر',

    weatherRisk: 'موسمی خطرہ',
    safeToTravel: 'سفر کے لیے محفوظ',
    cautionAdvised: 'احتیاط برتیں',
    highRisk: 'شدید خطرہ',
    explainableAiBtn: 'AI تجزیہ',

    yourNextTrip: 'آپ کا اگلا سفر',
    departureWindow: 'محفوظ روانگی کا وقت',
    planNewTrip: 'نیا سفر شامل کریں',
    viewRoute: 'لائیو راستہ دیکھیں',

    liveMapTitle: 'لائیو موسم کا نقشہ',
    liveMapSubtitle: 'محفوظ اور آسان سفری رہنمائی',
    openFullMap: 'مکمل نقشہ',

    weatherAlerts: 'موسمی انتباہات',
    viewAll: 'سب دیکھیں',
    noAlerts: 'کوئی ہنگامی انتباہ نہیں',

    askTitle: 'WeatherGPT سے پوچھیں',
    askSubtitle: 'AI معاون',
    askPlaceholder: 'بارش، چھتری یا سفر سے متعلق پوچھیں...',
    voiceMic: 'آواز سے پوچھیں',

    exploreTitle: 'موسمیاتی آلات',
    forecast7Day: '7 روزہ پیش گوئی',
    aqiTitle: 'ہوا کا معیار (AQI)',
    rainMap: 'بارش کا نقشہ',
    farmerMode: 'کسان مشورہ',
    climateAnalytics: 'ماحولیاتی تجزیہ',
    disasterNews: 'آفات کی خبریں',

    chatPlaceholder: 'اردو میں موسم کا کوئی بھی سوال پوچھیں...',
    voiceListening: 'سن رہا ہے...',
    voiceSpeaking: 'بول رہا ہے...',
    connectingVoice: 'رابطہ ہو رہا ہے...'
  }
};

/**
 * Helper to safely retrieve translated strings with fallback hierarchy:
 * lang -> hindi (for Indian scripts if missing) -> english
 */
export function getTranslation(lang?: Language | string): AppTranslations {
  if (!lang) return DEFAULT_EN;
  const custom = TRANSLATIONS[lang as Language];
  if (custom) return { ...DEFAULT_EN, ...custom };
  
  // If not explicitly defined in map, check Hindi or English
  if (lang === 'hinglish' && TRANSLATIONS.hinglish) {
    return { ...DEFAULT_EN, ...TRANSLATIONS.hinglish };
  }
  return DEFAULT_EN;
}

export function translateCondition(condition: string, lang?: Language | string): string {
  const t = getTranslation(lang);
  const cLower = (condition || '').toLowerCase();
  if (cLower.includes('thunder') || cLower.includes('storm')) return t.condThunderstorm;
  if (cLower.includes('rain') || cLower.includes('drizzle') || cLower.includes('shower')) return t.condRain;
  if (cLower.includes('partly') || cLower.includes('scattered')) return t.condPartlyCloudy;
  if (cLower.includes('cloud') || cLower.includes('overcast')) return t.condCloudy;
  if (cLower.includes('fog') || cLower.includes('mist') || cLower.includes('haze')) return t.condFog;
  if (cLower.includes('heat') || cLower.includes('hot')) return t.condExtremeHeat;
  if (cLower.includes('clear') || cLower.includes('sun')) return t.condClear;
  return condition;
}
