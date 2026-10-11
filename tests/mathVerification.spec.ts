import Decimal from 'decimal.js';
import { calculateBaselineEntitlement } from '../src/ruleEngine';
import { calculateDiscrepancies } from '../src/discrepancyEngine';
import { Household, EntitlementRule, DistributionLedgerEntry } from '../src/types';

describe('Phase 5: Mathematical Accuracy & Deterministic Arithmetic Suite', () => {
  test('FLOATING-POINT TRAP PREVENTION: 0.1 + 0.2 = 0.3 exact without IEEE-754 drift', () => {
    // In IEEE-754 binary float, (0.1 + 0.2) equals 0.30000000000000004
    const floatSum = 0.1 + 0.2;
    expect(floatSum).not.toBe(0.3); // Proves the standard JavaScript number float flaw

    // In our Decimal.js engine:
    const d1 = new Decimal('0.1');
    const d2 = new Decimal('0.2');
    const exactSum = d1.plus(d2);

    expect(exactSum.toString()).toBe('0.3');
    expect(exactSum.equals(new Decimal('0.3'))).toBe(true);
    expect(exactSum.toFixed(1)).toBe('0.3');
  });

  test('Multi-installment partial collection across 6 visits in a single month', () => {
    // Beneficiary visits Fair Price Shop 6 times in a single month
    // Baseline: 5 members * 7.25 kg = 36.25 kg
    const household: Household = {
      household_id: 'HH-RURAL-09',
      head_of_family_name: 'Mangala Bai',
      family_member_count: 5,
      ration_card_type: 'BPL',
    };

    const rule: EntitlementRule = {
      rule_id: 'RULE-WHEAT-09',
      scheme_name: 'NFSA Special Quota',
      item_name: 'Wheat',
      qty_per_member: new Decimal('7.25'),
      unit: 'kg',
      period_days: 30,
    };

    // Partial visit installments:
    // Visit 1: 5.25 kg
    // Visit 2: 6.50 kg
    // Visit 3: 4.75 kg
    // Visit 4: 8.125 kg
    // Visit 5: 3.375 kg
    // Visit 6: 4.25 kg
    // Sum = 5.25 + 6.50 + 4.75 + 8.125 + 3.375 + 4.25 = 32.25 kg
    // Expected Shortfall = 36.25 - 32.25 = 4.00 kg exact
    const visits: DistributionLedgerEntry[] = [
      { transaction_id: 'TX-1', evidence_id: 'R-1', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '5.25', date_received: '2026-10-02', user_verified: true },
      { transaction_id: 'TX-2', evidence_id: 'R-2', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '6.50', date_received: '2026-10-06', user_verified: true },
      { transaction_id: 'TX-3', evidence_id: 'R-3', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '4.75', date_received: '2026-10-12', user_verified: true },
      { transaction_id: 'TX-4', evidence_id: 'R-4', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '8.125', date_received: '2026-10-16', user_verified: true },
      { transaction_id: 'TX-5', evidence_id: 'R-5', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '3.375', date_received: '2026-10-22', user_verified: true },
      { transaction_id: 'TX-6', evidence_id: 'R-6', household_id: 'HH-RURAL-09', item_name: 'Wheat', quantity_received: '4.25', date_received: '2026-10-27', user_verified: true },
    ];

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      period_label: 'October 2026',
      entitlement_rules: [rule],
      ledger_entries: visits,
    });

    const wheat = report.line_items[0];
    expect(wheat.baseline_qty).toBe('36.25');
    expect(wheat.received_qty).toBe('32.25');
    expect(wheat.shortfall_qty).toBe('4.00');
    expect(wheat.status).toBe('SHORTFALL');
    expect(wheat.linked_receipt_ids).toHaveLength(6);
  });

  test('Mid-month family member count update (dynamic household parameter recalculation)', () => {
    const rule: EntitlementRule = {
      rule_id: 'RULE-RICE-02',
      scheme_name: 'PMGKAY',
      item_name: 'Rice',
      qty_per_member: new Decimal('5.00'),
      unit: 'kg',
      period_days: 30,
    };

    // Before addition: 4 members -> 20.00 kg
    const initialHousehold: Household = {
      household_id: 'HH-DYNAMIC',
      head_of_family_name: 'Anil Jadhav',
      family_member_count: 4,
      ration_card_type: 'PHH',
    };
    const baselineBefore = calculateBaselineEntitlement(initialHousehold, rule);
    expect(baselineBefore.toString()).toBe('20');

    // New member registered mid-month: 5 members -> 25.00 kg
    const updatedHousehold: Household = {
      ...initialHousehold,
      family_member_count: 5,
    };
    const baselineAfter = calculateBaselineEntitlement(updatedHousehold, rule);
    expect(baselineAfter.toString()).toBe('25');

    // Delta math is exact
    const delta = baselineAfter.minus(baselineBefore);
    expect(delta.toString()).toBe('5');
  });

  test('Sub-gram micro-quantities (e.g., Iodine Salt in decimals: 0.1250 kg)', () => {
    const saltRule: EntitlementRule = {
      rule_id: 'RULE-SALT',
      scheme_name: 'Nutrition Fortification',
      item_name: 'Iodized Salt',
      qty_per_member: new Decimal('0.1250'),
      unit: 'kg',
      period_days: 30,
    };

    const household: Household = {
      household_id: 'HH-SALT',
      head_of_family_name: 'Kavita Rao',
      family_member_count: 7,
      ration_card_type: 'BPL',
    };

    // 7 * 0.1250 = 0.8750 kg exact
    const entitlement = calculateBaselineEntitlement(household, saltRule);
    expect(entitlement.toString()).toBe('0.875');
    expect(entitlement.toFixed(4)).toBe('0.8750');
  });
});
