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
exports.ValidationModal = void 0;
const react_1 = __importStar(require("react"));
const ValidationModal = ({ isOpen, onClose, title = 'Explicit User Confirmation Required', message = 'Air-Gap Protection: AI-extracted candidate data cannot enter the database ledger without your explicit manual verification. Please check the confirmation box before saving.', confirmLabel = 'I Understand', }) => {
    // Listen for Escape key
    (0, react_1.useEffect)(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (react_1.default.createElement("div", { id: "modal-airgap-violation", role: "dialog", "aria-modal": "true", onClick: onClose, style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
        } },
        react_1.default.createElement("div", { className: "modal-content", onClick: (e) => e.stopPropagation(), style: {
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                position: 'relative',
            } },
            react_1.default.createElement("button", { type: "button", "aria-label": "Close", onClick: onClose, style: {
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: '#64748b',
                } }, "\u2715"),
            react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' } },
                react_1.default.createElement("span", { style: { fontSize: '28px' } }, "\uD83D\uDEE1\uFE0F"),
                react_1.default.createElement("h3", { style: { margin: 0, fontSize: '18px', color: '#b91c1c' } }, title)),
            react_1.default.createElement("p", { style: { fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: '0 0 20px 0' } }, message),
            react_1.default.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' } },
                react_1.default.createElement("button", { type: "button", onClick: onClose, style: {
                        padding: '10px 18px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '14px',
                        cursor: 'pointer',
                        minHeight: '44px',
                    } }, confirmLabel)))));
};
exports.ValidationModal = ValidationModal;
exports.default = exports.ValidationModal;
