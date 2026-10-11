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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardLayout = void 0;
const react_1 = __importStar(require("react"));
const AuthContext_1 = require("../context/AuthContext");
const UserDashboard_1 = __importDefault(require("./UserDashboard"));
const LedgerEntryForm_1 = __importDefault(require("./LedgerEntryForm"));
const DiscrepancyReport_1 = __importDefault(require("./DiscrepancyReport"));
const DashboardLayout = () => {
    const { user, loading, signInWithPassword, signUp, signOut } = (0, AuthContext_1.useAuth)();
    const [currentView, setCurrentView] = (0, react_1.useState)('dashboard');
    const [authMode, setAuthMode] = (0, react_1.useState)('login');
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [fullName, setFullName] = (0, react_1.useState)('');
    const [householdId, setHouseholdId] = (0, react_1.useState)('HH-MUMBAI-04');
    const [authMessage, setAuthMessage] = (0, react_1.useState)(null);
    // Sample or state-backed report data for current tenant
    const [auditReport, setAuditReport] = (0, react_1.useState)({
        period: 'October 2026',
        household_id: 'HH-MUMBAI-04',
        household_members: 4,
        generated_at: new Date().toISOString(),
        line_items: [
            {
                item_name: 'Wheat',
                baseline_qty: '20.00',
                received_qty: '15.00',
                shortfall_qty: '5.00',
                unit: 'kg',
                status: 'SHORTFALL',
                linked_receipt_ids: ['REC-101', 'REC-104'],
            },
            {
                item_name: 'Rice',
                baseline_qty: '12.00',
                received_qty: '12.00',
                shortfall_qty: '0.00',
                unit: 'kg',
                status: 'FULL_DELIVERY',
                linked_receipt_ids: ['REC-104'],
            },
        ],
    });
    const reportData = {
        report: auditReport,
        evidence_items: [
            {
                evidence_id: 'REC-101',
                transaction_id: 'TXN-101',
                transaction_date: '2026-10-04',
                verified_item: 'Wheat',
                quantity_received: '8.00',
                unit: 'kg',
                source_type: 'Photo',
                reference_link: 'https://storage.rationsaathi.org/receipts/rec-101.jpg',
            },
            {
                evidence_id: 'REC-104',
                transaction_id: 'TXN-102',
                transaction_date: '2026-10-18',
                verified_item: 'Wheat & Rice',
                quantity_received: '7.00 + 12.00',
                unit: 'kg',
                source_type: 'Written Note',
                reference_link: 'https://storage.rationsaathi.org/receipts/rec-104.jpg',
            },
        ],
        scheme_name: 'National Food Security Act (NFSA)',
        ration_card_type: 'Priority Household (PHH)',
        head_of_family_name: fullName || 'Suresh Patil',
    };
    // Handle Supabase Login / Sign-up submit
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthMessage({ type: 'info', text: 'Contacting Supabase Auth...' });
        if (authMode === 'login') {
            const { error } = await signInWithPassword(email, password);
            if (error) {
                setAuthMessage({ type: 'error', text: error.message || 'Login failed.' });
            }
            else {
                setAuthMessage({ type: 'success', text: 'Authenticated successfully!' });
            }
        }
        else {
            const { error } = await signUp(email, password, {
                full_name: fullName,
                household_id: householdId,
            });
            if (error) {
                setAuthMessage({ type: 'error', text: error.message || 'Sign-up failed.' });
            }
            else {
                setAuthMessage({
                    type: 'success',
                    text: 'Account created! Please check your email or proceed directly.',
                });
            }
        }
    };
    // 1. ROUTE GUARD: If user is not authenticated, show login page
    if (loading) {
        return (react_1.default.createElement("div", { className: "flex items-center justify-center min-h-screen bg-slate-50 font-sans" },
            react_1.default.createElement("div", { className: "text-slate-600 font-semibold text-sm" }, "Verifying Supabase authentication session...")));
    }
    if (!user) {
        return (react_1.default.createElement("div", { id: "login-view", className: "flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4" },
            react_1.default.createElement("div", { className: "bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full shadow-sm" },
                react_1.default.createElement("div", { className: "text-center mb-6" },
                    react_1.default.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "RationSaathi Portal"),
                    react_1.default.createElement("p", { className: "text-sm text-slate-500 mt-1" }, authMode === 'login' ? 'Supabase Beneficiary Sign-In' : 'Create Beneficiary Account')),
                authMessage && (react_1.default.createElement("div", { className: `p-3 mb-4 rounded-lg text-xs font-semibold ${authMessage.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : authMessage.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'}` }, authMessage.text)),
                react_1.default.createElement("form", { onSubmit: handleAuthSubmit, className: "space-y-4" },
                    authMode === 'signup' && (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-xs font-semibold text-slate-700 uppercase mb-1" }, "Head of Family Full Name"),
                            react_1.default.createElement("input", { type: "text", required: true, value: fullName, onChange: (e) => setFullName(e.target.value), placeholder: "e.g. Suresh Patil", className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("label", { className: "block text-xs font-semibold text-slate-700 uppercase mb-1" }, "Household ID"),
                            react_1.default.createElement("input", { type: "text", required: true, value: householdId, onChange: (e) => setHouseholdId(e.target.value), placeholder: "e.g. HH-MUMBAI-04", className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" })))),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "block text-xs font-semibold text-slate-700 uppercase mb-1" }, "Beneficiary Email"),
                        react_1.default.createElement("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "beneficiary@rationsaathi.org", className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" })),
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("label", { className: "block text-xs font-semibold text-slate-700 uppercase mb-1" }, "Password"),
                        react_1.default.createElement("input", { type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" })),
                    react_1.default.createElement("button", { type: "submit", className: "w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition" }, authMode === 'login' ? 'Sign In with Supabase' : 'Create Supabase Account'),
                    react_1.default.createElement("div", { className: "text-center pt-2" },
                        react_1.default.createElement("button", { type: "button", onClick: () => {
                                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                setAuthMessage(null);
                            }, className: "text-xs text-blue-600 hover:text-blue-800 font-semibold" }, authMode === 'login'
                            ? "Don't have an account? Register here"
                            : 'Already registered? Sign In'))),
                react_1.default.createElement("div", { className: "relative my-6" },
                    react_1.default.createElement("div", { className: "absolute inset-0 flex items-center" },
                        react_1.default.createElement("div", { className: "w-full border-t border-slate-200" })),
                    react_1.default.createElement("div", { className: "relative flex justify-center text-xs uppercase" },
                        react_1.default.createElement("span", { className: "bg-white px-2 text-slate-500 font-semibold" }, "Or Instant Access"))),
                react_1.default.createElement("button", { type: "button", id: "btn-guest-demo", onClick: () => {
                        const demoUser = {
                            id: 'demo-123',
                            email: 'demo-beneficiary@rationsaathi.org',
                            user_metadata: { name: 'Demo Beneficiary' },
                        };
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('rationsaathi_mock_user', JSON.stringify(demoUser));
                        }
                        window.location.reload();
                    }, className: "w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer" },
                    react_1.default.createElement("span", null, "\uD83D\uDE80"),
                    react_1.default.createElement("span", null, "Start Hackathon Demo (No Sign-up Required)")))));
    }
    // 2. DASHBOARD SUB-ROUTES
    return (react_1.default.createElement("div", { className: "min-h-screen bg-slate-50" },
        currentView === 'dashboard' && (react_1.default.createElement(UserDashboard_1.default, { auditReport: auditReport, onNavigateToNewEntry: () => setCurrentView('add_entry'), onNavigateToReport: () => setCurrentView('report') })),
        currentView === 'add_entry' && (react_1.default.createElement("div", { className: "max-w-4xl mx-auto p-4 md:p-6 font-sans" },
            react_1.default.createElement("button", { onClick: () => setCurrentView('dashboard'), className: "mb-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition" }, "\u2190 Back to Dashboard"),
            react_1.default.createElement(LedgerEntryForm_1.default, { householdId: auditReport.household_id, userId: user.id, onSuccess: () => {
                    // Return to dashboard upon successful submission
                    setCurrentView('dashboard');
                } }))),
        currentView === 'report' && (react_1.default.createElement(DiscrepancyReport_1.default, { data: reportData, onBack: () => setCurrentView('dashboard') }))));
};
exports.DashboardLayout = DashboardLayout;
exports.default = exports.DashboardLayout;
