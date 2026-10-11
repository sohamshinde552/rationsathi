"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registeredUsers = exports.inMemoryLedger = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const decimal_js_1 = __importDefault(require("decimal.js"));
const receiptParserService_1 = require("./receiptParserService");
const ledgerService_1 = require("./services/ledgerService");
const supabaseClient_1 = require("./lib/supabaseClient");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)());
exports.app.use(express_1.default.json({ limit: '10mb' }));
// In-memory ledger: acts as a local cache / fallback when Supabase is unavailable
exports.inMemoryLedger = [];
function getBearerToken(req) {
    const authorization = req.headers.authorization;
    if (!authorization)
        return undefined;
    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}
/**
 * POST /api/receipts/parse
 * Submits receipt evidence (image/text) to extraction pipeline.
 * Returns candidate suggestions flagged as unconfirmed.
 */
exports.app.post('/api/receipts/parse', async (req, res) => {
    try {
        const { image_url, image_base64, raw_text } = req.body;
        const candidates = await (0, receiptParserService_1.parseReceipt)({ image_url, image_base64, raw_text });
        res.status(200).json({
            success: true,
            data: candidates,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            error: err.message || 'Internal error parsing receipt.',
        });
    }
});
/**
 * POST /api/receipts/verify
 * AIR-GAP GATEWAY:
 * Rejects ANY transaction saving attempt where `user_verified` is missing or false.
 * Only verified user data enters the ledger.
 */
exports.app.post('/api/receipts/verify', async (req, res) => {
    const payload = req.body;
    // STRICT AIR-GAP ENFORCEMENT
    if (!payload || payload.user_verified !== true) {
        res.status(400).json({
            success: false,
            error: 'Air-gap violation: user_verified must be explicitly set to TRUE to commit to the distribution ledger.',
        });
        return;
    }
    if (!payload.household_id || typeof payload.household_id !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Validation error: Valid household_id is required.',
        });
        return;
    }
    if (!payload.date_received || typeof payload.date_received !== 'string') {
        res.status(400).json({
            success: false,
            error: 'Validation error: Valid date_received is required.',
        });
        return;
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
        res.status(400).json({
            success: false,
            error: 'Validation error: At least one verified receipt item must be provided.',
        });
        return;
    }
    const savedEntries = [];
    const accessToken = getBearerToken(req);
    for (const item of payload.items) {
        if (!item.item_name || !item.item_name.trim()) {
            res.status(400).json({
                success: false,
                error: 'Validation error: item_name cannot be empty.',
            });
            return;
        }
        let decimalQty;
        try {
            decimalQty = new decimal_js_1.default(item.quantity_received);
            if (decimalQty.isNegative() || decimalQty.isNaN()) {
                throw new Error('Quantity must be a non-negative number.');
            }
        }
        catch (e) {
            res.status(400).json({
                success: false,
                error: `Validation error for item '${item.item_name}': Invalid quantity '${item.quantity_received}'.`,
            });
            return;
        }
        const fallbackEntry = {
            transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            household_id: payload.household_id,
            evidence_id: payload.evidence_id || null,
            item_name: item.item_name.trim(),
            quantity_received: decimalQty.toString(),
            date_received: payload.date_received,
            user_verified: true,
            created_at: new Date().toISOString(),
        };
        const { data, error } = await (0, ledgerService_1.insertLedgerEntry)({
            household_id: payload.household_id,
            item_name: item.item_name.trim(),
            quantity_received: decimalQty.toString(),
            date_received: payload.date_received,
            user_verified: true,
            evidence_id: payload.evidence_id || null,
            access_token: accessToken,
        });
        if (error || !data) {
            if (error?.startsWith('Supabase is not configured')) {
                exports.inMemoryLedger.push(fallbackEntry);
                savedEntries.push(fallbackEntry);
                continue;
            }
            res.status(502).json({
                success: false,
                error: `Supabase save failed: ${error || 'No row returned from ledger insert.'}`,
            });
            return;
        }
        exports.inMemoryLedger.push(data);
        savedEntries.push(data);
    }
    res.status(201).json({
        success: true,
        message: `Successfully verified and committed ${savedEntries.length} items to the distribution ledger.`,
        data: savedEntries,
    });
    return;
});
/**
 * GET /api/ledger
 * Returns ledger entries for a household, or all verified ledger entries.
 */
exports.app.get('/api/ledger', async (req, res) => {
    const { household_id } = req.query;
    // Try Supabase first
    const { data: supabaseData, error } = await (0, ledgerService_1.fetchUserLedger)(undefined, getBearerToken(req));
    if (!error && supabaseData && supabaseData.length > 0) {
        const filtered = household_id && typeof household_id === 'string'
            ? supabaseData.filter(l => l.household_id === household_id)
            : supabaseData;
        res.status(200).json({ success: true, data: filtered, source: 'supabase' });
        return;
    }
    if (error) {
        console.warn('[api] Supabase ledger fetch failed, falling back to in-memory:', error);
    }
    // Fallback to in-memory
    const filtered = household_id && typeof household_id === 'string'
        ? exports.inMemoryLedger.filter(l => l.household_id === household_id)
        : exports.inMemoryLedger;
    res.status(200).json({ success: true, data: filtered, source: 'in-memory' });
});
/**
 * POST /api/ledger/clear
 * Resets the in-memory ledger. Useful for test environments or new monthly cycles.
 */
exports.app.post('/api/ledger/clear', async (_req, res) => {
    exports.inMemoryLedger.length = 0;
    if (supabaseClient_1.isSupabaseConfigured && supabaseClient_1.supabaseAdmin) {
        try {
            await supabaseClient_1.supabaseAdmin.from('distribution_ledger').delete().neq('transaction_id', '');
        }
        catch (e) {
            console.warn('[api] could not clear remote test ledger:', e);
        }
    }
    res.status(200).json({ success: true, message: 'Ledger cleared successfully.' });
});
exports.registeredUsers = [
    {
        id: 'user_suresh_patil',
        name: 'Suresh Patil',
        email: 'suresh.patil@rationsaathi.org',
        household_id: 'HH-MUMBAI-04',
        family_count: 4,
        created_at: new Date().toISOString(),
    },
];
/**
 * POST /api/auth/login
 * Authenticates user by email/ID, creating account if new.
 */
exports.app.post('/api/auth/login', async (req, res) => {
    const { email, name, household_id, family_count } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ success: false, error: 'Valid email address or user ID is required.' });
        return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    let user = exports.registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
        // Automatically register new user seamlessly!
        const inferredName = name && name.trim() ? name.trim() : normalizedEmail.split('@')[0];
        const generatedHouseholdId = household_id && household_id.trim() ? household_id.trim() : `HH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const parsedFamilyCount = parseInt(family_count, 10) || 4;
        user = {
            id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: inferredName,
            email: normalizedEmail,
            household_id: generatedHouseholdId,
            family_count: parsedFamilyCount,
            created_at: new Date().toISOString(),
        };
        exports.registeredUsers.push(user);
    }
    const { error: householdError } = await (0, ledgerService_1.upsertHouseholdProfile)({
        household_id: user.household_id,
        head_of_family_name: user.name,
        family_member_count: user.family_count,
        ration_card_type: 'PHH',
    });
    if (householdError) {
        res.status(502).json({
            success: false,
            error: `Supabase user/household save failed: ${householdError}`,
        });
        return;
    }
    res.status(200).json({
        success: true,
        message: 'User authenticated successfully.',
        data: user,
    });
});
/**
 * GET /api/schemes
 * Returns distinct schemes and entitlement rules from database.
 */
exports.app.get('/api/schemes', async (_req, res) => {
    const defaultRules = [
        { rule_id: 'NFSA-WHEAT-PHH', scheme_name: 'NFSA (Priority Household)', item_name: 'Wheat', qty_per_member: 5, unit: 'kg', period_days: 30 },
        { rule_id: 'NFSA-RICE-PHH', scheme_name: 'NFSA (Priority Household)', item_name: 'Rice', qty_per_member: 3, unit: 'kg', period_days: 30 },
        { rule_id: 'PMGKAY-WHEAT-AAY', scheme_name: 'PMGKAY (Free Grain)', item_name: 'Wheat', qty_per_member: 7, unit: 'kg', period_days: 30 },
        { rule_id: 'PMGKAY-RICE-AAY', scheme_name: 'PMGKAY (Free Grain)', item_name: 'Rice', qty_per_member: 5, unit: 'kg', period_days: 30 },
        { rule_id: 'AAY-WHEAT-SPECIAL', scheme_name: 'Antyodaya Anna Yojana (AAY)', item_name: 'Wheat', qty_per_member: 8.75, unit: 'kg', period_days: 30 },
        { rule_id: 'AAY-RICE-SPECIAL', scheme_name: 'Antyodaya Anna Yojana (AAY)', item_name: 'Rice', qty_per_member: 6.25, unit: 'kg', period_days: 30 },
        { rule_id: 'ANNAPURNA-WHEAT', scheme_name: 'State Annapurna Scheme', item_name: 'Wheat', qty_per_member: 6, unit: 'kg', period_days: 30 },
        { rule_id: 'ANNAPURNA-PULSES', scheme_name: 'State Annapurna Scheme', item_name: 'Dal/Pulses', qty_per_member: 2, unit: 'kg', period_days: 30 },
    ];
    const { data, error } = await (0, ledgerService_1.fetchEntitlementRules)();
    const rules = (!error && data && data.length > 0) ? data : defaultRules;
    res.status(200).json({
        success: true,
        data: rules,
    });
});
/**
 * GET /api/auth/user
 * Checks current user profile
 */
exports.app.get('/api/auth/user', (req, res) => {
    const { email } = req.query;
    if (!email || typeof email !== 'string') {
        res.status(400).json({ success: false, error: 'Email parameter required.' });
        return;
    }
    const user = exports.registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
        res.status(404).json({ success: false, error: 'User not found.' });
        return;
    }
    res.status(200).json({ success: true, data: user });
});
exports.default = exports.app;
