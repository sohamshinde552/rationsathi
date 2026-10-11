import { DiscrepancyAuditReport } from './types';
export declare const NEUTRAL_DISCLAIMER_TEXT: string;
export declare const BANNED_ACCUSATORY_WORDS: string[];
export interface EvidenceAppendixItem {
    evidence_id: string;
    transaction_id: string;
    transaction_date: string;
    verified_item: string;
    quantity_received: string;
    unit: string;
    source_type: 'Photo' | 'Written Note' | 'Digital Log';
    reference_link: string;
}
export interface NeutralReportData {
    report: DiscrepancyAuditReport;
    evidence_items: EvidenceAppendixItem[];
    scheme_name?: string;
    ration_card_type?: string;
    head_of_family_name?: string;
}
/**
 * Validates that any report text is free from banned accusatory vocabulary.
 */
export declare function validateNeutralLanguage(content: string): {
    valid: boolean;
    violations: string[];
};
/**
 * Generates an immutable, neutral HTML reconciliation summary report.
 * Strictly adheres to non-accusatory terminology:
 * - "Allocated Entitlement"
 * - "Documented Goods Received"
 * - "Recorded Difference"
 * - "Evidence Reference"
 */
export declare function generateNeutralHTMLReport(data: NeutralReportData): string;
