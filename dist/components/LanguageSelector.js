"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageSelector = exports.SUPPORTED_LANGUAGES = void 0;
const react_1 = __importDefault(require("react"));
exports.SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
    { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];
const LanguageSelector = ({ currentLanguage, onLanguageChange, }) => {
    return (react_1.default.createElement("div", { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
        react_1.default.createElement("label", { htmlFor: "lang-select", style: { fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' } },
            react_1.default.createElement("span", null, "\uD83C\uDF10"),
            react_1.default.createElement("span", null, "Language:")),
        react_1.default.createElement("select", { id: "lang-select", value: currentLanguage, onChange: (e) => onLanguageChange(e.target.value), style: {
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
                minHeight: '44px',
            } }, exports.SUPPORTED_LANGUAGES.map((lang) => (react_1.default.createElement("option", { key: lang.code, value: lang.code },
            lang.nativeName,
            " (",
            lang.label,
            ")"))))));
};
exports.LanguageSelector = LanguageSelector;
exports.default = exports.LanguageSelector;
