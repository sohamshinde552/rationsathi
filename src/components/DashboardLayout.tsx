import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import LedgerEntryForm from './LedgerEntryForm';
import DiscrepancyReport from './DiscrepancyReport';
import { DiscrepancyAuditReport } from '../types';
import { NeutralReportData } from '../reportTemplate';

export const DashboardLayout: React.FC = () => {
  const { user, loading, signInWithPassword, signUp, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'add_entry' | 'report'>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [householdId, setHouseholdId] = useState('HH-MUMBAI-04');
  const [authMessage, setAuthMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);

  // Sample or state-backed report data for current tenant
  const [auditReport, setAuditReport] = useState<DiscrepancyAuditReport>({
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
  });

  const reportData: NeutralReportData = {
    report: auditReport,
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
    head_of_family_name: fullName || 'Suresh Patil',
  };

  // Handle Supabase Login / Sign-up submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Contacting Supabase Auth...' });

    if (authMode === 'login') {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        setAuthMessage({ type: 'error', text: error.message || 'Login failed.' });
      } else {
        setAuthMessage({ type: 'success', text: 'Authenticated successfully!' });
      }
    } else {
      const { error } = await signUp(email, password, {
        full_name: fullName,
        household_id: householdId,
      });
      if (error) {
        setAuthMessage({ type: 'error', text: error.message || 'Sign-up failed.' });
      } else {
        setAuthMessage({
          type: 'success',
          text: 'Account created! Please check your email or proceed directly.',
        });
      }
    }
  };

  // 1. ROUTE GUARD: If user is not authenticated, show login page
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="text-slate-600 font-semibold text-sm">Verifying Supabase authentication session...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div id="login-view" className="flex items-center justify-center min-h-screen bg-slate-50 font-sans p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-md w-full shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">RationSaathi Portal</h1>
            <p className="text-sm text-slate-500 mt-1">
              {authMode === 'login' ? 'Supabase Beneficiary Sign-In' : 'Create Beneficiary Account'}
            </p>
          </div>

          {authMessage && (
            <div
              className={`p-3 mb-4 rounded-lg text-xs font-semibold ${
                authMessage.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : authMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {authMessage.text}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Head of Family Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suresh Patil"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Household ID
                  </label>
                  <input
                    type="text"
                    required
                    value={householdId}
                    onChange={(e) => setHouseholdId(e.target.value)}
                    placeholder="e.g. HH-MUMBAI-04"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Beneficiary Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="beneficiary@rationsaathi.org"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition"
            >
              {authMode === 'login' ? 'Sign In with Supabase' : 'Create Supabase Account'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setAuthMessage(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {authMode === 'login'
                  ? "Don't have an account? Register here"
                  : 'Already registered? Sign In'}
              </button>
            </div>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-semibold">Or Instant Access</span>
            </div>
          </div>

          {/* Hackathon Demo / Guest Bypass Button */}
          <button
            type="button"
            id="btn-guest-demo"
            onClick={() => {
              const demoUser = {
                id: 'demo-123',
                email: 'demo-beneficiary@rationsaathi.org',
                user_metadata: { name: 'Demo Beneficiary' },
              } as any;
              if (typeof window !== 'undefined') {
                localStorage.setItem('rationsaathi_mock_user', JSON.stringify(demoUser));
              }
              window.location.reload();
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>🚀</span>
            <span>Start Hackathon Demo (No Sign-up Required)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD SUB-ROUTES
  return (
    <div className="min-h-screen bg-slate-50">
      {currentView === 'dashboard' && (
        <UserDashboard
          auditReport={auditReport}
          onNavigateToNewEntry={() => setCurrentView('add_entry')}
          onNavigateToReport={() => setCurrentView('report')}
        />
      )}

      {currentView === 'add_entry' && (
        <div className="max-w-4xl mx-auto p-4 md:p-6 font-sans">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="mb-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            ← Back to Dashboard
          </button>
          <LedgerEntryForm
            householdId={auditReport.household_id}
            userId={user.id}
            onSuccess={() => {
              // Return to dashboard upon successful submission
              setCurrentView('dashboard');
            }}
          />
        </div>
      )}

      {currentView === 'report' && (
        <DiscrepancyReport
          data={reportData}
          onBack={() => setCurrentView('dashboard')}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
