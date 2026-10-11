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
exports.UserDashboard = void 0;
const react_1 = __importStar(require("react"));
const AuthContext_1 = require("../context/AuthContext");
const ledgerService_1 = require("../services/ledgerService");
const UserDashboard = ({ auditReport: initialReport, onNavigateToReport, onNavigateToNewEntry, onRefresh, }) => {
    const { user, signOut } = (0, AuthContext_1.useAuth)();
    const [liveEntries, setLiveEntries] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [errorMessage, setErrorMessage] = (0, react_1.useState)(null);
    // Pull real data using a useEffect calling fetchUserLedger
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        const loadLedgerData = async () => {
            setLoading(true);
            setErrorMessage(null);
            const res = await (0, ledgerService_1.fetchUserLedger)(user?.id);
            if (isMounted) {
                if (res.error) {
                    setErrorMessage(res.error);
                }
                else if (res.data) {
                    setLiveEntries(res.data);
                }
                setLoading(false);
            }
        };
        loadLedgerData();
        return () => {
            isMounted = false;
        };
    }, [user?.id]);
    // Compute live metrics from auditReport or fetched ledger entries
    let totalAllocated = 0;
    let totalReceived = 0;
    let totalShortfall = 0;
    for (const line of initialReport.line_items) {
        totalAllocated += parseFloat(line.baseline_qty) || 0;
        // If live entries are available from Supabase, sum them for this commodity
        const matchingLive = liveEntries.filter((entry) => entry.item_name.toLowerCase() === line.item_name.toLowerCase() && entry.user_verified);
        const receivedForLine = matchingLive.length > 0
            ? matchingLive.reduce((acc, curr) => acc + (parseFloat(String(curr.quantity_received)) || 0), 0)
            : parseFloat(line.received_qty) || 0;
        totalReceived += receivedForLine;
        const shortfallForLine = Math.max(0, (parseFloat(line.baseline_qty) || 0) - receivedForLine);
        totalShortfall += shortfallForLine;
    }
    const fulfillmentPercentage = totalAllocated > 0
        ? Math.min(100, Math.round((totalReceived / totalAllocated) * 100))
        : 0;
    return (react_1.default.createElement("div", { className: "max-w-5xl mx-auto p-4 md:p-6 font-sans" },
        react_1.default.createElement("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-200 gap-4" },
            react_1.default.createElement("div", null,
                react_1.default.createElement("div", { className: "flex items-center gap-2" },
                    react_1.default.createElement("span", { className: "text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded" }, "Supabase RLS Active"),
                    loading && (react_1.default.createElement("span", { className: "text-xs text-slate-400 animate-pulse" }, "Syncing database..."))),
                react_1.default.createElement("h1", { className: "text-2xl font-bold text-slate-900 mt-1" }, "RationSaathi Beneficiary Dashboard"),
                react_1.default.createElement("p", { className: "text-sm text-slate-500" },
                    "Household ID: ",
                    react_1.default.createElement("strong", { className: "text-slate-700" }, initialReport.household_id),
                    " | User:",
                    ' ',
                    react_1.default.createElement("span", { className: "text-slate-700" }, user?.email || 'Authenticated Beneficiary'))),
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                react_1.default.createElement("button", { onClick: onNavigateToNewEntry, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition" }, "+ Add Receipt"),
                react_1.default.createElement("button", { onClick: onNavigateToReport, className: "px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg shadow-sm transition" }, "\uD83D\uDCC4 View Official Report"),
                react_1.default.createElement("button", { onClick: signOut, className: "px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg transition" }, "Sign Out"))),
        errorMessage && (react_1.default.createElement("div", { className: "mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between" },
            react_1.default.createElement("div", { className: "flex items-center gap-2" },
                react_1.default.createElement("span", null, "\u26A0\uFE0F"),
                react_1.default.createElement("span", null,
                    react_1.default.createElement("strong", null, "Database Notice:"),
                    " ",
                    errorMessage)),
            react_1.default.createElement("button", { onClick: () => setErrorMessage(null), className: "text-amber-700 hover:text-amber-900 font-bold" }, "\u2715"))),
        react_1.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" },
            react_1.default.createElement("div", { className: "bg-white border border-slate-200 rounded-xl p-5 shadow-sm" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-500" }, "Total Monthly Allocation"),
                    react_1.default.createElement("span", { className: "p-2 bg-blue-50 text-blue-600 rounded-lg text-lg" }, "\u2696\uFE0F")),
                react_1.default.createElement("div", { className: "mt-4" },
                    react_1.default.createElement("span", { className: "text-3xl font-extrabold text-slate-900" }, totalAllocated.toFixed(2)),
                    react_1.default.createElement("span", { className: "text-sm font-medium text-slate-500 ml-1" }, "kg / units")),
                react_1.default.createElement("p", { className: "text-xs text-slate-500 mt-2" },
                    "Entitlement for ",
                    initialReport.household_members,
                    " members (",
                    initialReport.period,
                    ")")),
            react_1.default.createElement("div", { className: "bg-white border border-slate-200 rounded-xl p-5 shadow-sm" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-500" }, "Total Verified Received"),
                    react_1.default.createElement("span", { className: "p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg" }, "\uD83D\uDCE6")),
                react_1.default.createElement("div", { className: "mt-4" },
                    react_1.default.createElement("span", { className: "text-3xl font-extrabold text-emerald-600" }, totalReceived.toFixed(2)),
                    react_1.default.createElement("span", { className: "text-sm font-medium text-slate-500 ml-1" }, "kg / units")),
                react_1.default.createElement("div", { className: "mt-2 flex items-center gap-2" },
                    react_1.default.createElement("div", { className: "w-full bg-slate-100 rounded-full h-2 overflow-hidden" },
                        react_1.default.createElement("div", { className: "bg-emerald-500 h-2 rounded-full transition-all", style: { width: `${fulfillmentPercentage}%` } })),
                    react_1.default.createElement("span", { className: "text-xs font-semibold text-slate-600" },
                        fulfillmentPercentage,
                        "%"))),
            react_1.default.createElement("div", { className: "bg-white border border-slate-200 rounded-xl p-5 shadow-sm" },
                react_1.default.createElement("div", { className: "flex items-center justify-between" },
                    react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-500" }, "Documented Difference"),
                    react_1.default.createElement("span", { className: `p-2 rounded-lg text-lg ${totalShortfall > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}` }, "\u26A0\uFE0F")),
                react_1.default.createElement("div", { className: "mt-4" },
                    react_1.default.createElement("span", { className: `text-3xl font-extrabold ${totalShortfall > 0 ? 'text-amber-600' : 'text-emerald-600'}` }, totalShortfall.toFixed(2)),
                    react_1.default.createElement("span", { className: "text-sm font-medium text-slate-500 ml-1" }, "kg / units")),
                react_1.default.createElement("p", { className: "text-xs text-slate-500 mt-2" }, totalShortfall > 0
                    ? 'Recorded difference pending next distribution visit.'
                    : 'Full delivery fulfilled according to verified records.'))),
        react_1.default.createElement("div", { className: "bg-white border border-slate-200 rounded-xl p-6 shadow-sm" },
            react_1.default.createElement("div", { className: "flex justify-between items-center mb-4" },
                react_1.default.createElement("h2", { className: "text-lg font-bold text-slate-900" }, "Current Period Commodities"),
                react_1.default.createElement("span", { className: "text-xs font-medium text-slate-500" },
                    "Period: ",
                    initialReport.period)),
            react_1.default.createElement("div", { className: "overflow-x-auto" },
                react_1.default.createElement("table", { className: "w-full text-left text-sm" },
                    react_1.default.createElement("thead", null,
                        react_1.default.createElement("tr", { className: "bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold" },
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Commodity"),
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Allocated"),
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Documented Received"),
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Difference"),
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Status"),
                            react_1.default.createElement("th", { className: "py-3 px-4" }, "Receipts"))),
                    react_1.default.createElement("tbody", { className: "divide-y divide-slate-100" }, initialReport.line_items.map((line, idx) => {
                        const matchingLive = liveEntries.filter((entry) => entry.item_name.toLowerCase() === line.item_name.toLowerCase() && entry.user_verified);
                        const lineReceived = matchingLive.length > 0
                            ? matchingLive
                                .reduce((acc, curr) => acc + (parseFloat(String(curr.quantity_received)) || 0), 0)
                                .toFixed(2)
                            : line.received_qty;
                        const lineDiff = Math.max(0, (parseFloat(line.baseline_qty) || 0) - (parseFloat(lineReceived) || 0)).toFixed(2);
                        const lineStatus = parseFloat(lineDiff) > 0 ? 'SHORTFALL' : 'FULL_DELIVERY';
                        return (react_1.default.createElement("tr", { key: idx, className: "hover:bg-slate-50/50" },
                            react_1.default.createElement("td", { className: "py-3 px-4 font-bold text-slate-800" }, line.item_name),
                            react_1.default.createElement("td", { className: "py-3 px-4 text-slate-600" },
                                line.baseline_qty,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: "py-3 px-4 text-slate-600 font-medium" },
                                lineReceived,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: `py-3 px-4 font-semibold ${parseFloat(lineDiff) > 0 ? 'text-amber-600' : 'text-emerald-600'}` },
                                lineDiff,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: "py-3 px-4" },
                                react_1.default.createElement("span", { className: `text-xs px-2.5 py-1 rounded-full font-semibold ${lineStatus === 'FULL_DELIVERY'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'}` }, lineStatus)),
                            react_1.default.createElement("td", { className: "py-3 px-4 text-slate-500 text-xs" }, matchingLive.length > 0
                                ? `${matchingLive.length} verified (Live DB)`
                                : line.linked_receipt_ids.length > 0
                                    ? `${line.linked_receipt_ids.length} verified`
                                    : 'None')));
                    })))))));
};
exports.UserDashboard = UserDashboard;
exports.default = exports.UserDashboard;
