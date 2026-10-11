"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDiscrepancies = calculateDiscrepancies;
const decimal_js_1 = __importDefault(require("decimal.js"));
const ruleEngine_1 = require("./ruleEngine");
/**
 * Normalizes item names for safe matching across dialects & variants (e.g., "Wheat", "wheat", "WHEAT")
 */
function normalizeItemName(name) {
    return name.trim().toLowerCase();
}
/**
 * Format month/year label from dates if not explicitly provided
 */
function formatPeriodLabel(startDate) {
    try {
        const d = new Date(startDate);
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    }
    catch {
        return startDate;
    }
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
function calculateDiscrepancies(input) {
    const { household, start_date, end_date, period_label, entitlement_rules, ledger_entries, deadline_date, } = input;
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const deadlineDateObj = deadline_date ? new Date(deadline_date) : endDateObj;
    // STEP 1: Filter confirmed transactions within target date window
    const verifiedTransactions = ledger_entries.filter((entry) => {
        if (entry.household_id !== household.household_id)
            return false;
        if (entry.user_verified !== true)
            return false;
        const entryDate = new Date(entry.date_received);
        return entryDate >= startDateObj && entryDate <= endDateObj;
    });
    const lineItems = [];
    // STEP 2: Evaluate each entitlement rule
    for (const rule of entitlement_rules) {
        const baselineDecimal = (0, ruleEngine_1.calculateBaselineEntitlement)(household, rule);
        const ruleItemNormalized = normalizeItemName(rule.item_name);
        // Filter transactions matching this item
        const matchingEntries = verifiedTransactions.filter((entry) => normalizeItemName(entry.item_name) === ruleItemNormalized);
        // Exact Decimal.js summation loop
        let totalReceivedDecimal = new decimal_js_1.default(0);
        const linkedReceiptIds = [];
        const linkedReceiptDetails = [];
        let hasLateDelivery = false;
        let hasUnclearRecord = false;
        for (const entry of matchingEntries) {
            const entryQty = new decimal_js_1.default(entry.quantity_received);
            totalReceivedDecimal = totalReceivedDecimal.plus(entryQty);
            const refId = entry.evidence_id || entry.transaction_id;
            if (!linkedReceiptIds.includes(refId)) {
                linkedReceiptIds.push(refId);
            }
            linkedReceiptDetails.push({
                transaction_id: entry.transaction_id,
                evidence_id: entry.evidence_id || null,
                date_received: typeof entry.date_received === 'string'
                    ? entry.date_received
                    : entry.date_received.toISOString().split('T')[0],
                quantity_received: entryQty.toString(),
            });
            // Classification checks
            const txnDate = new Date(entry.date_received);
            if (txnDate > deadlineDateObj) {
                hasLateDelivery = true;
            }
            // Check if evidence is missing or flagged
            if (!entry.evidence_id) {
                hasUnclearRecord = true;
            }
        }
        // STEP 3: Compute Shortfall = Baseline - Received (never negative in display)
        const rawShortfall = baselineDecimal.minus(totalReceivedDecimal);
        const shortfallDecimal = rawShortfall.isNegative() ? new decimal_js_1.default(0) : rawShortfall;
        // STEP 4: Classification Logic Matrix
        let status;
        if (hasLateDelivery) {
            status = 'LATE_DELIVERY';
        }
        else if (hasUnclearRecord && matchingEntries.length > 0) {
            status = 'UNCLEAR_RECORD';
        }
        else if (totalReceivedDecimal.lessThan(baselineDecimal)) {
            status = 'SHORTFALL';
        }
        else {
            status = 'FULL_DELIVERY';
        }
        lineItems.push({
            item_name: rule.item_name,
            baseline_qty: baselineDecimal.toFixed(2),
            received_qty: totalReceivedDecimal.toFixed(2),
            shortfall_qty: shortfallDecimal.toFixed(2),
            unit: rule.unit,
            status,
            linked_receipt_ids: linkedReceiptIds,
            linked_receipt_details: linkedReceiptDetails,
        });
    }
    return {
        period: period_label || formatPeriodLabel(start_date),
        household_id: household.household_id,
        household_members: household.family_member_count,
        line_items: lineItems,
        generated_at: new Date().toISOString(),
    };
}
