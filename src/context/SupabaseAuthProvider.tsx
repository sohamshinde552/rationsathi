import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError | null; data: any }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; household_id?: string }) => Promise<{ error: AuthError | null; data: any }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider: React.FC<{ children: ReactNode; initialUser?: User | null }> = ({
  children,
  initialUser = null,
}) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // 1. Fetch current session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (!error && session) {
          setSession(session);
          setUser(session.user);
        } else if (initialUser) {
          setUser(initialUser);
        }
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('[SupabaseAuthProvider] Failed to fetch session:', err);
      if (mounted) {
        if (initialUser) setUser(initialUser);
        setLoading(false);
      }
    });

    // 2. Real-time auth listener
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

  // Sign in with email and password
  const signInWithPassword = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (!res.error && res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
    }
    return { error: res.error, data: res.data };
  };

  // Sign up new user
  const signUp = async (
    email: string,
    password: string,
    metadata?: { full_name?: string; household_id?: string }
  ) => {
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
  };

  // Sign out
  const signOut = async () => {
    const res = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    return { error: res.error };
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithPassword,
        signUp,
        signOut,
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = (): SupabaseAuthContextType => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export default SupabaseAuthContext;
