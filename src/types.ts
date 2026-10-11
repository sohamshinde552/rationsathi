import Decimal from 'decimal.js';

export interface EntitlementRule {
  rule_id: string;
  scheme_name: string;
  item_name: string;
  qty_per_member: Decimal | string | number;
  unit: string;
  period_days: number;
}

export interface Household {
  household_id: string;
  head_of_family_name: string;
  family_member_count: number;
  ration_card_type: string;
}

export interface ReceiptEvidence {
  evidence_id: string;
  household_id: string;
  image_url?: string | null;
  pasted_text?: string | null;
  raw_ocr_json?: Record<string, unknown> | null;
  created_at?: Date | string;
}

export interface DistributionLedgerEntry {
  transaction_id: string;
  household_id: string;
  evidence_id?: string | null;
  item_name: string;
  quantity_received: Decimal | string | number;
  date_received: Date | string;
  user_verified: boolean;
  created_at?: Date | string;
}

export interface CandidateItem {
  item_name: string | null;
  extracted_qty: number | null;
  extracted_unit: string | null;
  confidence: number;
}

export interface ExtractedReceiptCandidate {
  candidate_items: CandidateItem[];
  extracted_date: string | null;
  raw_text?: string;
  parsing_notes?: string[];
}

export interface VerifiedReceiptItemSubmission {
  item_name: string;
  quantity_received: string | number;
  unit: string;
}

export interface VerifyReceiptRequestPayload {
  household_id: string;
  evidence_id?: string | null;
  date_received: string;
  user_verified: boolean;
  items: VerifiedReceiptItemSubmission[];
}

export type DiscrepancyLineItemStatus =
  | 'FULL_DELIVERY'
  | 'SHORTFALL'
  | 'LATE_DELIVERY'
  | 'UNCLEAR_RECORD';

export interface LinkedReceiptDetail {
  transaction_id: string;
  evidence_id?: string | null;
  date_received: string;
  quantity_received: string;
}

export interface DiscrepancyLineItem {
  item_name: string;
  baseline_qty: string;
  received_qty: string;
  shortfall_qty: string;
  unit: string;
  status: DiscrepancyLineItemStatus;
  linked_receipt_ids: (string | number)[];
  linked_receipt_details?: LinkedReceiptDetail[];
}

export interface DiscrepancyAuditReport {
  period: string;
  household_id: string;
  household_members: number;
  line_items: DiscrepancyLineItem[];
  generated_at: string;
}

