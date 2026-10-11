import React from 'react';
export type LanguageCode = 'en' | 'hi' | 'mr';
export interface LanguageOption {
    code: LanguageCode;
    label: string;
    nativeName: string;
}
export declare const SUPPORTED_LANGUAGES: LanguageOption[];
export interface LanguageSelectorProps {
    currentLanguage: LanguageCode;
    onLanguageChange: (lang: LanguageCode) => void;
}
export declare const LanguageSelector: React.FC<LanguageSelectorProps>;
export default LanguageSelector;
