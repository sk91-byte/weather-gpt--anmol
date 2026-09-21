import { RouteTrip, WeatherData } from '../types';
import { DEFAULT_ROUTE_TRIP, DEFAULT_SAVED_TRIPS } from '../data/weatherData';

const STORAGE_ACTIVE_TRIP = 'weathergpt_active_trip';
const STORAGE_SAVED_TRIPS = 'weathergpt_saved_trips';

/**
 * Parses time string like "08:00 AM", "8:30 PM", or "Now" into minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr.toLowerCase().includes('now')) {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 8 * 60; // default 8 AM

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Format minutes from midnight back to "hh:mm AM/PM"
 */
export function formatMinutesToTime(totalMinutes: number): string {
  const normMin = (totalMinutes + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(normMin / 60);
  const mins = normMin % 60;
  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const padMin = mins < 10 ? `0${mins}` : mins;
  return `${hours12 < 10 ? '0' : ''}${hours12}:${padMin} ${meridiem}`;
}

/**
 * Get current time formatted as "hh:mm AM/PM"
 */
export function getCurrentFormattedTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const mins = now.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 === 0 ? 12 : hours % 12;
  return `${hours < 10 ? '0' : ''}${hours}:${mins < 10 ? '0' : ''}${mins} ${meridiem}`;
}

/**
 * Intelligently compute route weather, safety score, stops and recommendations
 * based on the trip parameters and current live weather conditions.
 */
export function calculateTripRouteWeather(
  from: string,
  to: string,
  leaveBy: string,
  currentWeather?: WeatherData,
  existingId?: string
): RouteTrip {
  const origin = from.trim() || 'Home';
  const destination = to.trim() || 'College';
  const departureTime = leaveBy === 'Now' ? getCurrentFormattedTime() : (leaveBy || '08:00 AM');

  // Base parameters from current weather
  const currentRainChance = currentWeather?.rainChance ?? 40;
  const currentTemp = currentWeather?.temperature ?? 28;
  const currentWind = currentWeather?.windSpeed ?? 12;
  const currentCondition = currentWeather?.condition ?? 'Partly Cloudy';
  const currentAqi = currentWeather?.aqi ?? 65;

  // Factor in departure time variations
  const depMinutes = parseTimeToMinutes(departureTime);
  const isRushHourMorning = depMinutes >= 8 * 60 && depMinutes <= 10 * 60;
  const isEvening = depMinutes >= 17 * 60 && depMinutes <= 20 * 60;

  // Compute realistic duration (typically 25 to 45 mins)
  const baseMinutes = 30 + (origin.length + destination.length) % 15;
  const estDuration = `${baseMinutes} mins`;

  // Compute safety score (0 - 100)
  // Higher rain, wind, or storm lowers safety score
  let safetyScore = 95;
  if (currentRainChance > 70) safetyScore -= 30;
  else if (currentRainChance > 40) safetyScore -= 18;
  else if (currentRainChance > 20) safetyScore -= 8;

  if (currentWind > 25) safetyScore -= 12;
  else if (currentWind > 18) safetyScore -= 6;

  if (currentAqi > 200) safetyScore -= 10;
  else if (currentAqi > 120) safetyScore -= 5;

  if (isRushHourMorning && currentRainChance > 40) safetyScore -= 6; // traffic waterlogging compounding

  safetyScore = Math.max(35, Math.min(98, safetyScore));

  // Determine status type and text
  let statusType: 'rain' | 'clear' | 'alert' = 'clear';
  let status = 'Clear & smooth commute conditions';
  let weatherOnRoute = 'Clear skies with light breeze';
  let recommendation = `Optimal departure window: ${departureTime}. Smooth transit expected.`;
  let alternativeAdvice = 'Pavement is dry. Standard commute routes clear.';

  if (currentRainChance >= 60 || currentCondition.toLowerCase().includes('rain') || currentCondition.toLowerCase().includes('storm')) {
    statusType = 'rain';
    status = isRushHourMorning ? 'Heavy rain possible with waterlogging risks' : 'Passing monsoon showers along corridor';
    weatherOnRoute = `${currentCondition} with ${currentRainChance}% precipitation chance`;
    recommendation = `Heavy rain detected along ${destination} route. Consider departing by ${formatMinutesToTime(depMinutes - 20)} to avoid peak downpour.`;
    alternativeAdvice = 'Elevated flyovers & metro commute recommended over low-lying underpasses during heavy rain.';
  } else if (currentRainChance >= 30) {
    statusType = 'alert';
    status = 'Moderate overcast with isolated drizzle';
    weatherOnRoute = `Passing clouds with ${currentRainChance}% rain probability`;
    recommendation = `Light showers possible near ${destination}. Carry an umbrella or light raincoat.`;
    alternativeAdvice = 'Road surface may have wet patches; maintain safe braking distance.';
  } else if (currentTemp >= 38) {
    statusType = 'alert';
    status = 'High heat & intense sun exposure';
    weatherOnRoute = `Sunny & hot (${currentTemp}°C)`;
    recommendation = `Hot afternoon sun. AC transport or shaded route advised. Keep hydrated.`;
    alternativeAdvice = 'Midday peak heat. Early morning or evening departure is ideal.';
  }

  // Generate 3 realistic checkpoints: Start -> Midway Transit -> Destination
  const arrivalMinutes = depMinutes + baseMinutes;
  const midwayMinutes = depMinutes + Math.floor(baseMinutes / 2);

  const midPointName = getRealisticMidpointName(origin, destination);

  const rainDeltaMid = currentRainChance > 40 ? 10 : 5;
  const rainDeltaEnd = currentRainChance > 40 ? 15 : 0;

  const stops = [
    {
      time: departureTime,
      pointName: origin,
      condition: currentRainChance > 50 ? 'Overcast' : currentCondition,
      rainProb: Math.max(10, currentRainChance - 10),
      temp: currentTemp,
      windSpeed: currentWind
    },
    {
      time: formatMinutesToTime(midwayMinutes),
      pointName: midPointName,
      condition: currentRainChance > 50 ? 'Scattered Rain' : (currentRainChance > 30 ? 'Overcast' : currentCondition),
      rainProb: Math.min(95, currentRainChance + rainDeltaMid),
      temp: Math.max(20, currentTemp - 1),
      windSpeed: currentWind + 2,
      hazard: currentRainChance > 55 ? 'Slow traffic / wet roadway' : undefined
    },
    {
      time: formatMinutesToTime(arrivalMinutes),
      pointName: destination,
      condition: currentRainChance > 60 ? 'Moderate Showers' : (currentRainChance > 35 ? 'Light Drizzle' : 'Partly Cloudy'),
      rainProb: Math.min(95, currentRainChance + rainDeltaEnd),
      temp: currentTemp,
      windSpeed: currentWind,
      hazard: currentRainChance > 65 ? 'Water pooling risk near destination' : undefined
    }
  ];

  return {
    id: existingId || `trip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: origin,
    to: destination,
    leaveBy: departureTime,
    estDuration,
    status,
    statusType,
    weatherOnRoute,
    safetyScore,
    recommendation,
    stops,
    alternativeAdvice
  };
}

/**
 * Generate a plausible transit midpoint label based on origin and destination
 */
function getRealisticMidpointName(origin: string, destination: string): string {
  const oLower = origin.toLowerCase();
  const dLower = destination.toLowerCase();

  if (oLower.includes('home') || dLower.includes('college')) {
    return 'Ring Road Junction';
  }
  if (oLower.includes('college') || dLower.includes('home')) {
    return 'City Center Crossway';
  }
  if (oLower.includes('office') || dLower.includes('tech park') || dLower.includes('cyber')) {
    return 'Expressway Flyover';
  }
  if (oLower.includes('station') || dLower.includes('airport')) {
    return 'Outer Bypass Corridor';
  }
  return 'Midway Transit Corridor';
}

/**
 * Load saved trips from localStorage with fallback to default
 */
export function getSavedTrips(): RouteTrip[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_TRIPS;

  try {
    const raw = localStorage.getItem(STORAGE_SAVED_TRIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[tripService] Could not parse saved trips from localStorage:', e);
  }

  return DEFAULT_SAVED_TRIPS;
}

/**
 * Persist saved trips list to localStorage
 */
export function saveTripsToStorage(trips: RouteTrip[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_SAVED_TRIPS, JSON.stringify(trips));
  } catch (e) {
    console.warn('[tripService] Could not write trips to localStorage:', e);
  }
}

/**
 * Load active trip from localStorage with fallback
 */
export function getActiveTrip(): RouteTrip {
  if (typeof window === 'undefined') return DEFAULT_ROUTE_TRIP;

  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_TRIP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.from && parsed.to) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[tripService] Could not parse active trip from localStorage:', e);
  }

  return DEFAULT_ROUTE_TRIP;
}

/**
 * Persist active trip to localStorage
 */
export function saveActiveTripToStorage(trip: RouteTrip): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_TRIP, JSON.stringify(trip));
  } catch (e) {
    console.warn('[tripService] Could not write active trip to localStorage:', e);
  }
}

/**
 * Reverse origin and destination (return leg) and recalculate conditions
 */
export function reverseTripRoute(trip: RouteTrip, currentWeather?: WeatherData): RouteTrip {
  const currentMins = parseTimeToMinutes(trip.leaveBy || '08:00 AM');
  // Default return leg is ~8 hours later or 5 PM
  const returnMins = currentMins < 12 * 60 ? Math.min(18 * 60, currentMins + 8 * 60) : (currentMins + 60);
  const returnTime = formatMinutesToTime(returnMins);

  return calculateTripRouteWeather(
    trip.to,
    trip.from,
    returnTime,
    currentWeather,
    `trip-rev-${Date.now()}`
  );
}
