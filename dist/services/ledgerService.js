"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertHouseholdProfile = upsertHouseholdProfile;
exports.fetchUserLedger = fetchUserLedger;
exports.insertLedgerEntry = insertLedgerEntry;
exports.fetchEntitlementRules = fetchEntitlementRules;
const supabaseClient_1 = require("../lib/supabaseClient");
async function upsertHouseholdProfile(input) {
    try {
        if (!supabaseClient_1.isSupabaseConfigured) {
            return { data: null, error: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.' };
        }
        const client = supabaseClient_1.supabaseAdmin || supabaseClient_1.supabase;
        const row = {
            household_id: input.household_id,
            head_of_family_name: input.head_of_family_name.trim() || 'Registered Beneficiary',
            family_member_count: input.family_member_count,
            ration_card_type: input.ration_card_type || 'PHH',
            updated_at: new Date().toISOString(),
        };
        if (input.user_id) {
            row.user_id = input.user_id;
        }
        const { data, error } = await client
            .from('households')
            .upsert(row, { onConflict: 'household_id' })
            .select()
            .single();
        if (error) {
            console.error('[ledgerService] household profile upsert error:', error);
            return { data: null, error: error.message };
        }
        return { data, error: null };
    }
    catch (err) {
        console.error('[ledgerService] household profile upsert exception:', err);
        return { data: null, error: err.message || 'Failed to save household profile to Supabase.' };
    }
}
/**
 * Fetch distribution ledger entries for an authenticated user.
 * RLS enforces that users can only select their own records (auth.uid() = user_id).
 */
async function fetchUserLedger(userId, accessToken) {
    try {
        if (!supabaseClient_1.isSupabaseConfigured) {
            return { data: [], error: 'Supabase is not configured.' };
        }
        const client = supabaseClient_1.supabaseAdmin || (accessToken ? (0, supabaseClient_1.createSupabaseClientForJwt)(accessToken) : supabaseClient_1.supabase);
        let query = client
            .from('distribution_ledger')
            .select('*')
            .order('date_received', { ascending: false });
        // If userId provided explicitly, add filter (RLS also verifies auth.uid() automatically)
        if (userId) {
            query = query.eq('user_id', userId);
        }
        const { data, error } = await query;
        if (error) {
            console.error('[ledgerService] fetchUserLedger error:', error);
            return { data: null, error: error.message };
        }
        return { data: data || [], error: null };
    }
    catch (err) {
        console.error('[ledgerService] fetchUserLedger exception:', err);
        return { data: null, error: err.message || 'Failed to fetch ledger entries from Supabase.' };
    }
}
/**
 * Inserts a verified row into distribution_ledger.
 * RLS requires user_verified = true and auth.uid() = user_id.
 */
async function insertLedgerEntry(input) {
    try {
        if (!supabaseClient_1.isSupabaseConfigured) {
            return { data: null, error: 'Supabase is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY.' };
        }
        // Air-gap validation check
        if (!input.user_verified) {
            return {
                data: null,
                error: 'Air-gap constraint violation: user_verified must be true to insert into distribution ledger.',
            };
        }
        const client = supabaseClient_1.supabaseAdmin || (input.access_token ? (0, supabaseClient_1.createSupabaseClientForJwt)(input.access_token) : supabaseClient_1.supabase);
        // Get current authenticated user id if not provided
        let currentUserId = input.user_id;
        if (!currentUserId && input.access_token) {
            const { data: { user } } = await client.auth.getUser(input.access_token);
            currentUserId = user?.id;
        }
        if (!supabaseClient_1.supabaseAdmin && !input.access_token) {
            return {
                data: null,
                error: 'Supabase RLS blocks server writes without authentication. Add SUPABASE_SERVICE_ROLE_KEY to .env.local or send a user Authorization token.',
            };
        }
        const { error: householdError } = await upsertHouseholdProfile({
            household_id: input.household_id,
            head_of_family_name: 'Registered Beneficiary',
            family_member_count: 1,
            ration_card_type: 'PHH',
            user_id: currentUserId,
        });
        if (householdError) {
            console.error('[ledgerService] household upsert error:', householdError);
            return { data: null, error: householdError };
        }
        // evidence_id column in Supabase is UUID type — strip non-UUID values (e.g. "REC-3155")
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const safeEvidenceId = input.evidence_id && UUID_REGEX.test(input.evidence_id) ? input.evidence_id : null;
        if (safeEvidenceId) {
            const evidenceRow = {
                evidence_id: safeEvidenceId,
                household_id: input.household_id,
            };
            if (currentUserId) {
                evidenceRow.user_id = currentUserId;
            }
            const { error: evidenceError } = await client
                .from('receipt_evidence')
                .upsert(evidenceRow, { onConflict: 'evidence_id' });
            if (evidenceError) {
                console.error('[ledgerService] receipt evidence upsert error:', evidenceError);
                return { data: null, error: evidenceError.message };
            }
        }
        const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const rowToInsert = {
            transaction_id: transactionId,
            household_id: input.household_id,
            item_name: input.item_name.trim(),
            quantity_received: String(input.quantity_received),
            date_received: input.date_received,
            user_verified: true,
            evidence_id: safeEvidenceId,
            created_at: new Date().toISOString(),
        };
        if (currentUserId) {
            rowToInsert.user_id = currentUserId;
        }
        const { data, error } = await client
            .from('distribution_ledger')
            .insert([rowToInsert])
            .select()
            .single();
        if (error) {
            console.error('[ledgerService] insertLedgerEntry error:', error);
            return { data: null, error: error.message };
        }
        return { data: data, error: null };
    }
    catch (err) {
        console.error('[ledgerService] insertLedgerEntry exception:', err);
        return { data: null, error: err.message || 'Failed to insert ledger record into Supabase.' };
    }
}
/**
 * Fetches baseline entitlement rules from entitlement_rules table.
 */
async function fetchEntitlementRules(schemeName) {
    try {
        if (!supabaseClient_1.isSupabaseConfigured) {
            return { data: [], error: 'Supabase is not configured.' };
        }
        let query = supabaseClient_1.supabase.from('entitlement_rules').select('*');
        if (schemeName) {
            // Support databases with either scheme_type or scheme_name column
            query = query.or(`scheme_type.eq.${schemeName},scheme_name.eq.${schemeName}`);
        }
        const { data, error } = await query;
        if (error) {
            // Fallback: query all rules if column filter throws
            const fallback = await supabaseClient_1.supabase.from('entitlement_rules').select('*');
            if (!fallback.error && fallback.data) {
                return { data: fallback.data, error: null };
            }
            console.error('[ledgerService] fetchEntitlementRules error:', error);
            return { data: null, error: error.message };
        }
        return { data: data || [], error: null };
    }
    catch (err) {
        console.error('[ledgerService] fetchEntitlementRules exception:', err);
        return { data: null, error: err.message || 'Failed to fetch entitlement rules from Supabase.' };
    }
}
