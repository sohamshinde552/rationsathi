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
exports.DiscrepancyLedgerTable = void 0;
const react_1 = __importStar(require("react"));
const DiscrepancyLedgerTable = ({ auditReport, onItemSelect, }) => {
    const [activeModalItem, setActiveModalItem] = (0, react_1.useState)(null);
    const getStatusBadge = (status) => {
        switch (status) {
            case 'FULL_DELIVERY':
                return (react_1.default.createElement("span", { style: {
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                    } }, "\u2713 Full Delivery"));
            case 'SHORTFALL':
                return (react_1.default.createElement("span", { style: {
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                    } }, "\u26A0\uFE0F Shortfall"));
            case 'LATE_DELIVERY':
                return (react_1.default.createElement("span", { style: {
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                    } }, "\u23F3 Late Delivery"));
            case 'UNCLEAR_RECORD':
                return (react_1.default.createElement("span", { style: {
                        backgroundColor: '#f1f5f9',
                        color: '#475569',
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 600,
                    } }, "\u2753 Unclear Record"));
            default:
                return react_1.default.createElement("span", null, status);
        }
    };
    return (react_1.default.createElement("div", { style: { fontFamily: 'sans-serif', margin: '20px 0' } },
        react_1.default.createElement("div", { style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
            } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h2", { style: { margin: 0, fontSize: '18px', color: '#0f172a' } },
                    "Discrepancy Audit Ledger \u2014 ",
                    auditReport.period),
                react_1.default.createElement("span", { style: { fontSize: '13px', color: '#64748b' } },
                    "Household: ",
                    react_1.default.createElement("strong", null, auditReport.household_id),
                    " | Registered Members:",
                    ' ',
                    react_1.default.createElement("strong", null, auditReport.household_members))),
            react_1.default.createElement("span", { style: { fontSize: '11px', color: '#94a3b8' } },
                "Audited at: ",
                new Date(auditReport.generated_at).toLocaleTimeString())),
        react_1.default.createElement("div", { style: { overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' } },
            react_1.default.createElement("table", { style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' } },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", { style: { backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' } },
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Item Name"),
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Expected (Baseline)"),
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Total Verified Received"),
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Calculated Shortfall"),
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Status"),
                        react_1.default.createElement("th", { style: { padding: '12px 16px', fontSize: '13px', color: '#475569' } }, "Evidence Count"))),
                react_1.default.createElement("tbody", null, auditReport.line_items.map((item, idx) => {
                    const hasShortfall = parseFloat(item.shortfall_qty) > 0;
                    return (react_1.default.createElement("tr", { key: idx, onClick: () => onItemSelect && onItemSelect(item), style: {
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        } },
                        react_1.default.createElement("td", { style: { padding: '12px 16px', fontWeight: 600, color: '#1e293b' } }, item.item_name),
                        react_1.default.createElement("td", { style: { padding: '12px 16px', color: '#334155' } },
                            item.baseline_qty,
                            " ",
                            item.unit),
                        react_1.default.createElement("td", { style: { padding: '12px 16px', color: '#334155' } },
                            item.received_qty,
                            " ",
                            item.unit),
                        react_1.default.createElement("td", { style: {
                                padding: '12px 16px',
                                fontWeight: hasShortfall ? 700 : 400,
                                color: hasShortfall ? '#dc2626' : '#16a34a',
                            } },
                            item.shortfall_qty,
                            " ",
                            item.unit),
                        react_1.default.createElement("td", { style: { padding: '12px 16px' } }, getStatusBadge(item.status)),
                        react_1.default.createElement("td", { style: { padding: '12px 16px' } }, item.linked_receipt_ids.length > 0 ? (react_1.default.createElement("button", { type: "button", onClick: (e) => {
                                e.stopPropagation();
                                setActiveModalItem(item);
                            }, style: {
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                            } },
                            item.linked_receipt_ids.length,
                            " Receipt",
                            item.linked_receipt_ids.length > 1 ? 's' : '',
                            " \uD83D\uDD0D")) : (react_1.default.createElement("span", { style: { fontSize: '12px', color: '#94a3b8' } }, "0 Receipts")))));
                })))),
        activeModalItem && (react_1.default.createElement("div", { style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }, onClick: () => setActiveModalItem(null) },
            react_1.default.createElement("div", { style: {
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '24px',
                    maxWidth: '540px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                }, onClick: (e) => e.stopPropagation() },
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    } },
                    react_1.default.createElement("h3", { style: { margin: 0, fontSize: '16px', color: '#0f172a' } },
                        "Linked Receipts for ",
                        activeModalItem.item_name),
                    react_1.default.createElement("button", { type: "button", onClick: () => setActiveModalItem(null), style: {
                            background: 'none',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#64748b',
                        } }, "\u2715")),
                react_1.default.createElement("p", { style: { fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' } },
                    "Line-by-line audit trail of verified receipts accounting for",
                    ' ',
                    react_1.default.createElement("strong", null,
                        activeModalItem.received_qty,
                        " ",
                        activeModalItem.unit),
                    " received:"),
                react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, activeModalItem.linked_receipt_details &&
                    activeModalItem.linked_receipt_details.length > 0 ? (activeModalItem.linked_receipt_details.map((detail, i) => (react_1.default.createElement("div", { key: i, style: {
                        padding: '10px 14px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        display: 'flex',
                        justifyContent: 'space-between',
                    } },
                    react_1.default.createElement("div", null,
                        react_1.default.createElement("strong", null, "Receipt ID:"),
                        " ",
                        detail.evidence_id || detail.transaction_id,
                        react_1.default.createElement("div", { style: { fontSize: '11px', color: '#64748b' } },
                            "Date: ",
                            detail.date_received)),
                    react_1.default.createElement("div", { style: { fontWeight: 600, color: '#0f172a' } },
                        "+",
                        detail.quantity_received,
                        " ",
                        activeModalItem.unit))))) : (react_1.default.createElement("div", { style: { fontSize: '13px', color: '#94a3b8' } },
                    "Linked Receipt IDs: ",
                    activeModalItem.linked_receipt_ids.join(', ')))),
                react_1.default.createElement("div", { style: { marginTop: '20px', textAlign: 'right' } },
                    react_1.default.createElement("button", { type: "button", onClick: () => setActiveModalItem(null), style: {
                            padding: '8px 16px',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                        } }, "Close")))))));
};
exports.DiscrepancyLedgerTable = DiscrepancyLedgerTable;
exports.default = exports.DiscrepancyLedgerTable;
