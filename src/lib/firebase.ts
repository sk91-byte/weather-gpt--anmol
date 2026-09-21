import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore (specifying database ID from config)
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Connection test on initial boot as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}
testConnection();

// ==========================================
// Authentication Helpers
// ==========================================
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  await syncUserProfile(user);
  return user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await syncUserProfile(user);
      } catch (err) {
        console.warn('Could not sync user profile to firestore:', err);
      }
    }
    callback(user);
  });
}

// ==========================================
// User Profile Persistence
// ==========================================
export interface UserProfileData {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferredVehicle?: string;
  safetyPreference?: string;
  defaultOrigin?: string;
  defaultDestination?: string;
  updatedAt?: any;
}

export async function syncUserProfile(user: User): Promise<void> {
  if (!user.uid) return;
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Weather Explorer',
      photoURL: user.photoURL || '',
      preferredVehicle: 'Car',
      safetyPreference: 'Balanced',
      defaultOrigin: 'New Delhi, Delhi NCR',
      defaultDestination: 'Gurugram Cyber Hub, Haryana',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } else {
    await setDoc(userRef, {
      displayName: user.displayName || userDoc.data()?.displayName || 'Weather Explorer',
      photoURL: user.photoURL || userDoc.data()?.photoURL || '',
      email: user.email || userDoc.data()?.email || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfileData;
    }
  } catch (err) {
    console.warn('Failed to load user profile from firestore:', err);
  }
  return null;
}

// ==========================================
// Saved Trips Persistence
// ==========================================
export interface SavedTripRecord {
  id?: string;
  userId: string;
  fromName: string;
  toName: string;
  selectedMode: string;
  safetyScore: number;
  weatherSummary?: string;
  notes?: string;
  durationMin?: number;
  distanceKm?: number;
  routeId?: string;
  destinationCoords?: { lat: number; lng: number };
  createdAt: string;
}

export async function saveTripToFirestore(userId: string, trip: Omit<SavedTripRecord, 'userId' | 'createdAt'>): Promise<string> {
  const collRef = collection(db, 'users', userId, 'savedTrips');
  const docRef = await addDoc(collRef, {
    ...trip,
    userId,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getUserSavedTrips(userId: string): Promise<SavedTripRecord[]> {
  try {
    const collRef = collection(db, 'users', userId, 'savedTrips');
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as SavedTripRecord[];
  } catch (err) {
    console.warn('Failed to fetch saved trips:', err);
    return [];
  }
}

export async function deleteSavedTripFromFirestore(userId: string, tripId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'savedTrips', tripId);
  await deleteDoc(docRef);
}

// ==========================================
// Gemini Chat Threads & Messages Persistence
// ==========================================
export interface ChatThreadRecord {
  id?: string;
  userId: string;
  title: string;
  model: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id?: string;
  threadId: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  groundingSources?: any[];
  createdAt: string;
}

export async function createChatThread(userId: string, title: string, model: string, role: string): Promise<string> {
  const collRef = collection(db, 'users', userId, 'chatThreads');
  const docRef = await addDoc(collRef, {
    userId,
    title,
    model,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getUserChatThreads(userId: string): Promise<ChatThreadRecord[]> {
  try {
    const collRef = collection(db, 'users', userId, 'chatThreads');
    const q = query(collRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as ChatThreadRecord[];
  } catch (err) {
    console.warn('Failed to fetch chat threads:', err);
    return [];
  }
}

export async function saveChatMessage(
  userId: string,
  threadId: string,
  msg: { role: 'user' | 'model'; text: string; modelUsed?: string; groundingSources?: any[] }
): Promise<string> {
  const collRef = collection(db, 'users', userId, 'chatThreads', threadId, 'messages');
  const docRef = await addDoc(collRef, {
    ...msg,
    threadId,
    userId,
    createdAt: new Date().toISOString()
  });

  // Update thread updatedAt
  const threadRef = doc(db, 'users', userId, 'chatThreads', threadId);
  await setDoc(threadRef, { updatedAt: new Date().toISOString() }, { merge: true });

  return docRef.id;
}

export async function getThreadMessages(userId: string, threadId: string): Promise<ChatMessageRecord[]> {
  try {
    const collRef = collection(db, 'users', userId, 'chatThreads', threadId, 'messages');
    const q = query(collRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as ChatMessageRecord[];
  } catch (err) {
    console.warn('Failed to fetch thread messages:', err);
    return [];
  }
}

// ==========================================
// Audio Transcriptions Persistence
// ==========================================
export interface AudioTranscriptionRecord {
  id?: string;
  userId: string;
  text: string;
  durationSeconds?: number;
  createdAt: string;
}

export async function saveAudioTranscription(userId: string, text: string, durationSeconds?: number): Promise<string> {
  const collRef = collection(db, 'users', userId, 'transcriptions');
  const docRef = await addDoc(collRef, {
    userId,
    text,
    durationSeconds: durationSeconds || 0,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function getUserTranscriptions(userId: string): Promise<AudioTranscriptionRecord[]> {
  try {
    const collRef = collection(db, 'users', userId, 'transcriptions');
    const q = query(collRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as AudioTranscriptionRecord[];
  } catch (err) {
    console.warn('Failed to fetch transcriptions:', err);
    return [];
  }
}
