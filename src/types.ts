export type Language =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'bn'
  | 'te'
  | 'mr'
  | 'ta'
  | 'ur'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa'
  | 'as'
  | 'mai'
  | 'sa'
  | 'ne'
  | 'kok'
  | 'ks'
  | 'sd'
  | 'doi'
  | 'mni'
  | 'brx'
  | 'sat';

export type UserRole = 'citizen' | 'farmer' | 'traveller' | 'researcher';

export type TemperatureUnit = 'C' | 'F';

export interface WeatherData {
  city: string;
  state: string;
  country: string;
  temperature: number;
  condition: string;
  conditionIcon: 'partly-cloudy' | 'rain' | 'thunderstorm' | 'clear' | 'fog' | 'extreme-heat';
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  rainChance: number;
  maxTemp: number;
  minTemp: number;
  aqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Unhealthy' | 'Severe';
  uvIndex: number;
  pressure: number;
  visibility: number;
  lastUpdated: string;
  riskScore: number;
  riskStatus: 'Low Risk' | 'Moderate Risk' | 'Moderate-High Risk' | 'Severe Risk';
  risks: {
    rain: 'LOW' | 'MEDIUM' | 'HIGH';
    flood: 'LOW' | 'MEDIUM' | 'HIGH';
    lightning: 'LOW' | 'MEDIUM' | 'HIGH';
    heat: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  aiRecommendation: string;
  suburb?: string;
  locality?: string;
  postalCode?: string;
  formattedAddress?: string;
  accuracyMeters?: number;
  locationMethod?: 'gps-satellite' | 'gps-wifi' | 'ip-network' | 'manual';
  coordinates?: {
    lat: number;
    lon: number;
  };
  isOfflineCached?: boolean;
  offlineCachedAt?: string;
  recommendationExplanation: {
    title: string;
    factors: string[];
    confidence: number;
    modelAgreement: string;
    uncertaintyNote?: string;
  };
}

export interface HourlyForecast {
  time: string;
  temp: number;
  condition: string;
  rainProb: number;
  icon: string;
}

export interface DailyForecast {
  day: string;
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  rainChance: number;
  icon: string;
  summary: string;
}

export interface WeatherAlert {
  id: string;
  type: 'heavy-rain' | 'flood' | 'cyclone' | 'thunderstorm' | 'heatwave' | 'dense-fog' | 'strong-winds';
  title: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Extreme';
  location: string;
  issuedAt: string;
  description: string;
  impacts: string[];
  recommendedActions: string[];
  isActive: boolean;
  isNearby: boolean;
}

export interface RouteTrip {
  id: string;
  from: string;
  to: string;
  leaveBy: string;
  estDuration: string;
  status: string;
  statusType: 'rain' | 'clear' | 'alert';
  recommendation: string;
  weatherOnRoute?: string;
  safetyScore?: number;
  stops: {
    time: string;
    pointName: string;
    condition: string;
    rainProb: number;
    temp: number;
    windSpeed: number;
    hazard?: string;
  }[];
  alternativeAdvice: string;
}

export interface FarmerAdvisory {
  crop: string;
  growthStage: string;
  location: string;
  soilMoistureStatus: string;
  irrigationAdvice: {
    shouldIrrigate: boolean;
    urgency: 'Safe to hold' | 'Postpone' | 'Recommended' | 'Caution';
    reason: string;
  };
  pesticideAdvice: {
    safeToSpray: boolean;
    safetyScore: number; // 0 - 100
    reason: string;
  };
  temperatureStress: string;
  summaryAdvisory: string;
}

export interface GroundingSource {
  type?: 'web' | 'maps';
  title: string;
  uri: string;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'weathergpt';
  text: string;
  timestamp: string;
  language?: Language;
  modelUsed?: string;
  roleUsed?: string;
  providerUsed?: string;
  groundingSources?: GroundingSource[];
  cardData?: {
    type: 'weather' | 'alert' | 'route' | 'farmer';
    payload: any;
  };
}

export interface ClimateHistoryData {
  city: string;
  years: number[];
  avgTemp: number[];
  annualRainfallMm: number[];
  extremeEventsCount: number[];
  insight: string;
}

export interface DemoScenario {
  id: string;
  title: string;
  tagline: string;
  city: string;
  description: string;
  condition: string;
  temperature: number;
  rainChance: number;
  riskScore: number;
  alertTitle: string;
}

// WeatherGPT Live Map Types
export type RouteRiskLevel = 'Low' | 'Moderate' | 'High' | 'Severe';

export interface RouteSamplingPoint {
  id: string;
  name: string;
  expectedTime: string;
  distanceFromStartKm: number;
  weatherCondition: string;
  temp: number;
  rainProb: number;
  rainIntensity: 'None' | 'Light' | 'Moderate' | 'Heavy';
  waterloggingRisk: 'None' | 'Low' | 'Moderate' | 'High';
  safetyScore: number;
  hazard?: string | null;
  coords: { x: number; y: number; lat?: number; lng?: number };
}

export interface RouteRiskZone {
  id: string;
  type: 'rain' | 'waterlogging' | 'thunderstorm' | 'wind' | 'visibility';
  title: string;
  locationName: string;
  coords: { x: number; y: number; lat?: number; lng?: number };
  severity: 'Moderate' | 'High' | 'Severe';
  description: string;
  icon: string;
}

export interface LiveMapRoute {
  id: string;
  name: string;
  badge: string;
  type: 'recommended' | 'fastest' | 'avoid' | 'alternative';
  distanceKm: number;
  durationMinutes: number;
  safetyScore: number; // 0 to 100
  summaryCondition: string;
  rainRisk: 'Low' | 'Moderate' | 'High';
  waterloggingRisk: 'Low' | 'Moderate' | 'High';
  thunderstormRisk?: 'Low' | 'Moderate' | 'High';
  hazardCount: number;
  color: 'green' | 'orange' | 'red';
  strokeColor: string;
  pathPoints: { x: number; y: number }[];
  geoPoints?: [number, number][]; // [lat, lng] for Leaflet
  waypoints: RouteSamplingPoint[];
  riskZones: RouteRiskZone[];
  departureAdvice: string;
  whyThisRoute: string;
  whyWait: string;
}

export interface DepartureTimeOption {
  id: string;
  title: string;
  time: string;
  safetyScore: number;
  travelTime: string;
  statusNote: string;
  isRecommended?: boolean;
  tag?: string;
  rainRisk: 'Low' | 'Moderate' | 'High';
  conditionIcon: string;
}

export interface NearbySafePlace {
  id: string;
  name: string;
  category: 'restaurant' | 'cafe' | 'convenience' | 'hotel' | 'petrol' | 'hospital';
  categoryLabel: string;
  rating: number;
  reviews: number;
  distanceMeters: number;
  walkingMinutes: number;
  address: string;
  coords: { x: number; y: number; lat?: number; lng?: number };
  openStatus: string;
  shelterFeature: string;
  phone?: string;
}

export interface WeatherTimelineStop {
  time: string;
  label: string;
  weatherCondition: string;
  rainProb: number;
  risk: 'Safe' | 'Moderate' | 'High';
  icon: string;
}

export interface ProactiveWeatherAlert {
  shouldAlert: boolean;
  distanceAheadKm: number;
  timeAheadMin: number;
  riskLevel: 'HIGH' | 'MODERATE' | 'LOW';
  alertTitle: string;
  advice: string;
}

export interface AIWeatherRouteAnalysis {
  overallRisk: 'GREEN' | 'YELLOW' | 'RED';
  headline: string;
  detailedAnalysis: string;
  proactiveAlert: ProactiveWeatherAlert | null;
  leaveNowDecision: 'GO_NOW' | 'WAIT' | 'AVOID';
  leaveNowAdvice: string;
  comparisonReasoning: string;
  weatherTimeline: WeatherTimelineStop[];
  source?: string;
}

export interface JourneySummaryData {
  distanceKm: number;
  travelTimeMinutes: number;
  rainMinutes: number;
  highRiskZonesAvoided: number;
  routeName: string;
  destinationName: string;
  aiSummary: string;
}

export type WeatherMapLayerType = 'rain' | 'temperature' | 'wind' | 'clouds' | 'storm' | 'risk';

export interface SavedDestinationItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'home' | 'college' | 'work' | 'favorite' | 'university' | 'office' | 'transport' | 'landmark';
  iconType: 'home' | 'college' | 'work' | 'favorite';
  coords: { lat: number; lon: number; x?: number; y?: number };
  city: string;
}

// Disaster News Hub Types
export type DisasterCategory =
  | 'all'
  | 'flood'
  | 'cyclone'
  | 'earthquake'
  | 'landslide'
  | 'wildfire'
  | 'extreme-rainfall'
  | 'heatwave'
  | 'storm'
  | 'other';

export type DisasterSeverity = 'Low' | 'Moderate' | 'High' | 'Critical';

export type DisasterSourceType = 'official' | 'news' | 'vlog';

export type DisasterScope = 'all' | 'near-me' | 'on-route' | 'india' | 'global';

export interface DisasterNewsItem {
  id: string;
  title: string;
  disasterType: DisasterCategory;
  location: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  aiSummary: string;
  fullContent?: string;
  severity: DisasterSeverity;
  sourceType: DisasterSourceType;
  sourceName: string;
  sourceUrl?: string;
  publishedAt: string;
  officialPublishDate?: string;
  officialPlatformName?: string;
  bulletinId?: string;
  updatedAt: string;
  isBreaking?: boolean;
  isVerified: boolean;
  verificationBadge: string;
  keyStats?: {
    affectedCount?: string;
    rainfallMm?: number;
    magnitude?: number;
    windSpeedKmh?: number;
    evacuationStatus?: string;
  };
  safetyAdvice?: string[];
  crossCheckCount?: number;
}

// ==================== NWP (Numerical Weather Prediction) Models ====================
export type NWPModelId = 'consensus' | 'gfs' | 'wrf' | 'ecmwf' | 'icon';

export interface NWPModelMetadata {
  id: NWPModelId;
  name: string;
  fullName: string;
  agency: string;
  country: string;
  resolution: string;
  coreType: string;
  updateFrequency: string;
  cycle: string;
  badgeColor: string;
  description: string;
  strengths: string;
}

export interface NWPHourlyPoint {
  time: string;
  timestamp: string;
  hour: number;
  temp: number;
  rainProb: number;
  precipitationMm: number;
  windSpeed: number;
  pressure: number;
}

export interface NWPModelPrediction {
  modelId: NWPModelId;
  name: string;
  hourly: NWPHourlyPoint[];
  next24hRainTotal: number;
  maxTemp: number;
  minTemp: number;
  peakWindSpeed: number;
  conditionSummary: string;
}

export interface NWPComparisonData {
  city: string;
  lat: number;
  lon: number;
  elevationMeters: number;
  lastUpdated: string;
  consensusScore: number;
  divergenceLevel: 'Low' | 'Moderate' | 'High';
  divergenceReason: string;
  synopticSummary: string;
  models: Record<NWPModelId, NWPModelPrediction>;
  modelSpecs: Record<NWPModelId, NWPModelMetadata>;
  meteorologistNotes: {
    gfsVsWrf: string;
    cycloneTrackAgreement: string;
    convectiveRainTiming: string;
  };
}

export interface WhatsAppAlertPreferences {
  enabled: boolean;
  phoneNumber: string;
  email?: string;
  warningBeforeMinutes?: number;
  alertLevel?: 'High' | 'Extreme' | 'Moderate';
  threshold: 'HIGH_EXTREME' | 'MODERATE_HIGH_EXTREME';
  categories: {
    heavyRain: boolean;
    flood: boolean;
    cyclone: boolean;
    heatwave: boolean;
    thunderstorm: boolean;
    denseFog: boolean;
  };
  monitoredCities: string[];
  cooldownHours: number;
  lastEvaluatedAt?: string;
}

export interface WhatsAppAlertLog {
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

export interface TwilioServiceStatus {
  configured: boolean;
  sender: string;
  hasAuthToken: boolean;
  hasApiKey: boolean;
  accountSidPrefix?: string;
  recentAlertsCount: number;
}

