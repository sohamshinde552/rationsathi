import React, { useState } from 'react';

export interface ReportExporterProps {
  containerId?: string;
  filename?: string;
  onBeforeExport?: () => boolean; // Return false to cancel export (e.g. if banned words found)
}

export const ReportExporter: React.FC<ReportExporterProps> = ({
  containerId = 'discrepancy-report-container',
  filename = 'RationSaathi_Report.pdf',
  onBeforeExport,
}) => {
  const [exporting, setExporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Bulletproof Client-Side Only PDF Download Function
  const handleDownloadPDF = async () => {
    // 1. SSR check
    if (typeof window === 'undefined') {
      return;
    }

    // 2. Pre-flight callback (e.g., banned-word neutrality verification)
    if (onBeforeExport && !onBeforeExport()) {
      setStatusMessage('Export cancelled: Neutral language guardrail violation.');
      return;
    }

    // 3. Locate exact target element
    const element = document.getElementById(containerId);
    if (!element) {
      alert(`Error: Report container #${containerId} not found.`);
      return;
    }

    setExporting(true);
    setStatusMessage('Generating PDF...');

    try {
      // Dynamic import to guarantee html2pdf.js only runs in the client browser (prevents Next.js/SSR "window is not defined")
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(element).save();
      setStatusMessage('✓ PDF generated successfully.');
    } catch (err: any) {
      console.warn('[ReportExporter] html2pdf execution failed, falling back to window.print():', err);
      // Bulletproof Fallback: trigger browser print
      window.print();
      setStatusMessage('✓ Opened print dialog (browser fallback).');
    } finally {
      setExporting(false);
    }
  };

  // Dedicated Print Button Fallback
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      if (onBeforeExport && !onBeforeExport()) {
        setStatusMessage('Print cancelled: Neutral language guardrail violation.');
        return;
      }
      window.print();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {statusMessage && (
        <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {statusMessage}
        </span>
      )}
      <button
        type="button"
        id="btn-download-pdf"
        onClick={handleDownloadPDF}
        disabled={exporting}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <span>📥</span>
        <span>{exporting ? 'Exporting PDF...' : 'Download PDF Report'}</span>
      </button>

      <button
        type="button"
        id="btn-print-report"
        onClick={handlePrint}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
      >
        <span>🖨️</span>
        <span>Print Report</span>
      </button>
    </div>
  );
};

export default ReportExporter;
