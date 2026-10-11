import Decimal from 'decimal.js';
import { Household, EntitlementRule } from './types';
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
export declare function calculateBaselineEntitlement(household: Household, rule: EntitlementRule): Decimal;
