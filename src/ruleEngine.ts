import Decimal from 'decimal.js';
import { Household, EntitlementRule } from './types';

// Configure Decimal precision for high-integrity public entitlement arithmetic
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculates the exact baseline entitlement for a given household and entitlement rule.
 * 
 * Formula: Total Baseline = household.family_member_count * rule.qty_per_member
 * 
 * Guarantees:
 * - 100% deterministic fixed-point math using Decimal.js
 * - Avoids binary floating-point representation drift (IEEE 754)
 * - Strict parameter validation and line-by-line auditability
 * 
 * @param household The household entity containing member count and identifiers
 * @param rule The scheme entitlement rule defining quantity per member
 * @returns Decimal representing the exact baseline entitlement quantity
 * @throws Error if family_member_count or qty_per_member is negative or invalid
 */
export function calculateBaselineEntitlement(
  household: Household,
  rule: EntitlementRule
): Decimal {
  if (household.family_member_count < 0) {
    throw new Error(
      `Invalid household member count: ${household.family_member_count}. Must be non-negative.`
    );
  }

  if (!Number.isInteger(household.family_member_count)) {
    throw new Error(
      `Invalid household member count: ${household.family_member_count}. Must be an integer.`
    );
  }

  const memberCount = new Decimal(household.family_member_count);
  const qtyPerMember = new Decimal(rule.qty_per_member);

  if (qtyPerMember.isNegative()) {
    throw new Error(
      `Invalid rule quantity per member: ${qtyPerMember.toString()}. Must be non-negative.`
    );
  }

  if (qtyPerMember.isNaN() || !qtyPerMember.isFinite()) {
    throw new Error(
      `Invalid rule quantity per member: value must be a valid finite number.`
    );
  }

  // Exact fixed-point multiplication
  return memberCount.mul(qtyPerMember);
}
