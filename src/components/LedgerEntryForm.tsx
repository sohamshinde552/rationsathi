import React, { useState, useRef } from 'react';
import ValidationModal from './ValidationModal';
import { CandidateItem } from '../types';

import { supabase } from '../lib/supabaseClient';
import { insertLedgerEntry } from '../services/ledgerService';

export interface LedgerEntryFormProps {
  householdId: string;
  onSuccess?: (newEntry: any) => void;
  apiBaseUrl?: string;
  userId?: string;
}

export const LedgerEntryForm: React.FC<LedgerEntryFormProps> = ({
  householdId,
  onSuccess,
  apiBaseUrl = '',
  userId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [itemName, setItemName] = useState<string>('Wheat');
  const [quantityReceived, setQuantityReceived] = useState<string>('');
  const [unit, setUnit] = useState<string>('kg');
  const [pastedText, setPastedText] = useState<string>('');
  const [userVerified, setUserVerified] = useState<boolean>(false);
  const [candidateSuggestions, setCandidateSuggestions] = useState<CandidateItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Complete Form & Buffer Reset Function
  const resetFormState = () => {
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setItemName('Wheat');
    setQuantityReceived('');
    setUnit('kg');
    setPastedText('');
    setUserVerified(false);
    setCandidateSuggestions([]);

    // Clear file input buffer
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // OCR Extraction Handler
  const handleParseReceipt = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/receipts/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: pastedText }),
      });
      const json = await res.json();
      if (json.data) {
        if (json.data.extracted_date) setReceiptDate(json.data.extracted_date);
        if (json.data.candidate_items && json.data.candidate_items.length > 0) {
          setCandidateSuggestions(json.data.candidate_items);
          const first = json.data.candidate_items[0];
          if (first.item_name) setItemName(first.item_name);
          if (first.extracted_qty !== null) setQuantityReceived(String(first.extracted_qty));
          if (first.extracted_unit) setUnit(first.extracted_unit);
        }
        setUserVerified(false); // Air-Gap constraint: must remain unchecked
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: 'Failed to parse receipt text.' });
    }
  };

  /**
   * Refactored Form Submission: handleCommitToLedger
   * 1. Session Validation: Awaits supabase.auth.getSession() and alerts if missing.
   * 2. Explicit Data Insertion: Inserts to distribution_ledger with .select().
   * 3. Diagnostic Error Handling: Console.error and user alert.
   * 4. Success State: Console.log, alert, and form reset.
   */
  const handleCommitToLedger = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFeedback(null);

    // Air-gap check
    if (!userVerified) {
      setModalOpen(true);
      return;
    }

    if (!quantityReceived || parseFloat(quantityReceived) <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid received quantity.' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Session Validation
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const currentSession = sessionData?.session;

      if (sessionError || !currentSession) {
        console.warn('SUPABASE AUTH NOTICE: No active Supabase session detected.', sessionError);
        alert('You must be logged in to save data!');
        setFeedback({
          type: 'error',
          message: 'You must be logged in to save data to Supabase.',
        });
        setSubmitting(false);
        return;
      }

      const activeUserId = currentSession.user.id;
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const evidenceId = `REC-${Date.now().toString().slice(-4)}`;

      // 2. Explicit Data Insertion with .select() to confirm RLS bypass
      const newLedgerRow = {
        transaction_id: transactionId,
        household_id: householdId,
        evidence_id: evidenceId,
        item_name: itemName.trim(),
        quantity_received: quantityReceived.trim(),
        date_received: receiptDate,
        user_verified: true,
        user_id: activeUserId,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('distribution_ledger')
        .insert([newLedgerRow])
        .select();

      // 3. Diagnostic Error Handling
      if (error) {
        console.error('SUPABASE SAVE ERROR:', error.message, error.details, error.hint);
        alert(`Failed to save: ${error.message}`);
        setFeedback({
          type: 'error',
          message: `Failed to save: ${error.message}`,
        });
        setSubmitting(false);
        return;
      }

      // 4. Success State
      console.log('SUCCESSFULLY SAVED:', data);
      alert('Data saved successfully!');

      setFeedback({
        type: 'success',
        message: 'Successfully verified and committed receipt to distribution ledger!',
      });

      // Synchronize with local Express gateway
      try {
        await fetch(`${apiBaseUrl}/api/receipts/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household_id: householdId,
            evidence_id: evidenceId,
            date_received: receiptDate,
            user_verified: true,
            items: [
              {
                item_name: itemName.trim(),
                quantity_received: quantityReceived.trim(),
                unit: unit.trim(),
              },
            ],
          }),
        });
      } catch (syncErr) {
        console.warn('Local ledger sync warning:', syncErr);
      }

      // Reset form fields and buffers
      resetFormState();

      if (onSuccess) {
        onSuccess(data ? data[0] : newLedgerRow);
      }
    } catch (err: any) {
      console.error('UNHANDLED SAVE EXCEPTION:', err);
      alert(`Failed to save: ${err.message || 'Unknown network error'}`);
      setFeedback({
        type: 'error',
        message: err.message || 'Submission failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Add Verified Receipt to Ledger</h2>
          <p className="text-xs text-slate-500">Record a partial or full ration disbursement visit</p>
        </div>
        <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
          🛡️ Air-Gap Verification Active
        </span>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-lg mb-4 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleCommitToLedger} className="space-y-4">
        {/* File Upload Buffer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Receipt Image Evidence
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* OCR Raw Text Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Receipt Notes / OCR Text
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. Fair Price Shop 2026-10-04 Wheat 8.00kg"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleParseReceipt}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Parse Text
            </button>
          </div>
        </div>

        {/* Candidate Badge if populated */}
        {candidateSuggestions.length > 0 && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900">
            <strong>Candidate Extracted:</strong> {candidateSuggestions[0].item_name} —{' '}
            {candidateSuggestions[0].extracted_qty} {candidateSuggestions[0].extracted_unit} (
            {Math.round(candidateSuggestions[0].confidence * 100)}% confidence). Please confirm
            details below.
          </div>
        )}

        {/* Item Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Date</label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Commodity</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              placeholder="e.g. Wheat"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Received
            </label>
            <div className="flex gap-1">
              <input
                type="number"
                step="any"
                value={quantityReceived}
                onChange={(e) => setQuantityReceived(e.target.value)}
                required
                placeholder="e.g. 8.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="inline-flex items-center px-3 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-600 font-semibold">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Explicit Confirmation Checkbox */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3 mt-2">
          <input
            type="checkbox"
            id="form-user-verified"
            checked={userVerified}
            onChange={(e) => setUserVerified(e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
          />
          <label htmlFor="form-user-verified" className="text-xs text-slate-800 font-medium cursor-pointer">
            <strong>Explicit Air-Gap Gate:</strong> I confirm this data strictly matches the physical
            receipt or disbursement evidence (sets <code className="text-blue-600">user_verified = true</code>).
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={resetFormState}
            className="px-4 py-2 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Committing...' : 'Add to Ledger'}
          </button>
        </div>
      </form>

      {/* Validation modal for unconfirmed submissions */}
      <ValidationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Explicit User Confirmation Required"
        message="Air-Gap Protection: Extracted or entered candidate data cannot enter the ledger without your explicit manual verification. Please check the confirmation box before submitting."
        confirmLabel="I Understand"
      />
    </div>
  );
};

export default LedgerEntryForm;
