import request from 'supertest';
import { app, inMemoryLedger } from '../src/api';
import { parseReceipt } from '../src/receiptParserService';

describe('Phase 2: Receipt Parser Service & OCR Extraction', () => {
  test('Parses clean PDS receipt text accurately', async () => {
    const rawReceipt = `
      FAIR PRICE SHOP - MAHARASHTRA PDS
      Date: 2024-04-10
      Wheat: 15.00 kg
      Rice: 10.00 kg
      Sugar: 2 kg
    `;

    const result = await parseReceipt({ raw_text: rawReceipt });

    expect(result.extracted_date).toBe('2024-04-10');
    expect(result.candidate_items.length).toBe(3);

    const wheat = result.candidate_items.find((i) => i.item_name === 'Wheat');
    expect(wheat).toBeDefined();
    expect(wheat?.extracted_qty).toBe(15);
    expect(wheat?.extracted_unit).toBe('kg');
    expect(wheat?.confidence).toBeGreaterThan(0.8);
  });

  test('Gracefully marks unrecognized receipt text with low confidence and null fields', async () => {
    const garbledReceipt = `
      Some blurred lines
      ######## ??? $$$$
      Random shop without items
    `;

    const result = await parseReceipt({ raw_text: garbledReceipt });

    expect(result.extracted_date).toBeNull();
    expect(result.candidate_items.length).toBe(1);
    expect(result.candidate_items[0].item_name).toBeNull();
    expect(result.candidate_items[0].extracted_qty).toBeNull();
    expect(result.candidate_items[0].confidence).toBeLessThan(0.5);
  });
});

describe('Phase 2: Air-Gap Enforcement on POST /api/receipts/verify', () => {
  beforeEach(() => {
    inMemoryLedger.length = 0;
  });

  test('REJECTS verification request if user_verified is false or missing (Air-Gap Protection)', async () => {
    const responseWithoutVerified = await request(app)
      .post('/api/receipts/verify')
      .send({
        household_id: 'HH-100',
        date_received: '2024-04-10',
        items: [{ item_name: 'Wheat', quantity_received: '15', unit: 'kg' }],
      });

    expect(responseWithoutVerified.status).toBe(400);
    expect(responseWithoutVerified.body.error).toContain('Air-gap violation');

    const responseWithFalse = await request(app)
      .post('/api/receipts/verify')
      .send({
        household_id: 'HH-100',
        date_received: '2024-04-10',
        user_verified: false,
        items: [{ item_name: 'Wheat', quantity_received: '15', unit: 'kg' }],
      });

    expect(responseWithFalse.status).toBe(400);
    expect(responseWithFalse.body.error).toContain('Air-gap violation');
    expect(inMemoryLedger.length).toBe(0);
  });

  test('SUCCESSFULLY commits to ledger when user_verified is explicitly true', async () => {
    const validPayload = {
      household_id: 'HH-100',
      evidence_id: 'EVID-001',
      date_received: '2024-04-10',
      user_verified: true,
      items: [
        { item_name: 'Wheat', quantity_received: '15.00', unit: 'kg' },
        { item_name: 'Rice', quantity_received: '10.50', unit: 'kg' },
      ],
    };

    const response = await request(app)
      .post('/api/receipts/verify')
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(2);
    expect(inMemoryLedger.length).toBe(2);
    expect(inMemoryLedger[0].user_verified).toBe(true);
    expect(inMemoryLedger[0].quantity_received).toBe('15');
  });

  test('Rejects submission with invalid item quantity or empty item name', async () => {
    const invalidQtyPayload = {
      household_id: 'HH-100',
      date_received: '2024-04-10',
      user_verified: true,
      items: [{ item_name: 'Wheat', quantity_received: 'not-a-number', unit: 'kg' }],
    };

    const response = await request(app)
      .post('/api/receipts/verify')
      .send(invalidQtyPayload);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid quantity');
    expect(inMemoryLedger.length).toBe(0);
  });
});
