'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, app } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register service worker for FCM
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(() => {
          console.log('Service Worker registered for FCM');
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    const initMessaging = async () => {
      const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      const messaging = getMessaging(app);
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        if (user) {
          // Request FCM token and save to Firestore
          try {
            const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' }); // Replace with actual VAPID key
            if (token) {
              await setDoc(doc(db, 'users', user.uid), { fcmToken: token }, { merge: true });
            }
          } catch (error) {
            console.error('Error getting FCM token:', error);
          }

          // Handle foreground messages
          onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            // Show notification or alert
            if (Notification.permission === 'granted') {
              new Notification(payload.notification?.title || 'Prayer Reminder', {
                body: payload.notification?.body,
                icon: '/icon-192x192.png'
              });
            }
          });
        }
        setLoading(false);
      });
      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    if (typeof window !== 'undefined') {
      initMessaging().then((unsub) => unsubscribe = unsub);
    } else {
      const unsub = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });
      unsubscribe = unsub;
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Configure admin email addresses here - only these users will have admin access
  const adminEmails = ['nate@necloud.us', 'nmemmert@outlook.com'];
  const isAdmin = user ? adminEmails.includes(user.email || '') : false;

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, isAdmin }}>
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