import {
  generateNeutralHTMLReport,
  validateNeutralLanguage,
  BANNED_ACCUSATORY_WORDS,
  NEUTRAL_DISCLAIMER_TEXT,
  NeutralReportData,
} from '../src/reportTemplate';
import { generateDiscrepancyPDF } from '../src/pdfReportGenerator';

describe('Phase 4: Neutral Evidence-Linked Report Generator', () => {
  const sampleReportData: NeutralReportData = {
    report: {
      period: 'October 2026',
      household_id: 'HH-MUMBAI-04',
      household_members: 4,
      generated_at: new Date().toISOString(),
      line_items: [
        {
          item_name: 'Wheat',
          baseline_qty: '20.00',
          received_qty: '15.00',
          shortfall_qty: '5.00',
          unit: 'kg',
          status: 'SHORTFALL',
          linked_receipt_ids: ['REC-101', 'REC-104'],
        },
        {
          item_name: 'Rice',
          baseline_qty: '12.00',
          received_qty: '12.00',
          shortfall_qty: '0.00',
          unit: 'kg',
          status: 'FULL_DELIVERY',
          linked_receipt_ids: ['REC-104'],
        },
      ],
    },
    evidence_items: [
      {
        evidence_id: 'REC-101',
        transaction_id: 'TXN-101',
        transaction_date: '2026-10-04',
        verified_item: 'Wheat',
        quantity_received: '8.00',
        unit: 'kg',
        source_type: 'Photo',
        reference_link: 'https://storage.rationsaathi.org/receipts/rec-101.jpg',
      },
      {
        evidence_id: 'REC-104',
        transaction_id: 'TXN-102',
        transaction_date: '2026-10-18',
        verified_item: 'Wheat & Rice',
        quantity_received: '7.00 + 12.00',
        unit: 'kg',
        source_type: 'Written Note',
        reference_link: 'https://storage.rationsaathi.org/receipts/rec-104.jpg',
      },
    ],
    scheme_name: 'National Food Security Act (NFSA)',
    ration_card_type: 'Priority Household (PHH)',
    head_of_family_name: 'Suresh Patil',
  };

  test('BANNED WORDS ENFORCEMENT: Output string NEVER contains accusatory language', () => {
    const htmlReport = generateNeutralHTMLReport(sampleReportData);
    const lowerHtml = htmlReport.toLowerCase();

    // Verify none of the banned accusatory words appear
    for (const bannedWord of BANNED_ACCUSATORY_WORDS) {
      const regex = new RegExp(`\\b${bannedWord}\\b`, 'i');
      expect(regex.test(lowerHtml)).toBe(false);
    }

    // Verify language validation helper also confirms zero violations
    const check = validateNeutralLanguage(htmlReport);
    expect(check.valid).toBe(true);
    expect(check.violations).toHaveLength(0);
  });

  test('MANDATORY HARDCODED LABELS: Validates presence of objective reconciliation vocabulary', () => {
    const htmlReport = generateNeutralHTMLReport(sampleReportData);

    expect(htmlReport).toContain('Allocated Entitlement');
    expect(htmlReport).toContain('Documented Goods Received');
    expect(htmlReport).toContain('Recorded Difference');
    expect(htmlReport).toContain('Evidence Reference');
    expect(htmlReport).toContain('Evidence Appendix & Audit Provenance');
    expect(htmlReport).toContain(NEUTRAL_DISCLAIMER_TEXT);
  });

  test('Evidence linking references correspond directly to appendix items', () => {
    const htmlReport = generateNeutralHTMLReport(sampleReportData);

    expect(htmlReport).toContain('Ref: REC-101');
    expect(htmlReport).toContain('Ref: REC-104');
    expect(htmlReport).toContain('https://storage.rationsaathi.org/receipts/rec-101.jpg');
    expect(htmlReport).toContain('https://storage.rationsaathi.org/receipts/rec-104.jpg');
  });

  test('Language safety validator catches and rejects prohibited vocabulary', () => {
    const biasedText = 'A severe fraud occurred and someone is the culprit.';
    const check = validateNeutralLanguage(biasedText);

    expect(check.valid).toBe(false);
    expect(check.violations).toContain('fraud');
    expect(check.violations).toContain('culprit');
  });

  test('PDF Generation produces valid non-empty binary buffer', async () => {
    const pdfBuffer = await generateDiscrepancyPDF(sampleReportData);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000); // Standard PDF binary is several kilobytes

    // Check PDF magic byte header '%PDF-'
    const magicHeader = pdfBuffer.slice(0, 5).toString('ascii');
    expect(magicHeader).toBe('%PDF-');
  });
});
