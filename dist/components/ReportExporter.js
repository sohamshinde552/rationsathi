"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExporter = void 0;
const react_1 = __importStar(require("react"));
const ReportExporter = ({ containerId = 'discrepancy-report-container', filename = 'RationSaathi_Report.pdf', onBeforeExport, }) => {
    const [exporting, setExporting] = (0, react_1.useState)(false);
    const [statusMessage, setStatusMessage] = (0, react_1.useState)(null);
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
            const html2pdfModule = await Promise.resolve().then(() => __importStar(require('html2pdf.js')));
            const html2pdf = (html2pdfModule.default || html2pdfModule);
            const opt = {
                margin: 0.5,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
            };
            await html2pdf().set(opt).from(element).save();
            setStatusMessage('✓ PDF generated successfully.');
        }
        catch (err) {
            console.warn('[ReportExporter] html2pdf execution failed, falling back to window.print():', err);
            // Bulletproof Fallback: trigger browser print
            window.print();
            setStatusMessage('✓ Opened print dialog (browser fallback).');
        }
        finally {
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
    return (react_1.default.createElement("div", { className: "flex items-center gap-3" },
        statusMessage && (react_1.default.createElement("span", { className: "text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200" }, statusMessage)),
        react_1.default.createElement("button", { type: "button", id: "btn-download-pdf", onClick: handleDownloadPDF, disabled: exporting, className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50" },
            react_1.default.createElement("span", null, "\uD83D\uDCE5"),
            react_1.default.createElement("span", null, exporting ? 'Exporting PDF...' : 'Download PDF Report')),
        react_1.default.createElement("button", { type: "button", id: "btn-print-report", onClick: handlePrint, className: "px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer" },
            react_1.default.createElement("span", null, "\uD83D\uDDA8\uFE0F"),
            react_1.default.createElement("span", null, "Print Report"))));
};
exports.ReportExporter = ReportExporter;
exports.default = exports.ReportExporter;
