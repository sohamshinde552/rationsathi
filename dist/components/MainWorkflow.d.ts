import React from 'react';
import { LanguageCode } from './LanguageSelector';
export interface WorkflowState {
    familyCount: number;
    schemeName: string;
    quotaPerMember: number;
    receiptText: string;
    receiptDate: string;
    itemName: string;
    quantityReceived: string;
    userVerified: boolean;
}
export interface MainWorkflowProps {
    initialLanguage?: LanguageCode;
    onCommitSuccess?: (data: any) => void;
    apiBaseUrl?: string;
}
export declare const MainWorkflow: React.FC<MainWorkflowProps>;
export default MainWorkflow;
