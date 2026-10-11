import React, { ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
export interface SupabaseAuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
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
    signOut: () => Promise<{
        error: AuthError | null;
    }>;
}
declare const SupabaseAuthContext: React.Context<SupabaseAuthContextType | undefined>;
export declare const SupabaseAuthProvider: React.FC<{
    children: ReactNode;
    initialUser?: User | null;
}>;
export declare const useSupabaseAuth: () => SupabaseAuthContextType;
export default SupabaseAuthContext;
