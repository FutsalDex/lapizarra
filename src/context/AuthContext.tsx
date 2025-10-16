
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { getFirestore, doc, onSnapshot, Timestamp, setDoc, type Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { getFunctions, type Functions } from 'firebase/functions';

interface UserProfile {
    role: 'Registered' | 'Subscribed' | 'Admin';
    subscription: 'Trial' | 'Básico' | 'Pro';
    subscriptionStartDate?: Timestamp;
    subscriptionEndDate?: Timestamp;
    referralCode?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  db: Firestore;
  auth: Auth;
  functions: Functions;
  trialDaysLeft: number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const functions = getFunctions(auth.app);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const profileData = docSnap.data() as UserProfile;
                setUserProfile(profileData);
                
                if (profileData.subscription === 'Trial' && profileData.subscriptionEndDate) {
                    const endDate = profileData.subscriptionEndDate.toDate();
                    const now = new Date();
                    const diffTime = endDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setTrialDaysLeft(diffDays);
                } else {
                    setTrialDaysLeft(null);
                }

            } else {
                try {
                    const referralCode = `REF-${user.uid.substring(0, 6).toUpperCase()}`;
                    const trialEndDate = new Date();
                    trialEndDate.setDate(trialEndDate.getDate() + 30);
                    
                    await setDoc(userDocRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName || user.email?.split('@')[0],
                        photoURL: user.photoURL,
                        createdAt: new Date(),
                        favorites: [],
                        role: 'Registered',
                        subscription: 'Trial',
                        subscriptionStartDate: new Date(),
                        subscriptionEndDate: trialEndDate,
                        referralCode: referralCode,
                    });
                } catch (error) {
                    console.error("Error creating user document in AuthContext:", error);
                }
            }
        });
        
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setTrialDaysLeft(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, db, auth, functions, trialDaysLeft }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
