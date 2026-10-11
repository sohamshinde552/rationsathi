import React, { useRef, useState } from 'react';
import ReportExporter from './ReportExporter';
import {
  NeutralReportData,
  NEUTRAL_DISCLAIMER_TEXT,
  validateNeutralLanguage,
} from '../reportTemplate';

export interface DiscrepancyReportProps {
  data: NeutralReportData;
  onBack?: () => void;
}

export const DiscrepancyReport: React.FC<DiscrepancyReportProps> = ({ data, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [safetyCheckResult, setSafetyCheckResult] = useState<string | null>(null);

  const { report, evidence_items, scheme_name, ration_card_type, head_of_family_name } = data;

  // Pre-flight check for neutral language
  const verifyNeutrality = (): boolean => {
    if (reportRef.current) {
      const renderedText = reportRef.current.innerText;
      const validation = validateNeutralLanguage(renderedText);
      if (!validation.valid) {
        setSafetyCheckResult(
          `Security Alert: Prohibited terms found in DOM: ${validation.violations.join(', ')}`
        );
        return false;
      }
    }
    setSafetyCheckResult('✓ Neutral Language Guardrail Verified: 0 Banned Words Detected.');
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans">
      {/* Action Toolbar (Hidden during print) */}
      <div className="print:hidden flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          {safetyCheckResult && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              {safetyCheckResult}
            </span>
          )}
          <ReportExporter
            containerId="discrepancy-report-container"
            filename={`RationSaathi_${report.household_id}_Report.pdf`}
            onBeforeExport={verifyNeutrality}
          />
        </div>
      </div>

      {/* Official Neutral Report Document Container */}
      <div
        ref={reportRef}
        id="discrepancy-report-container"
        className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-slate-800 print:border-none print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Administrative Entitlement Reconciliation Report
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Public Distribution Entitlement & Verification Audit Summary • Period:{' '}
                <strong>{report.period}</strong>
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-300 px-2 py-1 rounded">
              Official Audit Copy
            </span>
          </div>
        </div>

        {/* Beneficiary Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-sm">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Household ID</div>
            <div className="font-bold text-slate-900 mt-0.5">{report.household_id}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Head of Family</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {head_of_family_name || 'Registered Beneficiary'}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Family Members</div>
            <div className="font-bold text-slate-900 mt-0.5">{report.household_members} Members</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Scheme / Card Type</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {scheme_name || 'PDS'} ({ration_card_type || 'Standard'})
            </div>
          </div>
        </div>

        {/* Section 1: Line Item Mathematical Reconciliation */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            1. Line-by-Line Entitlement & Delivery Reconciliation
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Allocated Entitlement</th>
                  <th className="py-2.5 px-3">Documented Goods Received</th>
                  <th className="py-2.5 px-3">Recorded Difference</th>
                  <th className="py-2.5 px-3">Reconciliation Status</th>
                  <th className="py-2.5 px-3">Evidence Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.line_items.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{line.item_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {line.baseline_qty} {line.unit}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {line.received_qty} {line.unit}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {line.shortfall_qty} {line.unit}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                        {line.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-blue-700">
                      {line.linked_receipt_ids.length > 0
                        ? line.linked_receipt_ids.map((id) => `Ref-${id}`).join(', ')
                        : 'None on record'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Evidence Appendix */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            2. Evidence Appendix & Audit Provenance
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Receipt Reference ID</th>
                  <th className="py-2.5 px-3">Transaction Date</th>
                  <th className="py-2.5 px-3">Verified Commodity</th>
                  <th className="py-2.5 px-3">Documented Quantity</th>
                  <th className="py-2.5 px-3">Source Medium</th>
                  <th className="py-2.5 px-3">Direct Reference Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidence_items.length > 0 ? (
                  evidence_items.map((ev, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono text-xs font-semibold text-slate-800">
                        {ev.evidence_id || ev.transaction_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{ev.transaction_date}</td>
                      <td className="py-2.5 px-3 text-slate-800">{ev.verified_item}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {ev.quantity_received} {ev.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{ev.source_type}</td>
                      <td className="py-2.5 px-3 text-xs text-blue-600 truncate max-w-xs">
                        {ev.reference_link}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-center text-slate-400 text-xs">
                      No physical receipts recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Neutral Administrative Notice */}
        <div className="bg-slate-50 border-l-4 border-slate-500 rounded p-4 text-xs text-slate-600 leading-relaxed mb-6">
          <strong className="text-slate-800 block mb-1">Administrative Notice:</strong>
          {NEUTRAL_DISCLAIMER_TEXT}
        </div>

        {/* Footer Audit Metadata */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
          <span>Document Reference: REC-AUDIT-{report.household_id}</span>
          <span>Generated: {new Date(report.generated_at).toUTCString()}</span>
          <span>Engine: RationSaathi Deterministic Core v1.0</span>
        </div>
      </div>
    </div>
  );
};

export default DiscrepancyReport;
