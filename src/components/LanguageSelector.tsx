import React from 'react';

export type LanguageCode = 'en' | 'hi' | 'mr';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
];

export interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <label
        htmlFor="lang-select"
        style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <span>🌐</span>
        <span>Language:</span>
      </label>
      <select
        id="lang-select"
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          fontSize: '14px',
          fontWeight: 600,
          color: '#0f172a',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
