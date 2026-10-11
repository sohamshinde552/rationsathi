import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  household_id: string;
  isGuest: boolean;
}

export interface MockAuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginAsGuest: () => void;
  loginWithEmail: (email: string) => void;
  logout: () => void;
}

const STORAGE_KEY = 'rationsaathi_mock_user';

const DEMO_GUEST_USER: UserProfile = {
  id: 'demo-123',
  name: 'New User (Guest Beneficiary)',
  email: 'demo-user@rationsaathi.org',
  household_id: 'HH-MUMBAI-04',
  isGuest: true,
};

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: ReactNode; initialUser?: UserProfile | null }> = ({
  children,
  initialUser,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialUser ?? null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If explicitly provided via props
    if (initialUser !== undefined) {
      setCurrentUser(initialUser);
      setLoading(false);
      return;
    }

    // SSR safety check: check if window / localStorage exists
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('[MockAuthContext] Failed to read localStorage user:', err);
      }
    }
    setLoading(false);
  }, [initialUser]);

  const loginAsGuest = () => {
    setCurrentUser(DEMO_GUEST_USER);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_GUEST_USER));
      } catch (err) {
        console.warn('[MockAuthContext] Failed to save localStorage user:', err);
      }
    }
  };

  const loginWithEmail = (email: string) => {
    const user: UserProfile = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      household_id: 'HH-MUMBAI-04',
      isGuest: false,
    };
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } catch (err) {
        console.warn('[MockAuthContext] Failed to save user session:', err);
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.warn('[MockAuthContext] Failed to remove user session:', err);
      }
    }
  };

  return (
    <MockAuthContext.Provider
      value={{
        currentUser,
        loading,
        loginAsGuest,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
};

export const useMockAuth = (): MockAuthContextType => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

export default MockAuthContext;
