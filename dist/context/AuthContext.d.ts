import React, { ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string) => Promise<{
        error: any;
    }>;
    signInWithPassword: (email: string, password: string) => Promise<{
        error: AuthError | null;
        data: any;
    }>;
    signUp: (email: string, password: string, metadata?: {
        full_name?: string;
        household_id?: string;
    }) => Promise<{
        error: AuthError | null;
        data: any;
    }>;
    signOut: () => Promise<void>;
    setUserMock: (mockUser: User | null) => void;
}
declare const AuthContext: React.Context<AuthContextType | undefined>;
export declare const AuthProvider: React.FC<{
    children: ReactNode;
    initialUser?: User | null;
}>;
export declare const useAuth: () => AuthContextType;
export default AuthContext;
