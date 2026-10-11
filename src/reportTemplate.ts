import { DiscrepancyAuditReport, ReceiptEvidence } from './types';

export const NEUTRAL_DISCLAIMER_TEXT =
  'This summary reflects recorded deliveries compared against standard entitlement rules. ' +
  'Differences may occur due to stock shortages, delivery delays, unrecorded visits, or documentation errors. ' +
  'This document is an administrative reconciliation report.';

export const BANNED_ACCUSATORY_WORDS = [
  'fraud',
  'theft',
  'stolen',
  'corrupt',
  'corruption',
  'siphon',
  'siphoned',
  'scam',
  'illegal',
  'culprit',
  'guilty',
  'criminal',
  'embezzle',
  'embezzlement',
  'cheating',
  'swindle',
];

export interface EvidenceAppendixItem {
  evidence_id: string;
  transaction_id: string;
  transaction_date: string;
  verified_item: string;
  quantity_received: string;
  unit: string;
  source_type: 'Photo' | 'Written Note' | 'Digital Log';
  reference_link: string;
}

export interface NeutralReportData {
  report: DiscrepancyAuditReport;
  evidence_items: EvidenceAppendixItem[];
  scheme_name?: string;
  ration_card_type?: string;
  head_of_family_name?: string;
}

/**
 * Validates that any report text is free from banned accusatory vocabulary.
 */
export function validateNeutralLanguage(content: string): { valid: boolean; violations: string[] } {
  const lowerContent = content.toLowerCase();
  const violations: string[] = [];

  for (const word of BANNED_ACCUSATORY_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerContent)) {
      violations.push(word);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Generates an immutable, neutral HTML reconciliation summary report.
 * Strictly adheres to non-accusatory terminology:
 * - "Allocated Entitlement"
 * - "Documented Goods Received"
 * - "Recorded Difference"
 * - "Evidence Reference"
 */
export function generateNeutralHTMLReport(data: NeutralReportData): string {
  const { report, evidence_items, scheme_name, ration_card_type, head_of_family_name } = data;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Administrative Entitlement Reconciliation Report - ${report.period}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 32px;
      line-height: 1.5;
      background-color: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 24px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .header .subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .summary-item .label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }
    .summary-item .val {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 28px 0 12px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
      font-size: 12px;
      text-align: left;
      padding: 10px 14px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 14px;
      font-size: 13px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    .ref-tag {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      margin-right: 4px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-FULL_DELIVERY { background-color: #dcfce7; color: #166534; }
    .status-SHORTFALL { background-color: #fee2e2; color: #991b1b; }
    .status-LATE_DELIVERY { background-color: #fef3c7; color: #92400e; }
    .status-UNCLEAR_RECORD { background-color: #f1f5f9; color: #475569; }
    .disclaimer-box {
      margin-top: 36px;
      padding: 14px 18px;
      border-radius: 6px;
      background-color: #f8fafc;
      border-left: 4px solid #64748b;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .footer-meta {
      margin-top: 20px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>Administrative Entitlement Reconciliation Report</h1>
    <p class="subtitle">Public Distribution Entitlement & Verification Audit Summary • Period: ${report.period}</p>
  </div>

  <div class="summary-grid">
    <div class="summary-item">
      <div class="label">Household Identifier</div>
      <div class="val">${report.household_id}</div>
    </div>
    <div class="summary-item">
      <div class="label">Head of Family</div>
      <div class="val">${head_of_family_name || 'Registered Beneficiary'}</div>
    </div>
    <div class="summary-item">
      <div class="label">Registered Members</div>
      <div class="val">${report.household_members} Members</div>
    </div>
    <div class="summary-item">
      <div class="label">Scheme / Card Type</div>
      <div class="val">${scheme_name || 'PDS'} (${ration_card_type || 'Standard'})</div>
    </div>
  </div>

  <div class="section-title">
    1. Line-by-Line Entitlement & Delivery Reconciliation
  </div>

  <table>
    <thead>
      <tr>
        <th>Item Description</th>
        <th>Allocated Entitlement</th>
        <th>Documented Goods Received</th>
        <th>Recorded Difference</th>
        <th>Reconciliation Status</th>
        <th>Evidence Reference</th>
      </tr>
    </thead>
    <tbody>
      ${report.line_items
        .map((line) => {
          const refs = line.linked_receipt_ids.length > 0
            ? line.linked_receipt_ids.map((id) => `<span class="ref-tag">Ref: ${id}</span>`).join(' ')
            : '<span style="color:#94a3b8">None on record</span>';

          return `
          <tr>
            <td style="font-weight: 600;">${line.item_name}</td>
            <td>${line.baseline_qty} ${line.unit}</td>
            <td>${line.received_qty} ${line.unit}</td>
            <td>${line.shortfall_qty} ${line.unit}</td>
            <td><span class="status-badge status-${line.status}">${line.status}</span></td>
            <td>${refs}</td>
          </tr>
          `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="section-title">
    2. Evidence Appendix & Audit Provenance
  </div>

  <table>
    <thead>
      <tr>
        <th>Receipt Reference ID</th>
        <th>Transaction Date</th>
        <th>Verified Commodity</th>
        <th>Documented Quantity</th>
        <th>Source Medium</th>
        <th>Evidence Direct Link</th>
      </tr>
    </thead>
    <tbody>
      ${
        evidence_items.length > 0
          ? evidence_items
              .map(
                (ev) => `
          <tr>
            <td style="font-weight: 600;">${ev.evidence_id || ev.transaction_id}</td>
            <td>${ev.transaction_date}</td>
            <td>${ev.verified_item}</td>
            <td>${ev.quantity_received} ${ev.unit}</td>
            <td>${ev.source_type}</td>
            <td><a href="${ev.reference_link}" style="color: #0284c7; text-decoration: none;" target="_blank">View Evidence File</a></td>
          </tr>
          `
              )
              .join('')
          : `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No physical receipts recorded for this period.</td></tr>`
      }
    </tbody>
  </table>

  <div class="disclaimer-box">
    <strong>Administrative Notice:</strong> ${NEUTRAL_DISCLAIMER_TEXT}
  </div>

  <div class="footer-meta">
    <span>Document ID: REC-AUDIT-${Date.now()}</span>
    <span>Generated: ${new Date(report.generated_at).toUTCString()}</span>
    <span>Engine: RationSaathi Deterministic Core v1.0</span>
  </div>

</body>
</html>`;

  // Language safety verification
  const check = validateNeutralLanguage(html);
  if (!check.valid) {
    throw new Error(
      `Neutral language guardrail violation! Prohibited words detected: ${check.violations.join(', ')}`
    );
  }

  return html;
}
