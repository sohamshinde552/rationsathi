import React from 'react';
export interface LedgerEntryFormProps {
    householdId: string;
    onSuccess?: (newEntry: any) => void;
    apiBaseUrl?: string;
    userId?: string;
}
export declare const LedgerEntryForm: React.FC<LedgerEntryFormProps>;
export default LedgerEntryForm;
