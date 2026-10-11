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
exports.useSupabaseAuth = exports.SupabaseAuthProvider = void 0;
const react_1 = __importStar(require("react"));
const supabaseClient_1 = require("../lib/supabaseClient");
const SupabaseAuthContext = (0, react_1.createContext)(undefined);
const SupabaseAuthProvider = ({ children, initialUser = null, }) => {
    const [user, setUser] = (0, react_1.useState)(initialUser);
    const [session, setSession] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        // 1. Fetch current session on mount
        supabaseClient_1.supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (mounted) {
                if (!error && session) {
                    setSession(session);
                    setUser(session.user);
                }
                else if (initialUser) {
                    setUser(initialUser);
                }
                setLoading(false);
            }
        }).catch((err) => {
            console.warn('[SupabaseAuthProvider] Failed to fetch session:', err);
            if (mounted) {
                if (initialUser)
                    setUser(initialUser);
                setLoading(false);
            }
        });
        // 2. Real-time auth listener
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
    // Sign in with email and password
    const signInWithPassword = async (email, password) => {
        const res = await supabaseClient_1.supabase.auth.signInWithPassword({ email, password });
        if (!res.error && res.data.user) {
            setUser(res.data.user);
            setSession(res.data.session);
        }
        return { error: res.error, data: res.data };
    };
    // Sign up new user
    const signUp = async (email, password, metadata) => {
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
    };
    // Sign out
    const signOut = async () => {
        const res = await supabaseClient_1.supabase.auth.signOut();
        setUser(null);
        setSession(null);
        return { error: res.error };
    };
    return (react_1.default.createElement(SupabaseAuthContext.Provider, { value: {
            user,
            session,
            loading,
            signInWithPassword,
            signUp,
            signOut,
        } }, children));
};
exports.SupabaseAuthProvider = SupabaseAuthProvider;
const useSupabaseAuth = () => {
    const context = (0, react_1.useContext)(SupabaseAuthContext);
    if (!context) {
        throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
    }
    return context;
};
exports.useSupabaseAuth = useSupabaseAuth;
exports.default = SupabaseAuthContext;
