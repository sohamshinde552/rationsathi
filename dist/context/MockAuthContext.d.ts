import React, { ReactNode } from 'react';
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
declare const MockAuthContext: React.Context<MockAuthContextType | undefined>;
export declare const MockAuthProvider: React.FC<{
    children: ReactNode;
    initialUser?: UserProfile | null;
}>;
export declare const useMockAuth: () => MockAuthContextType;
export default MockAuthContext;
