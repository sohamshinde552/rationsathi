import React from 'react';
export interface CandidateItem {
    item_name: string | null;
    extracted_qty: number | null;
    extracted_unit: string | null;
    confidence: number;
}
export interface ExtractedReceiptData {
    extracted_date: string | null;
    candidate_items: CandidateItem[];
    raw_text?: string;
    image_url?: string;
    parsing_notes?: string[];
}
export interface EditableItemForm {
    item_name: string;
    quantity_received: string;
    unit: string;
    confidence: number;
}
export interface ReceiptValidationProps {
    householdId: string;
    evidenceId?: string;
    initialData: ExtractedReceiptData;
    onSuccess?: (ledgerEntries: any) => void;
    apiBaseUrl?: string;
}
export declare const ReceiptValidationComponent: React.FC<ReceiptValidationProps>;
export default ReceiptValidationComponent;
