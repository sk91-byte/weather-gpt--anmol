import { Language } from '../types';

export interface LanguageInfo {
  id: Language;
  name: string;
  nativeName: string;
  shortCode: string;
  region: string;
  speechCode: string;
  isPopular?: boolean;
  description?: string;
  welcomeMessage: string;
  sampleQueries: string[];
  suggestions: {
    rain: string;
    commute: string;
    farmer: string;
    umbrella: string;
  };
  samplePreview: (city: string) => string;
}

export const INDIAN_LANGUAGES: LanguageInfo[] = [
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    shortCode: 'HI',
    region: 'North & Central India (Official)',
    speechCode: 'hi-IN',
    welcomeMessage: 'नमस्ते! मैं WeatherGPT हूँ। मैं केवल मौसम नहीं बताता, बल्कि यह समझाता हूँ कि आपको क्या सावधानी रखनी चाहिए। आज आप क्या जानना चाहते हैं?',
    sampleQueries: [
      'क्या आज बारिश होगी?',
      'क्या बाहर निकलते समय छाता ले जाना चाहिए?',
      'क्या आज फसलों में सिंचाई करना सुरक्षित है?'
    ],
    suggestions: {
      rain: 'क्या आज बारिश होगी?',
      commute: 'क्या बाहर जाना सुरक्षित है?',
      farmer: 'क्या आज फसलों की सिंचाई करूँ?',
      umbrella: 'क्या छाता ले जाना चाहिए?'
    },
    samplePreview: (city) => `🌤️ "आज ${city} में बादल छाए रहेंगे, तापमान 28°C रहेगा। शाम को बारिश की संभावना है।"`
  },
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    shortCode: 'EN',
    region: 'Pan-India (Official)',
    speechCode: 'en-IN',
    welcomeMessage: "Hello! I'm WeatherGPT. Unlike standard weather apps, I translate live atmospheric conditions into proactive, personalized decisions. How can I help with your day?",
    sampleQueries: [
      'Will it rain today?',
      'Should I carry an umbrella for travel?',
      'Can I irrigate my crops today?'
    ],
    suggestions: {
      rain: 'Will it rain today?',
      commute: 'Should I commute now?',
      farmer: 'Can I irrigate crops today?',
      umbrella: 'Should I carry an umbrella?'
    },
    samplePreview: (city) => `🌤️ "Partly cloudy in ${city} today with 28°C. Mild rain expected in the evening."`
  },
  {
    id: 'hinglish',
    name: 'Hinglish',
    nativeName: 'Hinglish (हिन्दी+)',
    shortCode: 'HI+',
    region: 'Colloquial Urban India',
    speechCode: 'en-IN',
    welcomeMessage: 'Hello! Main WeatherGPT hoon. Main sirf weather report nahi deta, balki aapko kya step lena chahiye wo bhi batata hoon. Aaj aap kya janna chahte hain?',
    sampleQueries: [
      'Kya aaj barish hogi?',
      'Travel ke waqt umbrella saath rakhna padega kya?',
      'Aaj crops mein paani lagana safe hai?'
    ],
    suggestions: {
      rain: 'Kal barish hogi kya?',
      commute: 'Kya kal office/college jana safe hai?',
      farmer: 'Kya aaj crops mein paani lagayein?',
      umbrella: 'Kya umbrella saath le jana chahiye?'
    },
    samplePreview: (city) => `🌤️ "Aaj ${city} mein 28°C aur partly cloudy rahega. Evening mein rain ke 85% chances hain, umbrella saath rakhein!"`
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    shortCode: 'BN',
    region: 'West Bengal, Tripura, Assam',
    speechCode: 'bn-IN',
    welcomeMessage: 'নমস্কার! আমি WeatherGPT। আবহাওয়ার পূর্বাভাসের সাথে কী সতর্কতা নিতে হবে তা আমি জানাই। আজ আপনি কী জানতে চান?',
    sampleQueries: [
      'আজ কি বৃষ্টি হবে?',
      'বাইরে বেরোনোর সময় কি ছাতা নেওয়া দরকার?',
      'আজকের আবহাওয়া কেমন থাকবে?'
    ],
    suggestions: {
      rain: 'আজ কি বৃষ্টি হবে?',
      commute: 'বাইরে যাওয়া কি নিরাপদ?',
      farmer: 'আজ কি জমিতে জল দেব?',
      umbrella: 'ছাতা কি সঙ্গে নেওয়া দরকার?'
    },
    samplePreview: (city) => `🌤️ "আজ ${city}-তে আংশিক মেঘলা আকাশ ও ২৮°C থাকবে। সন্ধ্যায় বৃষ্টির সম্ভাবনা রয়েছে।"`
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    shortCode: 'TE',
    region: 'Andhra Pradesh & Telangana',
    speechCode: 'te-IN',
    welcomeMessage: 'నమస్కారం! నేను WeatherGPT. కేవలం వాతావరణమే కాకుండా మీరు తీసుకోవాల్సిన జాగ్రత్తలను కూడా సూచిస్తాను.',
    sampleQueries: [
      'ఈరోజు వర్షం పడుతుందా?',
      'ప్రయాణానికి గొడుగు తీసుకెళ్లాలా?',
      'పంటలకు నీరు పెట్టడం సురక్షితమేనా?'
    ],
    suggestions: {
      rain: 'ఈరోజు వర్షం పడుతుందా?',
      commute: 'బయటకు వెళ్లడం సురక్షితమేనా?',
      farmer: 'పంటలకు నీరు పెట్టవచ్చా?',
      umbrella: 'గొడుగు తీసుకెళ్లాలా?'
    },
    samplePreview: (city) => `🌤️ "ఈరోజు ${city}లో 28°C తో పాక్షికంగా మేఘావృతమై ఉంటుంది. సాయంత్రం వర్షం పడే అవకాశం ఉంది."`
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    shortCode: 'MR',
    region: 'Maharashtra & Goa',
    speechCode: 'mr-IN',
    welcomeMessage: 'नमस्कार! मी WeatherGPT आहे. केवळ हवामानच नाही तर कोणती काळजी घ्यावी हे देखील सांगतो.',
    sampleQueries: [
      'आज पाऊस पडेल का?',
      'प्रवासासाठी छत्री सोबत ठेवावी का?',
      'शेतात पाणी देणे आज योग्य आहे का?'
    ],
    suggestions: {
      rain: 'आज पाऊस पडेल का?',
      commute: 'प्रवासासाठी हवामान अनुकूल आहे का?',
      farmer: 'शेतात पाणी देणे योग्य आहे का?',
      umbrella: 'छत्री सोबत ठेवावी का?'
    },
    samplePreview: (city) => `🌤️ "आज ${city} मध्ये 28°C सह अंशतः ढगाळ वातावरण राहील. संध्याकाळी पावसाची शक्यता आहे."`
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    shortCode: 'TA',
    region: 'Tamil Nadu & Puducherry',
    speechCode: 'ta-IN',
    welcomeMessage: 'வணக்கம்! நான் WeatherGPT. வானிலையுடன் சேர்த்து நீங்கள் என்ன முன்னெச்சரிக்கை எடுக்க வேண்டும் என்பதையும் கூறுகிறேன்.',
    sampleQueries: [
      'இன்று மழை பெய்யுமா?',
      'பயணத்தின் போது குடை எடுத்துச் செல்ல வேண்டுமா?',
      'இன்றைய வானிலை பாதுகாப்பு நிலை என்ன?'
    ],
    suggestions: {
      rain: 'இன்று மழை பெய்யுமா?',
      commute: 'பயணம் செய்வது பாதுகாப்பானதா?',
      farmer: 'இன்று பயிர்களுக்கு நீர் பாய்ச்சலாமா?',
      umbrella: 'குடை எடுத்துச் செல்ல வேண்டுமா?'
    },
    samplePreview: (city) => `🌤️ "இன்று ${city}இல் 28°C வெப்பநிலையுடன் ஓரளவு மேகமூட்டம் காணப்படும். மாலையில் மழை பெய்ய வாய்ப்புள்ளது."`
  },
  {
    id: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    shortCode: 'UR',
    region: 'Jammu & Kashmir, Telangana, UP, Bihar',
    speechCode: 'ur-IN',
    welcomeMessage: 'آداب! میں WeatherGPT ہوں۔ میں صرف موسم کی خبر نہیں دیتا، بلکہ یہ بتاتا ہوں کہ آپ کو کیا تدبیر کرنی چاہیے۔',
    sampleQueries: [
      'کیا آج بارش کا امکان ہے؟',
      'کیا سفر کے دوران چھتری ساتھ رکھنی چاہیے؟',
      'کیا فصلوں کی آبپاشی کرنا درست ہے؟'
    ],
    suggestions: {
      rain: 'کیا آج بارش ہوگی؟',
      commute: 'کیا سفر کرنا محفوظ ہے؟',
      farmer: 'کیا فصلوں کو پانی دینا چاہیے؟',
      umbrella: 'کیا چھتری ساتھ رکھنی چاہیے؟'
    },
    samplePreview: (city) => `🌤️ "آج ${city} میں موسم جزوی طور پر ابر آلود رہے گا اور درجہ حرارت 28°C رہے گا۔ شام کو بارش کا امکان ہے۔"`
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    shortCode: 'GU',
    region: 'Gujarat & Dadra Nagar Haveli',
    speechCode: 'gu-IN',
    welcomeMessage: 'નમસ્તે! હું WeatherGPT છું. હું માત્ર હવામાન નથી કહેતો, પણ તમારે શું પગલાં લેવા જોઈએ તે જણાવું છું. આજે તમે શું જાણવા માગો છો?',
    sampleQueries: [
      'શું આજે વરસાદ પડશે?',
      'શું આજે મુસાફરીમાં છત્રી સાથે રાખવી જરૂરી છે?',
      'શું આજે પાકમાં ખાતર કે પાણી આપવું યોગ્ય છે?'
    ],
    suggestions: {
      rain: 'શું આજે વરસાદ પડશે?',
      commute: 'શું મુસાફરી સુરક્ષિત છે?',
      farmer: 'શું આજે ખેતીમાં સિંચાઈ કરવી?',
      umbrella: 'છત્રી સાથે રાખવી જોઈએ?'
    },
    samplePreview: (city) => `🌤️ "આજે ${city}માં વાદળછાયું વાતાવરણ રહેશે, તાપમાન 28°C રહેશે. સાંજે વરસાદની શક્યતા છે."`
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    shortCode: 'KN',
    region: 'Karnataka',
    speechCode: 'kn-IN',
    welcomeMessage: 'ನಮಸ್ಕಾರ! ನಾನು WeatherGPT. ಕೇವಲ ಹವಾಮಾನ ವರದಿ ಮಾತ್ರವಲ್ಲ, ನೀವು ತೆಗೆದುಕೊಳ್ಳಬೇಕಾದ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ಸಹ ತಿಳಿಸುತ್ತೇನೆ.',
    sampleQueries: [
      'ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?',
      'ಪ್ರಯಾಣಕ್ಕೆ ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕೆ?',
      'ಬೆಳೆಗಳಿಗೆ ನೀರುಣಿಸುವುದು ಸುರಕ್ಷಿತವೇ?'
    ],
    suggestions: {
      rain: 'ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?',
      commute: 'ಪ್ರಯಾಣ ಸುರಕ್ಷಿತವೇ?',
      farmer: 'ಬೆಳೆಗಳಿಗೆ ನೀರು ಹಾಯಿಸಬಹುದೇ?',
      umbrella: 'ಛತ್ರಿ ಕೊಂಡೊಯ್ಯಬೇಕೆ?'
    },
    samplePreview: (city) => `🌤️ "ಇಂದು ${city}ನಲ್ಲಿ 28°C ತಾಪಮಾನವಿದ್ದು, ಭಾಗಶಃ ಮೋಡ ಕವಿದ ವಾತಾವರಣವಿರುತ್ತದೆ. ಸಂಜೆ ಮಳೆ ಸಾಧ್ಯತೆ."`
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    shortCode: 'ML',
    region: 'Kerala & Lakshadweep',
    speechCode: 'ml-IN',
    welcomeMessage: 'നമസ്കാരം! ഞാൻ WeatherGPT. കാലാവസ്ഥ അറിയുന്നതിനൊപ്പം നിങ്ങൾ സ്വീകരിക്കേണ്ട മുൻകരുതലുകളും ഞാൻ നിർദ്ദേശിക്കുന്നു.',
    sampleQueries: [
      'ഇന്ന് മഴ പെയ്യാൻ സാധ്യതയുണ്ടോ?',
      'യാത്രയ്ക്ക് കുട കരുതേണ്ടതുണ്ടോ?',
      'വിളകൾ നനയ്ക്കുന്നത് സുരക്ഷിതമാണോ?'
    ],
    suggestions: {
      rain: 'ഇന്ന് മഴ പെയ്യുമോ?',
      commute: 'യാത്ര സുരക്ഷിതമാണോ?',
      farmer: 'ഇന്ന് നനയ്ക്കാൻ പറ്റിയ സമയമാണോ?',
      umbrella: 'കുട കരുതേണ്ടതുണ്ടോ?'
    },
    samplePreview: (city) => `🌤️ "ഇന്ന് ${city}യിൽ 28°C താപനിലയും ഭാഗികമായി മേഘാവൃതവുമായ അന്തരീക്ഷവുമായിരിക്കും. വൈകുന്നേരം മഴയ്ക്ക് സാധ്യത."`
  },
  {
    id: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    shortCode: 'OR',
    region: 'Odisha',
    speechCode: 'or-IN',
    welcomeMessage: 'ନମସ୍କାର! ମୁଁ WeatherGPT। ମୁଁ କେବଳ ପାଣିପାଗ ଜଣାଏ ନାହିଁ, ବରଂ ଆପଣଙ୍କୁ କି ସତର୍କତା ଅବଲମ୍ବନ କରିବାକୁ ହେବ ତାହା ମଧ୍ୟ କହେ।',
    sampleQueries: [
      'ଆଜି କ’ଣ ବର୍ଷା ହେବ?',
      'ଯାତ୍ରା ସମୟରେ ଛତା ନେବା ଆବଶ୍ୟକ କି?',
      'ଆଜି ଫସଲରେ ଜଳସେଚନ କରିବା ଠିକ୍ ହେବ କି?'
    ],
    suggestions: {
      rain: 'ଆଜି କ’ଣ ବର୍ଷା ହେବ?',
      commute: 'ଯାତ୍ରା ପାଇଁ ପାଣିପାଗ କିପରି ଅଛି?',
      farmer: 'ଫସଲରେ ପାଣି ଦେବା ଠିକ୍ କି?',
      umbrella: 'ଛତା ନେବା ଆବଶ୍ୟକ କି?'
    },
    samplePreview: (city) => `🌤️ "ଆଜି ${city}ରେ ଆଂଶିକ ମେଘୁଆ ପାଗ ସହ ୨୮°C ରହିବ। ସନ୍ଧ୍ୟାରେ ବର୍ଷା ସମ୍ଭାବନା ଅଛି।"`
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    shortCode: 'PA',
    region: 'Punjab & Chandigarh',
    speechCode: 'pa-IN',
    welcomeMessage: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ WeatherGPT ਹਾਂ। ਮੈਂ ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਦੇ ਨਾਲ-ਨਾਲ ਸਹੀ ਸੁਰੱਖਿਆ ਸਲਾਹ ਵੀ ਦਿੰਦਾ ਹਾਂ।',
    sampleQueries: [
      'ਕੀ ਅੱਜ ਮੀਂਹ ਪਵੇਗਾ?',
      'ਕੀ ਸਫ਼ਰ ਵੇਲੇ ਛਤਰੀ ਨਾਲ ਰੱਖਣੀ ਚਾਹੀਦੀ ਹੈ?',
      'ਕੀ ਅੱਜ ਫ਼ਸਲਾਂ ਨੂੰ ਪਾਣੀ ਲਗਾਉਣਾ ਸਹੀ ਹੈ?'
    ],
    suggestions: {
      rain: 'ਕੀ ਅੱਜ ਮੀਂਹ ਪਵੇਗਾ?',
      commute: 'ਕੀ ਸਫ਼ਰ ਕਰਨਾ ਸੁਰੱਖਿਅਤ ਹੈ?',
      farmer: 'ਕੀ ਫ਼ਸਲ ਨੂੰ ਪਾਣੀ ਲਗਾਈਏ?',
      umbrella: 'ਛਤਰੀ ਨਾਲ ਲੈ ਕੇ ਜਾਈਏ?'
    },
    samplePreview: (city) => `🌤️ "ਅੱਜ ${city} ਵਿੱਚ 28°C ਅਤੇ ਬੱਦਲਵਾਈ ਰਹੇਗੀ। ਸ਼ਾਮ ਨੂੰ ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ।"`
  },
  {
    id: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    shortCode: 'AS',
    region: 'Assam & North East',
    speechCode: 'as-IN',
    welcomeMessage: 'নমস্কাৰ! মই WeatherGPT। বতৰৰ আগজাননীৰ লগতে আপুনি কি সাৱধানতা অৱলম্বন কৰিব লাগিব সেয়া মই জনাওঁ।',
    sampleQueries: [
      'আজি বৰষুণ হ’ব নেকি?',
      'যাত্ৰাৰ সময়ত ছাতি লগত নিয়া প্ৰয়োজন নেকি?',
      'আজি খেতিত পানী দিয়া উচিত হ’বনে?'
    ],
    suggestions: {
      rain: 'আজি বৰষুণ হ’বনে?',
      commute: 'যাত্ৰা কৰা সুৰক্ষিতনে?',
      farmer: 'খেতিত পানী দিয়া ঠিক হ’বনে?',
      umbrella: 'ছাতি লগত নিব লাগিবনে?'
    },
    samplePreview: (city) => `🌤️ "আজি ${city}ত আংশিক মেঘালী আকাশ আৰু ২৮°C উষ্ণতা থাকিব। সন্ধিয়া বৰষুণৰ সম্ভাৱনা আছে।"`
  },
  {
    id: 'mai',
    name: 'Maithili',
    nativeName: 'मैथिली',
    shortCode: 'MAI',
    region: 'Bihar & Jharkhand (Mithila)',
    speechCode: 'hi-IN',
    welcomeMessage: 'प्रणाम! हम WeatherGPT छी। हम सिर्फ मौसमेक हाल नै बताबैत छी, बल्कि अहाँकेँ कोनो असुविधा नै होए ताहि लेल उचित सलाह सेहो दैत छी।',
    sampleQueries: [
      'की आई बरखा होयत?',
      'की बाहर जाय लेल छाता संग राखय पड़त?',
      'की आई खेत में पटवन कयल सुरक्षित अछि?'
    ],
    suggestions: {
      rain: 'की आई बरखा होयत?',
      commute: 'की बाहर जायब सुरक्षित अछि?',
      farmer: 'की खेत में पटवन करी?',
      umbrella: 'की छाता संग राखू?'
    },
    samplePreview: (city) => `🌤️ "आई ${city} में बदल छाएल रहत, तापमान 28°C रहत। साँझ केँ बरखाक संभावना अछि।"`
  },
  {
    id: 'sa',
    name: 'Sanskrit',
    nativeName: 'संस्कृतम्',
    shortCode: 'SA',
    region: 'Ancient Classical Heritage',
    speechCode: 'hi-IN',
    welcomeMessage: 'नमस्ते! अहम् WeatherGPT अस्मि। अहम् केवलं ऋतुवार्ताम् न ददामि, अपि तु भवद्भ्यः उचितं मार्गदर्शनं अपि प्रयच्छामि।',
    sampleQueries: [
      'किम् अद्य वृष्टिः भविष्यति?',
      'किम् यात्रायां छत्रम् आवश्यकम्?',
      'किम् अद्य सस्यानां सेचनम् उचितम्?'
    ],
    suggestions: {
      rain: 'किम् अद्य वृष्टिः भविष्यति?',
      commute: 'किम् यात्रा सुरक्षिता अस्ति?',
      farmer: 'किम् क्षेत्रेषु सेचनं करणीयम्?',
      umbrella: 'किम् छत्रं धारणीयम्?'
    },
    samplePreview: (city) => `🌤️ "अद्य ${city} नगरे मेघाच्छादितं वातावरणं २८°C तापमानं च भविष्यति। सायं वृष्टेः सम्भावना वर्तते।"`
  },
  {
    id: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    shortCode: 'NE',
    region: 'Sikkim, North Bengal, Uttarakhand, Assam',
    speechCode: 'ne-NP',
    welcomeMessage: 'नमस्ते! म WeatherGPT हुँ। म मौसमको जानकारी मात्र होइन, तपाईंले के सावधानी अपनाउनुपर्छ भन्ने सल्लाह पनि दिन्छु।',
    sampleQueries: [
      'के आज पानी पर्छ?',
      'के यात्रा गर्दा छाता बोक्नुपर्छ?',
      'के आज बालीमा सिँचाइ गर्नु सुरक्षित छ?'
    ],
    suggestions: {
      rain: 'के आज पानी पर्ला?',
      commute: 'के यात्रा गर्न सुरक्षित छ?',
      farmer: 'के बालीमा पानी हाल्नु ठीक होला?',
      umbrella: 'छाता बोक्नुपर्छ कि?'
    },
    samplePreview: (city) => `🌤️ "आज ${city}मा आंशिक बादल लाग्नेछ र तापक्रम २८°C रहनेछ। साँझपख वर्षाको सम्भावना छ।"`
  },
  {
    id: 'kok',
    name: 'Konkani',
    nativeName: 'कोंकणी',
    shortCode: 'KOK',
    region: 'Goa & Coastal Karnataka/Maharashtra',
    speechCode: 'mr-IN',
    welcomeMessage: 'नमस्कार! हांव WeatherGPT. हांव फकत हवामान सांगिना, तर तुमी कसल्यो खबरदार्यो घेवच्यो तेंय सांगतां.',
    sampleQueries: [
      'आयज पावस पडटलो काय?',
      'भायर वतना सातो घेवचो पडटलो काय?',
      'शेतांत उदक घालप आयज बरें आसा काय?'
    ],
    suggestions: {
      rain: 'आयज पावस पडटलो काय?',
      commute: 'भायर वचपाक हवामान बरें आसा काय?',
      farmer: 'शेताक उदक दिवचें काय?',
      umbrella: 'सातो घेवचो पडटलो काय?'
    },
    samplePreview: (city) => `🌤️ "आयज ${city} हांगा 28°C तापमान आसतले आनी मळब मळबाळ आसतले. सांजे पावस पडपाची शक्यताय आसा."`
  },
  {
    id: 'ks',
    name: 'Kashmiri',
    nativeName: 'कॉशुर (کٲشُر)',
    shortCode: 'KS',
    region: 'Jammu & Kashmir',
    speechCode: 'ur-IN',
    welcomeMessage: 'سلام! بہ چھُس WeatherGPT। بہ چھُس نہ صرف موسمچ خبر دِوان، بلکہ یہ تہِ ونان زِ تۄہہِ کِتھ پٲٹھۍ بچاو کرن چھُ۔',
    sampleQueries: [
      'کیاہ از رُود پؠیہِ؟',
      'کیاہ نؠبر نیرنہ وتھ چھتری ترٲوتھ نؠنہٕ چھا؟',
      'کیاہ فصْلن آب دِیُن چھا ٹھیک؟'
    ],
    suggestions: {
      rain: 'کیاہ از رُود پؠیہِ؟',
      commute: 'کیاہ سفر کَرُن چھا محفوظ؟',
      farmer: 'کیاہ فصْلن آب دِیُن پزی؟',
      umbrella: 'کیاہ چھتری ترٲوتھ نؠنہٕ چھا؟'
    },
    samplePreview: (city) => `🌤️ "از روزِ ${city} منٛز ابر آلود موسم تہٕ درجہ حرارت ۲۸ ڈگری۔ شامس پؠیہِ رُود۔"`
  },
  {
    id: 'sd',
    name: 'Sindhi',
    nativeName: 'सिन्धी (سنڌي)',
    shortCode: 'SD',
    region: 'Gujarat, Maharashtra, Rajasthan',
    speechCode: 'ur-IN',
    welcomeMessage: 'ادا سلام! مان WeatherGPT آهيان. مان رڳو موسم جو احوال نٿو ڏيان، پر اوهان کي ڪهڙي احتياط ڪرڻ گهرجي سا به ٻڌايان ٿو.',
    sampleQueries: [
      'ڇا اڄ برسات پوندي؟',
      'ڇا ٻاهر وڃڻ وقت ڇٽي گڏ کڻڻ ضروري آهي؟',
      'ڇا فصلن کي پاڻي ڏيڻ مناسب آهي؟'
    ],
    suggestions: {
      rain: 'ڇا اڄ برسات پوندي؟',
      commute: 'ڇا سفر ڪرڻ محفوظ آهي؟',
      farmer: 'ڇا ٻنن کي پاڻي ڏجي؟',
      umbrella: 'ڇٽي کڻڻ گهرجي؟'
    },
    samplePreview: (city) => `🌤️ "اڄ ${city} ۾ اڀ ڪڪر هوندو ۽ گرمي پد 28°C رهندو. شام جو برسات جو امڪان آهي."`
  },
  {
    id: 'doi',
    name: 'Dogri',
    nativeName: 'डोगरी',
    shortCode: 'DOI',
    region: 'Jammu & Himachal Pradesh',
    speechCode: 'hi-IN',
    welcomeMessage: 'जय देवा! म्हूँ WeatherGPT हाँ। म्हूँ सिर्फ मौसम नेईं दस्सदा, बल्कि तुसेंगी केह सावधानी बरतनी चाहिदी ऐ ओह बी दस्सदा हाँ।',
    sampleQueries: [
      'केह् अज्ज बरखा पौग?',
      'केह् सैर/सफर वेले छतरी लैना जरूरी ऐ?',
      'केह् फसलें गी पानी लाना ठीक ऐ?'
    ],
    suggestions: {
      rain: 'केह् अज्ज बरखा पौग?',
      commute: 'केह् बाहर जाना सुरक्षित ऐ?',
      farmer: 'केह् अज्ज खेतें च पानी लाईए?',
      umbrella: 'केह् छतरी लै जानी चाहिदी?'
    },
    samplePreview: (city) => `🌤️ "अज्ज ${city} च बद्दल छाये रोह्वन गे ते तापमान 28°C रौह्ल। संझा गी बरखा दी संभावना ऐ।"`
  },
  {
    id: 'mni',
    name: 'Manipuri',
    nativeName: 'মৈতৈলোন্ (Manipuri)',
    shortCode: 'MNI',
    region: 'Manipur & North East',
    speechCode: 'bn-IN',
    welcomeMessage: 'খুরুমজরি! ঐ WeatherGPT নি। ঐনা নোংজু-নুংশিৎকী পাউখুম খক্তা নত্তনা নহাক্না করম্বা চেকশিন থৌরাং লৌখৎকদগে হায়বদুসু তাকপী।',
    sampleQueries: [
      'ঙসি নোং চুক্কদরা?',
      'চৎথোক-চৎশিন্দা শেকপিন পুবা দরকার ওইবরা?',
      'ঙসি লৌমীশিংনা লৌবুদা ঈশিং পীবা চান্নবরা?'
    ],
    suggestions: {
      rain: 'ঙসি নোং চুক্কদরা?',
      commute: 'চৎথোক চৎশিন তৌবা য়াবরা?',
      farmer: 'লৌবুদা ঈশিং পীবা চান্নবরা?',
      umbrella: 'শেকপিন পুবা তাইবরা?'
    },
    samplePreview: (city) => `🌤️ "ঙসি ${city}দা নোংমৈনা কুপ্পা অমসুং ২৮°C ওইগনি। নুমিদাংৱাইরমদা নোং চুরকপগী থৌওং য়াওরি।"`
  },
  {
    id: 'brx',
    name: 'Bodo',
    nativeName: 'बड़ो (Boro)',
    shortCode: 'BRX',
    region: 'Bodoland & Assam',
    speechCode: 'hi-IN',
    welcomeMessage: 'खुमुलिया! आं WeatherGPT। आं खालि बोथोरनि खौरांल\' होआ, नोंथाङा मा सांग्रांथि लानो नांगौ बेनिबो बिथोन होयो।',
    sampleQueries: [
      'दिनै अखा हागोन ना?',
      'दावबायनायाव साता लानांगौ ना?',
      'आबावहायाव दिनै दै होनाया मोजां जागोन ना?'
    ],
    suggestions: {
      rain: 'दिनै अखा हागोन ना?',
      commute: 'दावबायनाया मोजां जागोन ना?',
      farmer: 'आबावहायाव दै होनो हागोन ना?',
      umbrella: 'साता लांगोन ना?'
    },
    samplePreview: (city) => `🌤️ "दिनै ${city}आव जोबोद जोमै थागोन आरो दुंथाय 28°C जागोन। बेलासियाव अखा हानो हागौ।"`
  },
  {
    id: 'sat',
    name: 'Santali',
    nativeName: 'संताली (ᱥᱟᱱᱛᱟᱲᱤ)',
    shortCode: 'SAT',
    region: 'Jharkhand, Odisha, West Bengal, Bihar',
    speechCode: 'hi-IN',
    welcomeMessage: 'ᱡᱚᱦᱟᱨ! ᱤᱧ WeatherGPT ᱠᱟᱱᱟᱹᱧ᱾ ᱤᱧ ᱫᱚ ᱥᱩᱢᱩᱝ ᱦᱚᱭ-ᱦᱤᱥᱤᱫ ᱠᱷᱚᱵᱚᱨ ᱫᱚ ᱵᱟᱝ, ᱟᱢ ᱪᱮᱫ ᱥᱟᱵᱽᱫᱷᱟᱱ ᱦᱟᱛᱟᱣ ᱦᱩᱭᱩᱜ-ᱟ ᱚᱱᱟ ᱦᱚᱸᱧ ᱞᱟᱹᱭᱟ᱾',
    sampleQueries: [
      'ᱛᱮᱦᱮᱧ ᱫᱟᱜ ᱦᱤᱡᱩᱜ-ᱟ ᱥᱮ ᱵᱟᱝ?',
      'ᱥᱮᱱᱚᱜ ᱡᱚᱠᱷᱟᱡ ᱪᱷᱟᱛᱟ ᱤᱫᱤ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ?',
      'ᱛᱮᱦᱮᱧ ᱪᱟᱥ ᱠᱷᱮᱛ ᱨᱮ ᱫᱟᱜ ᱮᱢ ᱴᱷᱤᱠ ᱦᱩᱭᱩᱜ-ᱟ?'
    ],
    suggestions: {
      rain: 'ᱛᱮᱦᱮᱧ ᱫᱟᱜ ᱦᱤᱡᱩᱜ-ᱟ?',
      commute: 'ᱥᱮᱱᱚᱜ ᱞᱟᱹᱜᱤᱫ ᱦᱚᱭ-ᱦᱤᱥᱤᱫ ᱴᱷᱤᱠ ᱜᱮᱭᱟ?',
      farmer: 'ᱠᱷᱮᱛ ᱨᱮ ᱫᱟᱜ ᱮᱢ ᱴᱷᱤᱠ ᱦᱩᱭᱩᱜ-ᱟ?',
      umbrella: 'ᱪᱷᱟᱛᱟ ᱤᱫᱤ ᱞᱟᱹᱠᱛᱤ ᱠᱟᱱᱟ?'
    },
    samplePreview: (city) => `🌤️ "ᱛᱮᱦᱮᱧ ${city} ᱨᱮ ᱨᱤᱢᱤᱞ ᱛᱟᱦᱮᱸᱱᱟ ᱟᱨ ᱞᱚᱞᱚᱥᱚᱝ ᱒᱘°C ᱛᱟᱦᱮᱸᱱᱟ᱾ ᱟᱹᱭᱩᱵ ᱫᱟᱜ ᱦᱤᱡᱩᱜ ᱨᱮᱱᱟᱜ ᱟᱸᱥ ᱢᱮᱱᱟᱜ-ᱟ᱾"`
  }
];

export const LANGUAGE_MAP = new Map<Language, LanguageInfo>(
  INDIAN_LANGUAGES.map((l) => [l.id, l])
);

export function getLanguageInfo(id?: Language | string): LanguageInfo {
  if (!id) return INDIAN_LANGUAGES[0];
  return LANGUAGE_MAP.get(id as Language) || INDIAN_LANGUAGES[0];
}

export function getSpeechRecognitionLang(id?: Language | string): string {
  if (!id) return 'en-IN';
  const lang = LANGUAGE_MAP.get(id as Language);
  return lang ? lang.speechCode : 'en-IN';
}
