import React, { useState } from 'react';
import ValidationModal from './ValidationModal';
import LanguageSelector, { LanguageCode } from './LanguageSelector';

export interface WorkflowState {
  familyCount: number;
  schemeName: string;
  quotaPerMember: number;
  receiptText: string;
  receiptDate: string;
  itemName: string;
  quantityReceived: string;
  userVerified: boolean;
}

export interface MainWorkflowProps {
  initialLanguage?: LanguageCode;
  onCommitSuccess?: (data: any) => void;
  apiBaseUrl?: string;
}

export const MainWorkflow: React.FC<MainWorkflowProps> = ({
  initialLanguage = 'en',
  onCommitSuccess,
  apiBaseUrl = '',
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<LanguageCode>(initialLanguage);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<WorkflowState>({
    familyCount: 4,
    schemeName: 'National Food Security Act (NFSA)',
    quotaPerMember: 5.0,
    receiptText: 'Fair Price Shop Visit\nDate: 2026-10-04\nWheat: 8.00 kg',
    receiptDate: '2026-10-04',
    itemName: 'Wheat',
    quantityReceived: '8.00',
    userVerified: false,
  });

  const baselineEntitlement = (form.familyCount * form.quotaPerMember).toFixed(2);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleCommit = async () => {
    setStatusMessage(null);
    if (!form.userVerified) {
      setModalOpen(true);
      return;
    }

    try {
      const payload = {
        household_id: 'HH-MUMBAI-04',
        evidence_id: `REC-${Date.now().toString().slice(-4)}`,
        date_received: form.receiptDate,
        user_verified: true,
        items: [
          {
            item_name: form.itemName,
            quantity_received: form.quantityReceived,
            unit: 'kg',
          },
        ],
      };

      const res = await fetch(`${apiBaseUrl}/api/receipts/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit verification.');
      }

      setStatusMessage({
        type: 'success',
        text: 'Successfully committed verified receipt to the ledger!',
      });
      if (onCommitSuccess) onCommitSuccess(json.data);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error communicating with server.',
      });
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* Top Navbar with Language Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>RationSaathi</h1>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Citizen Entitlement Assistant</span>
        </div>
        <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />
      </div>

      {/* Stepper Progress Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        {[
          { step: 1, label: '1. Setup' },
          { step: 2, label: '2. Evidence' },
          { step: 3, label: '3. Review' },
        ].map((s) => (
          <div
            key={s.step}
            onClick={() => setCurrentStep(s.step as 1 | 2 | 3)}
            style={{
              flex: 1,
              textAlign: 'center',
              cursor: 'pointer',
              borderBottom: currentStep >= s.step ? '3px solid #2563eb' : '3px solid #e2e8f0',
              paddingBottom: '8px',
              color: currentStep >= s.step ? '#2563eb' : '#94a3b8',
              fontWeight: currentStep === s.step ? 700 : 500,
              fontSize: '14px',
            }}
          >
            {s.label}
          </div>
        ))}
      </div>

      {statusMessage && (
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: statusMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: statusMessage.type === 'success' ? '#166534' : '#991b1b',
            fontSize: '14px',
          }}
        >
          {statusMessage.text}
        </div>
      )}

      {/* STEP 1: SETUP */}
      {currentStep === 1 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
            Step 1: Household Entitlement Setup
          </h2>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Number of Family Members in Ration Card:
          </label>
          <input
            type="number"
            min="1"
            max="25"
            value={form.familyCount}
            onChange={(e) => setForm({ ...form, familyCount: parseInt(e.target.value, 10) || 1 })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              minHeight: '48px',
            }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>
            Applicable Scheme:
          </label>
          <input
            type="text"
            value={form.schemeName}
            readOnly
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />

          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
            }}
          >
            <div style={{ fontSize: '13px', color: '#1e40af' }}>Calculated Total Monthly Entitlement:</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a8a', marginTop: '4px' }}>
              {baselineEntitlement} kg Wheat
            </div>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
              ({form.familyCount} members × {form.quotaPerMember.toFixed(2)} kg)
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextStep}
            style={{
              width: '100%',
              marginTop: '24px',
              padding: '14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            Continue to Add Receipt →
          </button>
        </div>
      )}

      {/* STEP 2: EVIDENCE UPLOAD */}
      {currentStep === 2 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>
            Step 2: Add Receipt Evidence
          </h2>

          <div
            style={{
              border: '2px dashed #94a3b8',
              borderRadius: '12px',
              padding: '32px 16px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
              Take Photo / Select Receipt
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
              Tap here to open camera or upload image file
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Or Review Pasted Receipt Text:
          </label>
          <textarea
            rows={4}
            value={form.receiptText}
            onChange={(e) => setForm({ ...form, receiptText: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              style={{
                flex: 2,
                padding: '14px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Review Candidate Data →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & AIR-GAP SAVE */}
      {currentStep === 3 && (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Step 3: Review & Verify Data</h2>
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: '999px',
              }}
            >
              Air-Gap Gate
            </span>
          </div>

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Receipt Date:
          </label>
          <input
            type="date"
            value={form.receiptDate}
            onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              minHeight: '48px',
              marginBottom: '14px',
            }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Commodity Item:
          </label>
          <input
            type="text"
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              minHeight: '48px',
              marginBottom: '14px',
            }}
          />

          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Quantity Documented:
          </label>
          <input
            type="number"
            step="any"
            value={form.quantityReceived}
            onChange={(e) => setForm({ ...form, quantityReceived: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxSizing: 'border-box',
              minHeight: '48px',
              marginBottom: '16px',
            }}
          />

          {/* Explicit User Confirmation Air-Gap Checkbox */}
          <div
            style={{
              padding: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <input
              type="checkbox"
              id="workflow-user-verified"
              checked={form.userVerified}
              onChange={(e) => setForm({ ...form, userVerified: e.target.checked })}
              style={{ width: '20px', height: '20px', marginTop: '2px', cursor: 'pointer' }}
            />
            <label
              htmlFor="workflow-user-verified"
              style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
            >
              I explicitly confirm this data matches the physical receipt (user_verified = true)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handlePrevStep}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleCommit}
              style={{
                flex: 2,
                padding: '14px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              Confirm & Save to Ledger
            </button>
          </div>
        </div>
      )}

      {/* Fixed Validation Modal with backdrop click and close button */}
      <ValidationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Explicit User Confirmation Required"
        message="Air-Gap Protection: AI-extracted candidate data cannot enter the database ledger without your explicit manual verification. Please check the confirmation box before saving."
        confirmLabel="I Understand"
      />
    </div>
  );
};

export default MainWorkflow;
