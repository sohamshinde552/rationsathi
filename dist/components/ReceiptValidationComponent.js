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
exports.ReceiptValidationComponent = void 0;
const react_1 = __importStar(require("react"));
const ReceiptValidationComponent = ({ householdId, evidenceId, initialData, onSuccess, apiBaseUrl = 'http://localhost:3000', }) => {
    const [dateReceived, setDateReceived] = (0, react_1.useState)(initialData.extracted_date || new Date().toISOString().split('T')[0]);
    const [items, setItems] = (0, react_1.useState)(initialData.candidate_items.map((c) => ({
        item_name: c.item_name || '',
        quantity_received: c.extracted_qty !== null ? String(c.extracted_qty) : '',
        unit: c.extracted_unit || 'kg',
        confidence: c.confidence,
    })));
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [feedback, setFeedback] = (0, react_1.useState)(null);
    const handleItemChange = (index, field, val) => {
        setItems((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: val };
            return updated;
        });
    };
    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { item_name: '', quantity_received: '', unit: 'kg', confidence: 1.0 },
        ]);
    };
    const handleRemoveItem = (index) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };
    const handleConfirmAndSave = async () => {
        setFeedback(null);
        // Validation
        if (!dateReceived) {
            setFeedback({ type: 'error', message: 'Receipt Date is required.' });
            return;
        }
        if (items.length === 0) {
            setFeedback({ type: 'error', message: 'At least one item must be verified.' });
            return;
        }
        for (const itm of items) {
            if (!itm.item_name.trim()) {
                setFeedback({ type: 'error', message: 'Item name cannot be empty.' });
                return;
            }
            const qtyNum = parseFloat(itm.quantity_received);
            if (isNaN(qtyNum) || qtyNum < 0) {
                setFeedback({
                    type: 'error',
                    message: `Invalid quantity for item "${itm.item_name}". Must be non-negative number.`,
                });
                return;
            }
        }
        setSubmitting(true);
        try {
            // AIR-GAP GATE: Payload explicitly sets user_verified = true
            const payload = {
                household_id: householdId,
                evidence_id: evidenceId || null,
                date_received: dateReceived,
                user_verified: true,
                items: items.map((i) => ({
                    item_name: i.item_name.trim(),
                    quantity_received: i.quantity_received.trim(),
                    unit: i.unit.trim(),
                })),
            };
            const res = await fetch(`${apiBaseUrl}/api/receipts/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = (await res.json());
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to submit verified data.');
            }
            setFeedback({
                type: 'success',
                message: 'Successfully verified & committed data to distribution ledger.',
            });
            if (onSuccess)
                onSuccess(json.data);
        }
        catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Network error submitting verification.',
            });
        }
        finally {
            setSubmitting(false);
        }
    };
    return (react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif' } },
        react_1.default.createElement("div", { style: {
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                color: '#1e40af',
                fontSize: '14px',
            } },
            react_1.default.createElement("strong", null, "\uD83D\uDEE1\uFE0F Air-Gap Gate Active:"),
            " Values extracted by AI are suggestions only. The database ledger will ",
            react_1.default.createElement("em", null, "never"),
            " accept unverified automated data until explicitly confirmed below."),
        feedback && (react_1.default.createElement("div", { style: {
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: feedback.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                fontSize: '14px',
            } }, feedback.message)),
        react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } },
            react_1.default.createElement("div", { style: {
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                } },
                react_1.default.createElement("h3", { style: { margin: '0 0 12px 0', fontSize: '16px', color: '#334155' } }, "Original Receipt Evidence"),
                initialData.image_url ? (react_1.default.createElement("div", { style: { marginBottom: '12px', textAlign: 'center' } },
                    react_1.default.createElement("img", { src: initialData.image_url, alt: "Receipt Evidence", style: {
                            maxWidth: '100%',
                            maxHeight: '350px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                        } }))) : (react_1.default.createElement("div", { style: {
                        padding: '24px',
                        textAlign: 'center',
                        backgroundColor: '#e2e8f0',
                        color: '#64748b',
                        borderRadius: '6px',
                        marginBottom: '12px',
                        fontSize: '13px',
                    } }, "No image file provided (Pasted raw text input)")),
                react_1.default.createElement("label", { style: { fontSize: '12px', fontWeight: 600, color: '#64748b' } }, "Raw OCR / Pasted Text Stream:"),
                react_1.default.createElement("pre", { style: {
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        padding: '12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '220px',
                        overflowY: 'auto',
                    } }, initialData.raw_text || 'No text extracted.'),
                initialData.parsing_notes && initialData.parsing_notes.length > 0 && (react_1.default.createElement("div", { style: { marginTop: '12px' } },
                    react_1.default.createElement("span", { style: { fontSize: '12px', fontWeight: 600, color: '#64748b' } }, "Parser Diagnostics:"),
                    react_1.default.createElement("ul", { style: { margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#64748b' } }, initialData.parsing_notes.map((note, idx) => (react_1.default.createElement("li", { key: idx }, note))))))),
            react_1.default.createElement("div", { style: {
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                } },
                react_1.default.createElement("div", { style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px',
                    } },
                    react_1.default.createElement("h3", { style: { margin: 0, fontSize: '16px', color: '#1e293b' } }, "Verification & Ledger Entry"),
                    react_1.default.createElement("span", { style: {
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '999px',
                            border: '1px solid #fde68a',
                        } }, "Unconfirmed Suggestion")),
                react_1.default.createElement("div", { style: { marginBottom: '16px' } },
                    react_1.default.createElement("label", { style: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' } }, "Receipt Date:"),
                    react_1.default.createElement("input", { type: "date", value: dateReceived, onChange: (e) => setDateReceived(e.target.value), style: {
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            boxSizing: 'border-box',
                        } })),
                react_1.default.createElement("label", { style: { display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' } }, "Disbursed Items:"),
                react_1.default.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, items.map((item, idx) => (react_1.default.createElement("div", { key: idx, style: {
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '12px',
                        backgroundColor: '#f8fafc',
                    } },
                    react_1.default.createElement("div", { style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px',
                        } },
                        react_1.default.createElement("span", { style: {
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: item.confidence > 0.8 ? '#dcfce7' : '#fee2e2',
                                color: item.confidence > 0.8 ? '#15803d' : '#b91c1c',
                                fontWeight: 600,
                            } },
                            "AI Confidence: ",
                            Math.round(item.confidence * 100),
                            "%"),
                        react_1.default.createElement("button", { type: "button", onClick: () => handleRemoveItem(idx), style: {
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '12px',
                                cursor: 'pointer',
                            } }, "Remove")),
                    react_1.default.createElement("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' } },
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("span", { style: { fontSize: '11px', color: '#64748b' } }, "Item Name"),
                            react_1.default.createElement("input", { type: "text", placeholder: "e.g. Wheat", value: item.item_name, onChange: (e) => handleItemChange(idx, 'item_name', e.target.value), style: {
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box',
                                } })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("span", { style: { fontSize: '11px', color: '#64748b' } }, "Quantity"),
                            react_1.default.createElement("input", { type: "number", step: "any", placeholder: "e.g. 15.0", value: item.quantity_received, onChange: (e) => handleItemChange(idx, 'quantity_received', e.target.value), style: {
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box',
                                } })),
                        react_1.default.createElement("div", null,
                            react_1.default.createElement("span", { style: { fontSize: '11px', color: '#64748b' } }, "Unit"),
                            react_1.default.createElement("input", { type: "text", placeholder: "kg / liter", value: item.unit, onChange: (e) => handleItemChange(idx, 'unit', e.target.value), style: {
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box',
                                } }))))))),
                react_1.default.createElement("button", { type: "button", onClick: handleAddItem, style: {
                        marginTop: '12px',
                        padding: '6px 12px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#334155',
                    } }, "+ Add Another Item"),
                react_1.default.createElement("div", { style: { marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' } },
                    react_1.default.createElement("button", { type: "button", disabled: submitting, onClick: handleConfirmAndSave, style: {
                            width: '100%',
                            padding: '12px',
                            backgroundColor: submitting ? '#94a3b8' : '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        } }, submitting ? 'Committing to Ledger...' : 'Confirm & Save to Ledger (user_verified = TRUE)'))))));
};
exports.ReceiptValidationComponent = ReceiptValidationComponent;
exports.default = exports.ReceiptValidationComponent;
