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
exports.useMockAuth = exports.MockAuthProvider = void 0;
const react_1 = __importStar(require("react"));
const STORAGE_KEY = 'rationsaathi_mock_user';
const DEMO_GUEST_USER = {
    id: 'demo-123',
    name: 'New User (Guest Beneficiary)',
    email: 'demo-user@rationsaathi.org',
    household_id: 'HH-MUMBAI-04',
    isGuest: true,
};
const MockAuthContext = (0, react_1.createContext)(undefined);
const MockAuthProvider = ({ children, initialUser, }) => {
    const [currentUser, setCurrentUser] = (0, react_1.useState)(initialUser ?? null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
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
            }
            catch (err) {
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
            }
            catch (err) {
                console.warn('[MockAuthContext] Failed to save localStorage user:', err);
            }
        }
    };
    const loginWithEmail = (email) => {
        const user = {
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
            }
            catch (err) {
                console.warn('[MockAuthContext] Failed to save user session:', err);
            }
        }
    };
    const logout = () => {
        setCurrentUser(null);
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem(STORAGE_KEY);
            }
            catch (err) {
                console.warn('[MockAuthContext] Failed to remove user session:', err);
            }
        }
    };
    return (react_1.default.createElement(MockAuthContext.Provider, { value: {
            currentUser,
            loading,
            loginAsGuest,
            loginWithEmail,
            logout,
        } }, children));
};
exports.MockAuthProvider = MockAuthProvider;
const useMockAuth = () => {
    const context = (0, react_1.useContext)(MockAuthContext);
    if (!context) {
        throw new Error('useMockAuth must be used within a MockAuthProvider');
    }
    return context;
};
exports.useMockAuth = useMockAuth;
exports.default = MockAuthContext;
