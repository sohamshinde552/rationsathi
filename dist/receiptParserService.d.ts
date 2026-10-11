import { ExtractedReceiptCandidate } from './types';
export interface ParseReceiptInput {
    image_url?: string;
    image_base64?: string;
    raw_text?: string;
}
/**
 * Receipt Parser Service:
 * Ingests receipt text or image payload, simulates/delegates to OCR/LLM Vision extraction,
 * and formats candidate suggestions strictly as unconfirmed data.
 */
export declare function parseReceipt(input: ParseReceiptInput): Promise<ExtractedReceiptCandidate>;
