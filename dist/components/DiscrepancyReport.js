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
exports.DiscrepancyReport = void 0;
const react_1 = __importStar(require("react"));
const ReportExporter_1 = __importDefault(require("./ReportExporter"));
const reportTemplate_1 = require("../reportTemplate");
const DiscrepancyReport = ({ data, onBack }) => {
    const reportRef = (0, react_1.useRef)(null);
    const [safetyCheckResult, setSafetyCheckResult] = (0, react_1.useState)(null);
    const { report, evidence_items, scheme_name, ration_card_type, head_of_family_name } = data;
    // Pre-flight check for neutral language
    const verifyNeutrality = () => {
        if (reportRef.current) {
            const renderedText = reportRef.current.innerText;
            const validation = (0, reportTemplate_1.validateNeutralLanguage)(renderedText);
            if (!validation.valid) {
                setSafetyCheckResult(`Security Alert: Prohibited terms found in DOM: ${validation.violations.join(', ')}`);
                return false;
            }
        }
        setSafetyCheckResult('✓ Neutral Language Guardrail Verified: 0 Banned Words Detected.');
        return true;
    };
    return (react_1.default.createElement("div", { className: "max-w-4xl mx-auto p-4 md:p-6 font-sans" },
        react_1.default.createElement("div", { className: "print:hidden flex justify-between items-center mb-6 pb-4 border-b border-slate-200" },
            react_1.default.createElement("button", { onClick: onBack, className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition" }, "\u2190 Back to Dashboard"),
            react_1.default.createElement("div", { className: "flex items-center gap-3" },
                safetyCheckResult && (react_1.default.createElement("span", { className: "text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200" }, safetyCheckResult)),
                react_1.default.createElement(ReportExporter_1.default, { containerId: "discrepancy-report-container", filename: `RationSaathi_${report.household_id}_Report.pdf`, onBeforeExport: verifyNeutrality }))),
        react_1.default.createElement("div", { ref: reportRef, id: "discrepancy-report-container", className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0" },
            react_1.default.createElement("div", { className: "border-b-2 border-slate-900 pb-4 mb-6" },
                react_1.default.createElement("div", { className: "flex justify-between items-start" },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("h1", { className: "text-2xl font-bold text-slate-900" }, "Administrative Entitlement Reconciliation Report"),
                        react_1.default.createElement("p", { className: "text-sm text-slate-500 mt-1" },
                            "Public Distribution Entitlement & Verification Audit Summary \u2022 Period:",
                            ' ',
                            react_1.default.createElement("strong", null, report.period))),
                    react_1.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-300 px-2 py-1 rounded" }, "Official Audit Copy"))),
            react_1.default.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm" },
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "text-xs font-semibold text-slate-500 uppercase" }, "Household ID"),
                    react_1.default.createElement("div", { className: "font-bold text-slate-900 mt-0.5" }, report.household_id)),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "text-xs font-semibold text-slate-500 uppercase" }, "Head of Family"),
                    react_1.default.createElement("div", { className: "font-bold text-slate-900 mt-0.5" }, head_of_family_name || 'Registered Beneficiary')),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "text-xs font-semibold text-slate-500 uppercase" }, "Family Members"),
                    react_1.default.createElement("div", { className: "font-bold text-slate-900 mt-0.5" },
                        report.household_members,
                        " Members")),
                react_1.default.createElement("div", null,
                    react_1.default.createElement("div", { className: "text-xs font-semibold text-slate-500 uppercase" }, "Scheme / Card Type"),
                    react_1.default.createElement("div", { className: "font-bold text-slate-900 mt-0.5" },
                        scheme_name || 'PDS',
                        " (",
                        ration_card_type || 'Standard',
                        ")"))),
            react_1.default.createElement("div", { className: "mb-6" },
                react_1.default.createElement("h2", { className: "text-base font-bold text-slate-900 mb-3" }, "1. Line-by-Line Entitlement & Delivery Reconciliation"),
                react_1.default.createElement("div", { className: "overflow-x-auto border border-slate-200 rounded-lg" },
                    react_1.default.createElement("table", { className: "w-full text-left text-sm" },
                        react_1.default.createElement("thead", { className: "bg-slate-100 text-slate-700 font-semibold border-b border-slate-200" },
                            react_1.default.createElement("tr", null,
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Item Description"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Allocated Entitlement"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Documented Goods Received"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Recorded Difference"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Reconciliation Status"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Evidence Reference"))),
                        react_1.default.createElement("tbody", { className: "divide-y divide-slate-100" }, report.line_items.map((line, idx) => (react_1.default.createElement("tr", { key: idx },
                            react_1.default.createElement("td", { className: "py-2.5 px-3 font-semibold text-slate-900" }, line.item_name),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-700" },
                                line.baseline_qty,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-700" },
                                line.received_qty,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 font-bold text-slate-900" },
                                line.shortfall_qty,
                                " ",
                                line.unit),
                            react_1.default.createElement("td", { className: "py-2.5 px-3" },
                                react_1.default.createElement("span", { className: "text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700" }, line.status)),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-xs text-blue-700" }, line.linked_receipt_ids.length > 0
                                ? line.linked_receipt_ids.map((id) => `Ref-${id}`).join(', ')
                                : 'None on record')))))))),
            react_1.default.createElement("div", { className: "mb-6" },
                react_1.default.createElement("h2", { className: "text-base font-bold text-slate-900 mb-3" }, "2. Evidence Appendix & Audit Provenance"),
                react_1.default.createElement("div", { className: "overflow-x-auto border border-slate-200 rounded-lg" },
                    react_1.default.createElement("table", { className: "w-full text-left text-sm" },
                        react_1.default.createElement("thead", { className: "bg-slate-100 text-slate-700 font-semibold border-b border-slate-200" },
                            react_1.default.createElement("tr", null,
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Receipt Reference ID"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Transaction Date"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Verified Commodity"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Documented Quantity"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Source Medium"),
                                react_1.default.createElement("th", { className: "py-2.5 px-3" }, "Direct Reference Link"))),
                        react_1.default.createElement("tbody", { className: "divide-y divide-slate-100" }, evidence_items.length > 0 ? (evidence_items.map((ev, idx) => (react_1.default.createElement("tr", { key: idx },
                            react_1.default.createElement("td", { className: "py-2.5 px-3 font-mono text-xs font-semibold text-slate-800" }, ev.evidence_id || ev.transaction_id),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-600" }, ev.transaction_date),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-800" }, ev.verified_item),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-800 font-medium" },
                                ev.quantity_received,
                                " ",
                                ev.unit),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-slate-600" }, ev.source_type),
                            react_1.default.createElement("td", { className: "py-2.5 px-3 text-xs text-blue-600 truncate max-w-xs" }, ev.reference_link))))) : (react_1.default.createElement("tr", null,
                            react_1.default.createElement("td", { colSpan: 6, className: "py-3 px-3 text-center text-slate-400 text-xs" }, "No physical receipts recorded for this period."))))))),
            react_1.default.createElement("div", { className: "bg-slate-50 border-l-4 border-slate-500 rounded p-4 text-xs text-slate-600 leading-relaxed mb-6" },
                react_1.default.createElement("strong", { className: "text-slate-800 block mb-1" }, "Administrative Notice:"),
                reportTemplate_1.NEUTRAL_DISCLAIMER_TEXT),
            react_1.default.createElement("div", { className: "flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3" },
                react_1.default.createElement("span", null,
                    "Document Reference: REC-AUDIT-",
                    report.household_id),
                react_1.default.createElement("span", null,
                    "Generated: ",
                    new Date(report.generated_at).toUTCString()),
                react_1.default.createElement("span", null, "Engine: RationSaathi Deterministic Core v1.0")))));
};
exports.DiscrepancyReport = DiscrepancyReport;
exports.default = exports.DiscrepancyReport;
