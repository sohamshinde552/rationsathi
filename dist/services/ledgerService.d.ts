import { DistributionLedgerEntry, EntitlementRule } from '../types';
export interface LedgerInput {
    household_id: string;
    item_name: string;
    quantity_received: number | string;
    date_received: string;
    user_verified: boolean;
    evidence_id?: string | null;
    user_id?: string;
    access_token?: string;
}
export interface ServiceResult<T> {
    data: T | null;
    error: string | null;
}
export interface HouseholdProfileInput {
    household_id: string;
    head_of_family_name: string;
    family_member_count: number;
    ration_card_type?: string;
    user_id?: string;
}
export declare function upsertHouseholdProfile(input: HouseholdProfileInput): Promise<ServiceResult<any>>;
/**
 * Fetch distribution ledger entries for an authenticated user.
 * RLS enforces that users can only select their own records (auth.uid() = user_id).
 */
export declare function fetchUserLedger(userId?: string, accessToken?: string): Promise<ServiceResult<DistributionLedgerEntry[]>>;
/**
 * Inserts a verified row into distribution_ledger.
 * RLS requires user_verified = true and auth.uid() = user_id.
 */
export declare function insertLedgerEntry(input: LedgerInput): Promise<ServiceResult<DistributionLedgerEntry>>;
/**
 * Fetches baseline entitlement rules from entitlement_rules table.
 */
export declare function fetchEntitlementRules(schemeName?: string): Promise<ServiceResult<EntitlementRule[]>>;
