import Decimal from 'decimal.js';
import { calculateDiscrepancies } from '../src/discrepancyEngine';
import { Household, EntitlementRule, DistributionLedgerEntry } from '../src/types';

describe('Phase 3: Partial Ledger & Discrepancy Calculation Engine', () => {
  const household: Household = {
    household_id: 'HH-MUMBAI-04',
    head_of_family_name: 'Suresh Patil',
    family_member_count: 4,
    ration_card_type: 'PHH',
  };

  const rules: EntitlementRule[] = [
    {
      rule_id: 'RULE-WHEAT-01',
      scheme_name: 'NFSA',
      item_name: 'Wheat',
      qty_per_member: new Decimal('5.00'), // 4 * 5 = 20 kg
      unit: 'kg',
      period_days: 30,
    },
    {
      rule_id: 'RULE-RICE-01',
      scheme_name: 'NFSA',
      item_name: 'Rice',
      qty_per_member: new Decimal('3.00'), // 4 * 3 = 12 kg
      unit: 'kg',
      period_days: 30,
    },
  ];

  test('Calculates SHORTFALL for partial installments across multiple visits', () => {
    // Visit 1: 8 kg Wheat, Visit 2: 7 kg Wheat -> Total 15 kg (Shortfall 5 kg)
    const ledgerEntries: DistributionLedgerEntry[] = [
      {
        transaction_id: 'TXN-101',
        evidence_id: 'REC-101',
        household_id: 'HH-MUMBAI-04',
        item_name: 'Wheat',
        quantity_received: '8.00',
        date_received: '2026-10-04',
        user_verified: true,
      },
      {
        transaction_id: 'TXN-102',
        evidence_id: 'REC-104',
        household_id: 'HH-MUMBAI-04',
        item_name: 'Wheat',
        quantity_received: '7.00',
        date_received: '2026-10-18',
        user_verified: true,
      },
      // Rice: Full delivery in single visit (12 kg)
      {
        transaction_id: 'TXN-103',
        evidence_id: 'REC-104',
        household_id: 'HH-MUMBAI-04',
        item_name: 'Rice',
        quantity_received: '12.00',
        date_received: '2026-10-18',
        user_verified: true,
      },
    ];

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      period_label: 'October 2026',
      entitlement_rules: rules,
      ledger_entries: ledgerEntries,
    });

    expect(report.household_members).toBe(4);
    expect(report.period).toBe('October 2026');

    // Wheat check: 20 baseline, 15 received, 5 shortfall
    const wheatLine = report.line_items.find((l) => l.item_name === 'Wheat');
    expect(wheatLine).toBeDefined();
    expect(wheatLine?.baseline_qty).toBe('20.00');
    expect(wheatLine?.received_qty).toBe('15.00');
    expect(wheatLine?.shortfall_qty).toBe('5.00');
    expect(wheatLine?.status).toBe('SHORTFALL');
    expect(wheatLine?.linked_receipt_ids).toEqual(['REC-101', 'REC-104']);

    // Rice check: 12 baseline, 12 received, 0 shortfall
    const riceLine = report.line_items.find((l) => l.item_name === 'Rice');
    expect(riceLine).toBeDefined();
    expect(riceLine?.baseline_qty).toBe('12.00');
    expect(riceLine?.received_qty).toBe('12.00');
    expect(riceLine?.shortfall_qty).toBe('0.00');
    expect(riceLine?.status).toBe('FULL_DELIVERY');
  });

  test('STRICTLY ignores unverified ledger entries (user_verified = false)', () => {
    const ledgerEntries: DistributionLedgerEntry[] = [
      {
        transaction_id: 'TXN-UNVERIFIED',
        evidence_id: 'REC-999',
        household_id: 'HH-MUMBAI-04',
        item_name: 'Wheat',
        quantity_received: '20.00',
        date_received: '2026-10-05',
        user_verified: false, // Must be ignored!
      },
    ];

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      entitlement_rules: rules,
      ledger_entries: ledgerEntries,
    });

    const wheatLine = report.line_items.find((l) => l.item_name === 'Wheat');
    expect(wheatLine?.received_qty).toBe('0.00');
    expect(wheatLine?.shortfall_qty).toBe('20.00');
    expect(wheatLine?.status).toBe('SHORTFALL');
    expect(wheatLine?.linked_receipt_ids.length).toBe(0);
  });

  test('Detects LATE_DELIVERY if transaction date surpasses deadline', () => {
    const lateEntries: DistributionLedgerEntry[] = [
      {
        transaction_id: 'TXN-LATE',
        evidence_id: 'REC-301',
        household_id: 'HH-MUMBAI-04',
        item_name: 'Wheat',
        quantity_received: '20.00',
        date_received: '2026-10-25', // After deadline
        user_verified: true,
      },
    ];

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      deadline_date: '2026-10-20', // Deadline was 20th
      entitlement_rules: [rules[0]],
      ledger_entries: lateEntries,
    });

    const wheatLine = report.line_items.find((l) => l.item_name === 'Wheat');
    expect(wheatLine?.status).toBe('LATE_DELIVERY');
  });

  test('Flags UNCLEAR_RECORD if transaction has missing receipt evidence', () => {
    const unclearEntries: DistributionLedgerEntry[] = [
      {
        transaction_id: 'TXN-NO-REC',
        evidence_id: null, // missing receipt evidence
        household_id: 'HH-MUMBAI-04',
        item_name: 'Wheat',
        quantity_received: '10.00',
        date_received: '2026-10-10',
        user_verified: true,
      },
    ];

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      entitlement_rules: [rules[0]],
      ledger_entries: unclearEntries,
    });

    const wheatLine = report.line_items.find((l) => l.item_name === 'Wheat');
    expect(wheatLine?.status).toBe('UNCLEAR_RECORD');
  });
});
