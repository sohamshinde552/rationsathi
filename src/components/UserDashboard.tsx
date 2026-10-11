import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DiscrepancyAuditReport, DistributionLedgerEntry } from '../types';
import { fetchUserLedger } from '../services/ledgerService';

export interface UserDashboardProps {
  auditReport: DiscrepancyAuditReport;
  onNavigateToReport?: () => void;
  onNavigateToNewEntry?: () => void;
  onRefresh?: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  auditReport: initialReport,
  onNavigateToReport,
  onNavigateToNewEntry,
  onRefresh,
}) => {
  const { user, signOut } = useAuth();
  const [liveEntries, setLiveEntries] = useState<DistributionLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pull real data using a useEffect calling fetchUserLedger
  useEffect(() => {
    let isMounted = true;
    const loadLedgerData = async () => {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetchUserLedger(user?.id);
      if (isMounted) {
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.data) {
          setLiveEntries(res.data);
        }
        setLoading(false);
      }
    };

    loadLedgerData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Compute live metrics from auditReport or fetched ledger entries
  let totalAllocated = 0;
  let totalReceived = 0;
  let totalShortfall = 0;

  for (const line of initialReport.line_items) {
    totalAllocated += parseFloat(line.baseline_qty) || 0;
    // If live entries are available from Supabase, sum them for this commodity
    const matchingLive = liveEntries.filter(
      (entry) =>
        entry.item_name.toLowerCase() === line.item_name.toLowerCase() && entry.user_verified
    );

    const receivedForLine =
      matchingLive.length > 0
        ? matchingLive.reduce((acc, curr) => acc + (parseFloat(String(curr.quantity_received)) || 0), 0)
        : parseFloat(line.received_qty) || 0;

    totalReceived += receivedForLine;
    const shortfallForLine = Math.max(0, (parseFloat(line.baseline_qty) || 0) - receivedForLine);
    totalShortfall += shortfallForLine;
  }

  const fulfillmentPercentage =
    totalAllocated > 0
      ? Math.min(100, Math.round((totalReceived / totalAllocated) * 100))
      : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 font-sans">
      {/* Top Tenant Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Supabase RLS Active
            </span>
            {loading && (
              <span className="text-xs text-slate-400 animate-pulse">Syncing database...</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">RationSaathi Beneficiary Dashboard</h1>
          <p className="text-sm text-slate-500">
            Household ID: <strong className="text-slate-700">{initialReport.household_id}</strong> | User:{' '}
            <span className="text-slate-700">{user?.email || 'Authenticated Beneficiary'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToNewEntry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            + Add Receipt
          </button>
          <button
            onClick={onNavigateToReport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            📄 View Official Report
          </button>
          <button
            onClick={signOut}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Toast Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span><strong>Database Notice:</strong> {errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-700 hover:text-amber-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3 Real-Time Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Total Monthly Allocation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Monthly Allocation
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">⚖️</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">{totalAllocated.toFixed(2)}</span>
            <span className="text-sm font-medium text-slate-500 ml-1">kg / units</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Entitlement for {initialReport.household_members} members ({initialReport.period})
          </p>
        </div>

        {/* Card 2: Total Received */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Verified Received
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">📦</span>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600">{totalReceived.toFixed(2)}</span>
            <span className="text-sm font-medium text-slate-500 ml-1">kg / units</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${fulfillmentPercentage}%` }}
              ></div>
            </div>
            <span className="text-xs font-semibold text-slate-600">{fulfillmentPercentage}%</span>
          </div>
        </div>

        {/* Card 3: Documented Shortfall */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Documented Difference
            </span>
            <span className={`p-2 rounded-lg text-lg ${totalShortfall > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              ⚠️
            </span>
          </div>
          <div className="mt-4">
            <span
              className={`text-3xl font-extrabold ${
                totalShortfall > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {totalShortfall.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-slate-500 ml-1">kg / units</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {totalShortfall > 0
              ? 'Recorded difference pending next distribution visit.'
              : 'Full delivery fulfilled according to verified records.'}
          </p>
        </div>
      </div>

      {/* Line Item Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900">Current Period Commodities</h2>
          <span className="text-xs font-medium text-slate-500">Period: {initialReport.period}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Commodity</th>
                <th className="py-3 px-4">Allocated</th>
                <th className="py-3 px-4">Documented Received</th>
                <th className="py-3 px-4">Difference</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Receipts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialReport.line_items.map((line, idx) => {
                const matchingLive = liveEntries.filter(
                  (entry) =>
                    entry.item_name.toLowerCase() === line.item_name.toLowerCase() && entry.user_verified
                );

                const lineReceived =
                  matchingLive.length > 0
                    ? matchingLive
                        .reduce((acc, curr) => acc + (parseFloat(String(curr.quantity_received)) || 0), 0)
                        .toFixed(2)
                    : line.received_qty;

                const lineDiff = Math.max(
                  0,
                  (parseFloat(line.baseline_qty) || 0) - (parseFloat(lineReceived) || 0)
                ).toFixed(2);

                const lineStatus = parseFloat(lineDiff) > 0 ? 'SHORTFALL' : 'FULL_DELIVERY';

                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">{line.item_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {line.baseline_qty} {line.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {lineReceived} {line.unit}
                    </td>
                    <td
                      className={`py-3 px-4 font-semibold ${
                        parseFloat(lineDiff) > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {lineDiff} {line.unit}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          lineStatus === 'FULL_DELIVERY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lineStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {matchingLive.length > 0
                        ? `${matchingLive.length} verified (Live DB)`
                        : line.linked_receipt_ids.length > 0
                        ? `${line.linked_receipt_ids.length} verified`
                        : 'None'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
