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
exports.MainWorkflow = void 0;
const react_1 = __importStar(require("react"));
const ValidationModal_1 = __importDefault(require("./ValidationModal"));
const LanguageSelector_1 = __importDefault(require("./LanguageSelector"));
const MainWorkflow = ({ initialLanguage = 'en', onCommitSuccess, apiBaseUrl = '', }) => {
    const [currentStep, setCurrentStep] = (0, react_1.useState)(1);
    const [language, setLanguage] = (0, react_1.useState)(initialLanguage);
    const [modalOpen, setModalOpen] = (0, react_1.useState)(false);
    const [statusMessage, setStatusMessage] = (0, react_1.useState)(null);
    const [form, setForm] = (0, react_1.useState)({
        familyCount: 4,
        schemeName: 'National Food Security Act (NFSA)',
        quotaPerMember: 5.0,
        receiptText: 'Fair Price Shop Visit\nDate: 2026-10-04\nWheat: 8.00 kg',
        receiptDate: '2026-10-04',
        itemName: 'Wheat',
        quantityReceived: '8.00',
        userVerified: false,
    });
    const baselineEntitlement = (form.familyCount * form.quotaPerMember).toFixed(2);
    const handleNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep((prev) => (prev + 1));
        }
    };
    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1));
        }
    };
    const handleCommit = async () => {
        setStatusMessage(null);
        if (!form.userVerified) {
            setModalOpen(true);
            return;
        }
        try {
            const payload = {
                household_id: 'HH-MUMBAI-04',
                evidence_id: `REC-${Date.now().toString().slice(-4)}`,
                date_received: form.receiptDate,
                user_verified: true,
                items: [
                    {
                        item_name: form.itemName,
                        quantity_received: form.quantityReceived,
                        unit: 'kg',
                    },
                ],
            };
            const res = await fetch(`${apiBaseUrl}/api/receipts/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Failed to submit verification.');
            }
            setStatusMessage({
                type: 'success',
                text: 'Successfully committed verified receipt to the ledger!',
            });
            if (onCommitSuccess)
                onCommitSuccess(json.data);
        }
        catch (err) {
            setStatusMessage({
                type: 'error',
                text: err.message || 'Error communicating with server.',
            });
        }
    };
    return (react_1.default.createElement("div", { style: { maxWidth: '640px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' } },
        react_1.default.createElement("div", { style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid #e2e8f0',
            } },
            react_1.default.createElement("div", null,
                react_1.default.createElement("h1", { style: { margin: 0, fontSize: '20px', color: '#0f172a' } }, "RationSaathi"),
                react_1.default.createElement("span", { style: { fontSize: '12px', color: '#64748b' } }, "Citizen Entitlement Assistant")),
            react_1.default.createElement(LanguageSelector_1.default, { currentLanguage: language, onLanguageChange: setLanguage })),
        react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' } }, [
            { step: 1, label: '1. Setup' },
            { step: 2, label: '2. Evidence' },
            { step: 3, label: '3. Review' },
        ].map((s) => (react_1.default.createElement("div", { key: s.step, onClick: () => setCurrentStep(s.step), style: {
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer',
                borderBottom: currentStep >= s.step ? '3px solid #2563eb' : '3px solid #e2e8f0',
                paddingBottom: '8px',
                color: currentStep >= s.step ? '#2563eb' : '#94a3b8',
                fontWeight: currentStep === s.step ? 700 : 500,
                fontSize: '14px',
            } }, s.label)))),
        statusMessage && (react_1.default.createElement("div", { style: {
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
                fontSize: '14px',
            } }, statusMessage.text)),
        currentStep === 1 && (react_1.default.createElement("div", { style: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' } },
            react_1.default.createElement("h2", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' } }, "Step 1: Household Entitlement Setup"),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' } }, "Number of Family Members in Ration Card:"),
            react_1.default.createElement("input", { type: "number", min: "1", max: "25", value: form.familyCount, onChange: (e) => setForm({ ...form, familyCount: parseInt(e.target.value, 10) || 1 }), style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                } }),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' } }, "Applicable Scheme:"),
            react_1.default.createElement("input", { type: "text", value: form.schemeName, readOnly: true, style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box',
                } }),
            react_1.default.createElement("div", { style: {
                    marginTop: '20px',
                    padding: '16px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                } },
                react_1.default.createElement("div", { style: { fontSize: '13px', color: '#1e40af' } }, "Calculated Total Monthly Entitlement:"),
                react_1.default.createElement("div", { style: { fontSize: '24px', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' } },
                    baselineEntitlement,
                    " kg Wheat"),
                react_1.default.createElement("div", { style: { fontSize: '12px', color: '#3b82f6', marginTop: '2px' } },
                    "(",
                    form.familyCount,
                    " members \u00D7 ",
                    form.quotaPerMember.toFixed(2),
                    " kg)")),
            react_1.default.createElement("button", { type: "button", onClick: handleNextStep, style: {
                    width: '100%',
                    marginTop: '24px',
                    padding: '14px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '48px',
                } }, "Continue to Add Receipt \u2192"))),
        currentStep === 2 && (react_1.default.createElement("div", { style: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' } },
            react_1.default.createElement("h2", { style: { margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' } }, "Step 2: Add Receipt Evidence"),
            react_1.default.createElement("div", { style: {
                    border: '2px dashed #94a3b8',
                    borderRadius: '12px',
                    padding: '32px 16px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    cursor: 'pointer',
                    marginBottom: '20px',
                } },
                react_1.default.createElement("div", { style: { fontSize: '40px', marginBottom: '8px' } }, "\uD83D\uDCF7"),
                react_1.default.createElement("div", { style: { fontSize: '16px', fontWeight: 600, color: '#0f172a' } }, "Take Photo / Select Receipt"),
                react_1.default.createElement("div", { style: { fontSize: '13px', color: '#64748b', marginTop: '4px' } }, "Tap here to open camera or upload image file")),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' } }, "Or Review Pasted Receipt Text:"),
            react_1.default.createElement("textarea", { rows: 4, value: form.receiptText, onChange: (e) => setForm({ ...form, receiptText: e.target.value }), style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                } }),
            react_1.default.createElement("div", { style: { display: 'flex', gap: '12px', marginTop: '24px' } },
                react_1.default.createElement("button", { type: "button", onClick: handlePrevStep, style: {
                        flex: 1,
                        padding: '14px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '48px',
                    } }, "\u2190 Back"),
                react_1.default.createElement("button", { type: "button", onClick: handleNextStep, style: {
                        flex: 2,
                        padding: '14px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '48px',
                    } }, "Review Candidate Data \u2192")))),
        currentStep === 3 && (react_1.default.createElement("div", { style: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' } },
            react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
                react_1.default.createElement("h2", { style: { margin: 0, fontSize: '18px', color: '#0f172a' } }, "Step 3: Review & Verify Data"),
                react_1.default.createElement("span", { style: {
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: '999px',
                    } }, "Air-Gap Gate")),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' } }, "Receipt Date:"),
            react_1.default.createElement("input", { type: "date", value: form.receiptDate, onChange: (e) => setForm({ ...form, receiptDate: e.target.value }), style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                    marginBottom: '14px',
                } }),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' } }, "Commodity Item:"),
            react_1.default.createElement("input", { type: "text", value: form.itemName, onChange: (e) => setForm({ ...form, itemName: e.target.value }), style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                    marginBottom: '14px',
                } }),
            react_1.default.createElement("label", { style: { display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' } }, "Quantity Documented:"),
            react_1.default.createElement("input", { type: "number", step: "any", value: form.quantityReceived, onChange: (e) => setForm({ ...form, quantityReceived: e.target.value }), style: {
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                    minHeight: '48px',
                    marginBottom: '16px',
                } }),
            react_1.default.createElement("div", { style: {
                    padding: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                } },
                react_1.default.createElement("input", { type: "checkbox", id: "workflow-user-verified", checked: form.userVerified, onChange: (e) => setForm({ ...form, userVerified: e.target.checked }), style: { width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' } }),
                react_1.default.createElement("label", { htmlFor: "workflow-user-verified", style: { fontSize: '13px', color: '#1e293b', fontWeight: 600, cursor: 'pointer' } }, "I explicitly confirm this data matches the physical receipt (user_verified = true)")),
            react_1.default.createElement("div", { style: { display: 'flex', gap: '12px', marginTop: '24px' } },
                react_1.default.createElement("button", { type: "button", onClick: handlePrevStep, style: {
                        flex: 1,
                        padding: '14px',
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '48px',
                    } }, "\u2190 Back"),
                react_1.default.createElement("button", { type: "button", onClick: handleCommit, style: {
                        flex: 2,
                        padding: '14px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        minHeight: '48px',
                    } }, "Confirm & Save to Ledger")))),
        react_1.default.createElement(ValidationModal_1.default, { isOpen: modalOpen, onClose: () => setModalOpen(false), title: "Explicit User Confirmation Required", message: "Air-Gap Protection: AI-extracted candidate data cannot enter the database ledger without your explicit manual verification. Please check the confirmation box before saving.", confirmLabel: "I Understand" })));
};
exports.MainWorkflow = MainWorkflow;
exports.default = exports.MainWorkflow;
