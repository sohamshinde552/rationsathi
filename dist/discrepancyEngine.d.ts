import { Household, EntitlementRule, DistributionLedgerEntry, DiscrepancyAuditReport } from './types';
export interface CalculateDiscrepanciesInput {
    household: Household;
    start_date: string;
    end_date: string;
    period_label?: string;
    entitlement_rules: EntitlementRule[];
    ledger_entries: DistributionLedgerEntry[];
    deadline_date?: string;
}
/**
 * Discrepancy Calculation Engine
 *
 * 1. Filters ONLY `user_verified = true` transactions within the specified date window.
 * 2. Sums confirmed quantities using exact Decimal.js fixed-point math.
 * 3. Computes exact shortfall: Shortfall = Baseline Entitlement - Total Verified Received.
 * 4. Classifies status according to the matrix:
 *    - LATE_DELIVERY: Any transaction received after period deadline
 *    - UNCLEAR_RECORD: Missing receipt evidence or marked unclear
 *    - SHORTFALL: Total verified received < baseline
 *    - FULL_DELIVERY: Total verified received >= baseline
 */
export declare function calculateDiscrepancies(input: CalculateDiscrepanciesInput): DiscrepancyAuditReport;
