import React from 'react';
export interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
}
export declare const ValidationModal: React.FC<ValidationModalProps>;
export default ValidationModal;
