import React, { useState } from 'react';

export interface CandidateItem {
  item_name: string | null;
  extracted_qty: number | null;
  extracted_unit: string | null;
  confidence: number;
}

export interface ExtractedReceiptData {
  extracted_date: string | null;
  candidate_items: CandidateItem[];
  raw_text?: string;
  image_url?: string;
  parsing_notes?: string[];
}

export interface EditableItemForm {
  item_name: string;
  quantity_received: string;
  unit: string;
  confidence: number;
}

export interface ReceiptValidationProps {
  householdId: string;
  evidenceId?: string;
  initialData: ExtractedReceiptData;
  onSuccess?: (ledgerEntries: any) => void;
  apiBaseUrl?: string;
}

export const ReceiptValidationComponent: React.FC<ReceiptValidationProps> = ({
  householdId,
  evidenceId,
  initialData,
  onSuccess,
  apiBaseUrl = 'http://localhost:3000',
}) => {
  const [dateReceived, setDateReceived] = useState<string>(
    initialData.extracted_date || new Date().toISOString().split('T')[0]
  );

  const [items, setItems] = useState<EditableItemForm[]>(
    initialData.candidate_items.map((c) => ({
      item_name: c.item_name || '',
      quantity_received: c.extracted_qty !== null ? String(c.extracted_qty) : '',
      unit: c.extracted_unit || 'kg',
      confidence: c.confidence,
    }))
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleItemChange = (index: number, field: keyof EditableItemForm, val: string) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { item_name: '', quantity_received: '', unit: 'kg', confidence: 1.0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAndSave = async () => {
    setFeedback(null);

    // Validation
    if (!dateReceived) {
      setFeedback({ type: 'error', message: 'Receipt Date is required.' });
      return;
    }

    if (items.length === 0) {
      setFeedback({ type: 'error', message: 'At least one item must be verified.' });
      return;
    }

    for (const itm of items) {
      if (!itm.item_name.trim()) {
        setFeedback({ type: 'error', message: 'Item name cannot be empty.' });
        return;
      }
      const qtyNum = parseFloat(itm.quantity_received);
      if (isNaN(qtyNum) || qtyNum < 0) {
        setFeedback({
          type: 'error',
          message: `Invalid quantity for item "${itm.item_name}". Must be non-negative number.`,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      // AIR-GAP GATE: Payload explicitly sets user_verified = true
      const payload = {
        household_id: householdId,
        evidence_id: evidenceId || null,
        date_received: dateReceived,
        user_verified: true,
        items: items.map((i) => ({
          item_name: i.item_name.trim(),
          quantity_received: i.quantity_received.trim(),
          unit: i.unit.trim(),
        })),
      };

      const res = await fetch(`${apiBaseUrl}/api/receipts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { success?: boolean; error?: string; data?: any };
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit verified data.');
      }

      setFeedback({
        type: 'success',
        message: 'Successfully verified & committed data to distribution ledger.',
      });
      if (onSuccess) onSuccess(json.data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error submitting verification.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'sans-serif' }}>
      {/* Air Gap Security Banner */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          color: '#1e40af',
          fontSize: '14px',
        }}
      >
        <strong>🛡️ Air-Gap Gate Active:</strong> Values extracted by AI are suggestions only.
        The database ledger will <em>never</em> accept unverified automated data until explicitly confirmed below.
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '14px',
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Side-by-Side Comparison Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* LEFT COLUMN: Original Evidence */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#f8fafc',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#334155' }}>
            Original Receipt Evidence
          </h3>

          {initialData.image_url ? (
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
              <img
                src={initialData.image_url}
                alt="Receipt Evidence"
                style={{
                  maxWidth: '100%',
                  maxHeight: '350px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#e2e8f0',
                color: '#64748b',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '13px',
              }}
            >
              No image file provided (Pasted raw text input)
            </div>
          )}

          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            Raw OCR / Pasted Text Stream:
          </label>
          <pre
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
              maxHeight: '220px',
              overflowY: 'auto',
            }}
          >
            {initialData.raw_text || 'No text extracted.'}
          </pre>

          {initialData.parsing_notes && initialData.parsing_notes.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                Parser Diagnostics:
              </span>
              <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: '12px', color: '#64748b' }}>
                {initialData.parsing_notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Editable Suggestion Form */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>
              Verification & Ledger Entry
            </h3>
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '999px',
                border: '1px solid #fde68a',
              }}
            >
              Unconfirmed Suggestion
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
              Receipt Date:
            </label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateReceived(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            Disbursed Items:
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: item.confidence > 0.8 ? '#dcfce7' : '#fee2e2',
                      color: item.confidence > 0.8 ? '#15803d' : '#b91c1c',
                      fontWeight: 600,
                    }}
                  >
                    AI Confidence: {Math.round(item.confidence * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Item Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Wheat"
                      value={item.item_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleItemChange(idx, 'item_name', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Quantity</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 15.0"
                      value={item.quantity_received}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleItemChange(idx, 'quantity_received', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Unit</span>
                    <input
                      type="text"
                      placeholder="kg / liter"
                      value={item.unit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleItemChange(idx, 'unit', e.target.value)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#334155',
            }}
          >
            + Add Another Item
          </button>

          <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmAndSave}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: submitting ? '#94a3b8' : '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}
            >
              {submitting ? 'Committing to Ledger...' : 'Confirm & Save to Ledger (user_verified = TRUE)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptValidationComponent;
