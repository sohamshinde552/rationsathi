import Decimal from 'decimal.js';
import { calculateBaselineEntitlement } from '../src/ruleEngine';
import { Household, EntitlementRule } from '../src/types';

describe('Deterministic Rule Evaluation Engine (calculateBaselineEntitlement)', () => {
  const baseRule: EntitlementRule = {
    rule_id: 'RULE-NFSA-WHEAT-01',
    scheme_name: 'National Food Security Act (NFSA)',
    item_name: 'Wheat',
    qty_per_member: new Decimal('5.0000'),
    unit: 'kg',
    period_days: 30,
  };

  test('Single-member household: exact baseline calculation', () => {
    const household: Household = {
      household_id: 'HH-001',
      head_of_family_name: 'Asha Devi',
      family_member_count: 1,
      ration_card_type: 'BPL',
    };

    const entitlement = calculateBaselineEntitlement(household, baseRule);

    expect(entitlement.toString()).toBe('5');
    expect(entitlement.toFixed(2)).toBe('5.00');
    expect(entitlement.equals(new Decimal('5.0000'))).toBe(true);
  });

  test('Multi-member household (standard NFSA quota: 4 members * 5kg = 20kg)', () => {
    const household: Household = {
      household_id: 'HH-002',
      head_of_family_name: 'Ramesh Kumar',
      family_member_count: 4,
      ration_card_type: 'PHH',
    };

    const entitlement = calculateBaselineEntitlement(household, baseRule);

    expect(entitlement.toString()).toBe('20');
    expect(entitlement.toFixed(4)).toBe('20.0000');
    expect(entitlement.equals(new Decimal(20))).toBe(true);
  });

  test('Fractional quota precision without IEEE-754 floating point distortion (e.g. 0.1 + 0.2 drift)', () => {
    // 3 members * 2.3335 kg = 7.0005 kg
    const fractionalRule: EntitlementRule = {
      rule_id: 'RULE-PULSES-01',
      scheme_name: 'State Pulse Subsidy',
      item_name: 'Dal',
      qty_per_member: '2.3335',
      unit: 'kg',
      period_days: 30,
    };

    const household: Household = {
      household_id: 'HH-003',
      head_of_family_name: 'Sunita Sharma',
      family_member_count: 3,
      ration_card_type: 'AAY',
    };

    const entitlement = calculateBaselineEntitlement(household, fractionalRule);

    // Exact arithmetic: 3 * 2.3335 = 7.0005
    expect(entitlement.toString()).toBe('7.0005');
    expect(entitlement.toFixed(4)).toBe('7.0005');
  });

  test('Micro-fractional items (e.g., Cooking Oil in liters: 0.7500 per member)', () => {
    const oilRule: EntitlementRule = {
      rule_id: 'RULE-OIL-01',
      scheme_name: 'Edible Oils Welfare Scheme',
      item_name: 'Mustard Oil',
      qty_per_member: '0.75',
      unit: 'liter',
      period_days: 30,
    };

    const household: Household = {
      household_id: 'HH-004',
      head_of_family_name: 'Deepak Patel',
      family_member_count: 7,
      ration_card_type: 'BPL',
    };

    const entitlement = calculateBaselineEntitlement(household, oilRule);

    // 7 * 0.75 = 5.25 exactly
    expect(entitlement.toString()).toBe('5.25');
  });

  test('Zero-member edge case evaluates to exact 0', () => {
    const household: Household = {
      household_id: 'HH-005',
      head_of_family_name: 'Vacant Household',
      family_member_count: 0,
      ration_card_type: 'NON_PRIORITY',
    };

    const entitlement = calculateBaselineEntitlement(household, baseRule);

    expect(entitlement.toString()).toBe('0');
    expect(entitlement.isZero()).toBe(true);
  });

  test('Rejects negative household member counts', () => {
    const household: Household = {
      household_id: 'HH-ERR-1',
      head_of_family_name: 'Invalid Test',
      family_member_count: -1,
      ration_card_type: 'PHH',
    };

    expect(() => calculateBaselineEntitlement(household, baseRule)).toThrow(
      'Invalid household member count: -1. Must be non-negative.'
    );
  });

  test('Rejects non-integer household member counts', () => {
    const household: Household = {
      household_id: 'HH-ERR-2',
      head_of_family_name: 'Invalid Test',
      family_member_count: 2.5,
      ration_card_type: 'PHH',
    };

    expect(() => calculateBaselineEntitlement(household, baseRule)).toThrow(
      'Invalid household member count: 2.5. Must be an integer.'
    );
  });

  test('Rejects negative rule quantity', () => {
    const invalidRule: EntitlementRule = {
      ...baseRule,
      qty_per_member: '-5.00',
    };

    const household: Household = {
      household_id: 'HH-006',
      head_of_family_name: 'Valid Member',
      family_member_count: 3,
      ration_card_type: 'BPL',
    };

    expect(() => calculateBaselineEntitlement(household, invalidRule)).toThrow(
      'Invalid rule quantity per member: -5. Must be non-negative.'
    );
  });
});
