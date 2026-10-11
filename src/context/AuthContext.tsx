import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null; data: any }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; household_id?: string }) => Promise<{ error: AuthError | null; data: any }>;
  signOut: () => Promise<void>;
  setUserMock: (mockUser: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode; initialUser?: User | null }> = ({
  children,
  initialUser = null,
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // 1. If an initial mock user is provided for testing or local simulation
    if (initialUser) {
      setUser(initialUser);
      setLoading(false);
      return;
    }

    // 2. Real Supabase Session initialization
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (mounted) {
          if (!error && session) {
            setSession(session);
            setUser(session.user);
          } else if (typeof window !== 'undefined') {
            // Check for persistent localStorage mock/guest session if offline
            const stored = localStorage.getItem('rationsaathi_mock_user');
            if (stored) {
              try {
                setUser(JSON.parse(stored));
              } catch (e) {}
            }
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[AuthProvider] Supabase getSession error:', err);
        if (mounted) setLoading(false);
      });

    // 3. Real-time auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialUser]);

  // Real Supabase Email/Password Sign-In
  const signInWithPassword = async (email: string, password: string) => {
    try {
      const res = await supabase.auth.signInWithPassword({ email, password });
      if (!res.error && res.data.user) {
        setUser(res.data.user);
        setSession(res.data.session);
      }
      return { error: res.error, data: res.data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  // Real Supabase Sign-Up
  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; household_id?: string }
  ) => {
    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });
      if (!res.error && res.data.user) {
        setUser(res.data.user);
        setSession(res.data.session);
      }
      return { error: res.error, data: res.data };
    } catch (err: any) {
      return { error: err, data: null };
    }
  };

  // OTP or Magic Link Sign-In
  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  // Sign-Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Signout warning:', err);
    }
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rationsaathi_mock_user');
      localStorage.removeItem('rationsaathi_user');
    }
  };

  const setUserMock = (mockUser: User | null) => {
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signInWithPassword,
        signUp,
        signOut,
        setUserMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
