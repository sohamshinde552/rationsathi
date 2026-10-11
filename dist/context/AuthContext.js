"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = void 0;
const react_1 = __importStar(require("react"));
const supabaseClient_1 = require("../lib/supabaseClient");
const AuthContext = (0, react_1.createContext)(undefined);
const AuthProvider = ({ children, initialUser = null, }) => {
    const [user, setUser] = (0, react_1.useState)(initialUser);
    const [session, setSession] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        // 1. If an initial mock user is provided for testing or local simulation
        if (initialUser) {
            setUser(initialUser);
            setLoading(false);
            return;
        }
        // 2. Real Supabase Session initialization
        supabaseClient_1.supabase.auth
            .getSession()
            .then(({ data: { session }, error }) => {
            if (mounted) {
                if (!error && session) {
                    setSession(session);
                    setUser(session.user);
                }
                else if (typeof window !== 'undefined') {
                    // Check for persistent localStorage mock/guest session if offline
                    const stored = localStorage.getItem('rationsaathi_mock_user');
                    if (stored) {
                        try {
                            setUser(JSON.parse(stored));
                        }
                        catch (e) { }
                    }
                }
                setLoading(false);
            }
        })
            .catch((err) => {
            console.warn('[AuthProvider] Supabase getSession error:', err);
            if (mounted)
                setLoading(false);
        });
        // 3. Real-time auth listener
        const { data: { subscription }, } = supabaseClient_1.supabase.auth.onAuthStateChange((_event, newSession) => {
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
    const signInWithPassword = async (email, password) => {
        try {
            const res = await supabaseClient_1.supabase.auth.signInWithPassword({ email, password });
            if (!res.error && res.data.user) {
                setUser(res.data.user);
                setSession(res.data.session);
            }
            return { error: res.error, data: res.data };
        }
        catch (err) {
            return { error: err, data: null };
        }
    };
    // Real Supabase Sign-Up
    const signUp = async (email, password, metadata) => {
        try {
            const res = await supabaseClient_1.supabase.auth.signUp({
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
        }
        catch (err) {
            return { error: err, data: null };
        }
    };
    // OTP or Magic Link Sign-In
    const signIn = async (email) => {
        try {
            const { error } = await supabaseClient_1.supabase.auth.signInWithOtp({ email });
            return { error };
        }
        catch (err) {
            return { error: err };
        }
    };
    // Sign-Out
    const signOut = async () => {
        try {
            await supabaseClient_1.supabase.auth.signOut();
        }
        catch (err) {
            console.warn('Signout warning:', err);
        }
        setUser(null);
        setSession(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('rationsaathi_mock_user');
            localStorage.removeItem('rationsaathi_user');
        }
    };
    const setUserMock = (mockUser) => {
        setUser(mockUser);
    };
    return (react_1.default.createElement(AuthContext.Provider, { value: {
            user,
            session,
            loading,
            signIn,
            signInWithPassword,
            signUp,
            signOut,
            setUserMock,
        } }, children));
};
exports.AuthProvider = AuthProvider;
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
exports.default = AuthContext;
