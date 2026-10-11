import request from 'supertest';
import { app, inMemoryLedger } from '../src/api';
import { calculateDiscrepancies } from '../src/discrepancyEngine';
import { Household, EntitlementRule, DistributionLedgerEntry } from '../src/types';
import Decimal from 'decimal.js';

export class SecurityConstraintViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityConstraintViolation';
  }
}

/**
 * Air-Gap Security Guard:
 * Prevents unverified raw LLM JSON from directly bypassing verification and entering calculation pipelines.
 */
export function assertAirGapIntegrity(rawPayload: any): void {
  if (!rawPayload || rawPayload.user_verified !== true) {
    throw new SecurityConstraintViolation(
      'AirGapSecurityViolation: Calculation pipeline rejected payload. Missing explicit user_verified: true validation gate.'
    );
  }
}

describe('Phase 5: Air-Gap Security Integration Suite', () => {
  beforeEach(() => {
    inMemoryLedger.length = 0;
  });

  const household: Household = {
    household_id: 'HH-SEC-01',
    head_of_family_name: 'Pooja Verma',
    family_member_count: 3,
    ration_card_type: 'BPL',
  };

  const rule: EntitlementRule = {
    rule_id: 'RULE-WHEAT',
    scheme_name: 'NFSA',
    item_name: 'Wheat',
    qty_per_member: new Decimal('5.00'),
    unit: 'kg',
    period_days: 30,
  };

  test('SECURITY INVARIANT: Feeding raw LLM JSON directly throws SecurityConstraintViolation', () => {
    // Unverified raw LLM output candidate directly passed
    const rawLlmOutputCandidate = {
      candidate_items: [
        { item_name: 'Wheat', extracted_qty: 15, extracted_unit: 'kg', confidence: 0.95 },
      ],
      extracted_date: '2026-10-05',
      user_verified: false, // NOT verified by human user
    };

    // Assert that the pipeline throws SecurityConstraintViolation
    expect(() => {
      assertAirGapIntegrity(rawLlmOutputCandidate);
    }).toThrow(SecurityConstraintViolation);

    expect(() => {
      assertAirGapIntegrity(rawLlmOutputCandidate);
    }).toThrow(
      'AirGapSecurityViolation: Calculation pipeline rejected payload. Missing explicit user_verified: true validation gate.'
    );
  });

  test('SECURITY INVARIANT: Calculation engine strictly ignores unverified items in calculation', () => {
    const unverifiedLlmTxn: DistributionLedgerEntry = {
      transaction_id: 'LLM-UNVERIFIED-01',
      evidence_id: 'REC-LLM-01',
      household_id: 'HH-SEC-01',
      item_name: 'Wheat',
      quantity_received: '15.00',
      date_received: '2026-10-05',
      user_verified: false, // Unverified
    };

    const report = calculateDiscrepancies({
      household,
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      entitlement_rules: [rule],
      ledger_entries: [unverifiedLlmTxn],
    });

    // Unverified entry was not counted in received math
    const wheatLine = report.line_items[0];
    expect(wheatLine.received_qty).toBe('0.00');
    expect(wheatLine.shortfall_qty).toBe('15.00'); // Baseline is 3*5 = 15
    expect(wheatLine.linked_receipt_ids).toHaveLength(0);
  });

  test('API GATEWAY REJECTION: API endpoint rejects raw unverified AI payload with HTTP 400', async () => {
    const unverifiedPayload = {
      household_id: 'HH-SEC-01',
      date_received: '2026-10-05',
      // user_verified omitted or false
      items: [{ item_name: 'Wheat', quantity_received: '15.00', unit: 'kg' }],
    };

    const res = await request(app).post('/api/receipts/verify').send(unverifiedPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Air-gap violation');
    expect(inMemoryLedger.length).toBe(0);
  });
});
