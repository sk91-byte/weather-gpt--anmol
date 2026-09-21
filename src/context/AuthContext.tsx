import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  subscribeToAuth,
  getUserProfile,
  UserProfileData,
  getUserSavedTrips,
  getUserTranscriptions,
  SavedTripRecord,
  AudioTranscriptionRecord
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  savedTrips: SavedTripRecord[];
  transcriptions: AudioTranscriptionRecord[];
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedTrips, setSavedTrips] = useState<SavedTripRecord[]>([]);
  const [transcriptions, setTranscriptions] = useState<AudioTranscriptionRecord[]>([]);

  const loadUserData = async (currentUser: User) => {
    try {
      const [userProf, trips, voiceLogs] = await Promise.all([
        getUserProfile(currentUser.uid),
        getUserSavedTrips(currentUser.uid),
        getUserTranscriptions(currentUser.uid)
      ]);
      setProfile(userProf);
      setSavedTrips(trips);
      setTranscriptions(voiceLogs);
    } catch (err) {
      console.warn('Error fetching user cloud data:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserData(currentUser);
      } else {
        setProfile(null);
        setSavedTrips([]);
        setTranscriptions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const loggedInUser = await signInWithGoogle();
      setUser(loggedInUser);
      await loadUserData(loggedInUser);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // Popup closed or cancelled by user is expected, don't crash
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(err?.message || 'Google sign-in could not be completed.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      setUser(null);
      setProfile(null);
      setSavedTrips([]);
      setTranscriptions([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        savedTrips,
        transcriptions,
        login,
        logout,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
