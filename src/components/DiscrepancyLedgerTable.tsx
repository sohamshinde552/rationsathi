import React, { useState } from 'react';
import { DiscrepancyAuditReport, DiscrepancyLineItem, LinkedReceiptDetail } from '../types';

export interface DiscrepancyLedgerTableProps {
  auditReport: DiscrepancyAuditReport;
  onItemSelect?: (item: DiscrepancyLineItem) => void;
}

export const DiscrepancyLedgerTable: React.FC<DiscrepancyLedgerTableProps> = ({
  auditReport,
  onItemSelect,
}) => {
  const [activeModalItem, setActiveModalItem] = useState<DiscrepancyLineItem | null>(null);

  const getStatusBadge = (status: DiscrepancyLineItem['status']) => {
    switch (status) {
      case 'FULL_DELIVERY':
        return (
          <span
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '4px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ✓ Full Delivery
          </span>
        );
      case 'SHORTFALL':
        return (
          <span
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '4px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ⚠️ Shortfall
          </span>
        );
      case 'LATE_DELIVERY':
        return (
          <span
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '4px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ⏳ Late Delivery
          </span>
        );
      case 'UNCLEAR_RECORD':
        return (
          <span
            style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '4px 8px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ❓ Unclear Record
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', margin: '20px 0' }}>
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
            Discrepancy Audit Ledger — {auditReport.period}
          </h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Household: <strong>{auditReport.household_id}</strong> | Registered Members:{' '}
            <strong>{auditReport.household_members}</strong>
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Audited at: {new Date(auditReport.generated_at).toLocaleTimeString()}
        </span>
      </div>

      {/* Main Table */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Item Name</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                Expected (Baseline)
              </th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                Total Verified Received
              </th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                Calculated Shortfall
              </th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                Evidence Count
              </th>
            </tr>
          </thead>
          <tbody>
            {auditReport.line_items.map((item, idx) => {
              const hasShortfall = parseFloat(item.shortfall_qty) > 0;
              return (
                <tr
                  key={idx}
                  onClick={() => onItemSelect && onItemSelect(item)}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                    {item.item_name}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {item.baseline_qty} {item.unit}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>
                    {item.received_qty} {item.unit}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontWeight: hasShortfall ? 700 : 400,
                      color: hasShortfall ? '#dc2626' : '#16a34a',
                    }}
                  >
                    {item.shortfall_qty} {item.unit}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(item.status)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {item.linked_receipt_ids.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalItem(item);
                        }}
                        style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          border: '1px solid #bae6fd',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {item.linked_receipt_ids.length} Receipt
                        {item.linked_receipt_ids.length > 1 ? 's' : ''} 🔍
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>0 Receipts</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Linked Evidence Modal */}
      {activeModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '540px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                Linked Receipts for {activeModalItem.item_name}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Line-by-line audit trail of verified receipts accounting for{' '}
              <strong>{activeModalItem.received_qty} {activeModalItem.unit}</strong> received:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeModalItem.linked_receipt_details &&
              activeModalItem.linked_receipt_details.length > 0 ? (
                activeModalItem.linked_receipt_details.map((detail, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong>Receipt ID:</strong> {detail.evidence_id || detail.transaction_id}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Date: {detail.date_received}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>
                      +{detail.quantity_received} {activeModalItem.unit}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Linked Receipt IDs: {activeModalItem.linked_receipt_ids.join(', ')}
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyLedgerTable;
