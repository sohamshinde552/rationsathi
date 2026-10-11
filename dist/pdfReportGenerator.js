"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiscrepancyPDF = generateDiscrepancyPDF;
const pdfkit_1 = __importDefault(require("pdfkit"));
const reportTemplate_1 = require("./reportTemplate");
/**
 * Generates an official, immutable PDF reconciliation report buffer.
 * Renders Header, Household Summary, Line Item Comparison Table, Neutral Explanatory Disclaimer, and Evidence Appendix.
 */
async function generateDiscrepancyPDF(data) {
    const { report, evidence_items, scheme_name, ration_card_type, head_of_family_name } = data;
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                margin: 40,
                size: 'A4',
            });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => {
                const fullPdf = Buffer.concat(buffers);
                resolve(fullPdf);
            });
            // Title & Header
            doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a').text('Administrative Entitlement Reconciliation Report');
            doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Public Distribution Entitlement & Verification Audit • Period: ${report.period}`);
            doc.moveDown(1);
            // Horizontal separator
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown(1);
            // Household Meta Box
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#0f172a').text('Beneficiary Household Summary');
            doc.moveDown(0.3);
            doc.fontSize(9).font('Helvetica').fillColor('#334155');
            doc.text(`Household ID: ${report.household_id}   |   Head of Family: ${head_of_family_name || 'Registered Beneficiary'}`);
            doc.text(`Registered Members: ${report.household_members}   |   Scheme: ${scheme_name || 'PDS'} (${ration_card_type || 'Standard'})`);
            doc.text(`Audit Generated At: ${new Date(report.generated_at).toLocaleString()}`);
            doc.moveDown(1.5);
            // Section 1: Line Item Math
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('1. Entitlement & Delivery Reconciliation');
            doc.moveDown(0.5);
            // Table Header
            let startY = doc.y;
            doc.rect(40, startY, 515, 20).fill('#f1f5f9');
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
            doc.text('Item Description', 45, startY + 6, { width: 95 });
            doc.text('Allocated Entitlement', 140, startY + 6, { width: 90 });
            doc.text('Documented Received', 230, startY + 6, { width: 90 });
            doc.text('Recorded Difference', 320, startY + 6, { width: 85 });
            doc.text('Status', 410, startY + 6, { width: 70 });
            doc.text('Evidence Ref', 480, startY + 6, { width: 70 });
            let currentY = startY + 22;
            // Table Rows
            doc.font('Helvetica').fontSize(8).fillColor('#334155');
            for (const line of report.line_items) {
                doc.rect(40, currentY, 515, 20).strokeColor('#f1f5f9').stroke();
                doc.font('Helvetica-Bold').text(line.item_name, 45, currentY + 6, { width: 95 });
                doc.font('Helvetica').text(`${line.baseline_qty} ${line.unit}`, 140, currentY + 6, { width: 90 });
                doc.text(`${line.received_qty} ${line.unit}`, 230, currentY + 6, { width: 90 });
                doc.text(`${line.shortfall_qty} ${line.unit}`, 320, currentY + 6, { width: 85 });
                doc.text(line.status, 410, currentY + 6, { width: 70 });
                const refText = line.linked_receipt_ids.length > 0
                    ? line.linked_receipt_ids.map((id) => `Ref-${id}`).join(', ')
                    : 'None';
                doc.text(refText, 480, currentY + 6, { width: 70 });
                currentY += 22;
            }
            doc.y = currentY + 15;
            // Section 2: Evidence Appendix
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('2. Evidence Appendix & Audit Provenance');
            doc.moveDown(0.5);
            startY = doc.y;
            doc.rect(40, startY, 515, 20).fill('#f1f5f9');
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
            doc.text('Receipt ID', 45, startY + 6, { width: 80 });
            doc.text('Date', 130, startY + 6, { width: 70 });
            doc.text('Verified Item', 205, startY + 6, { width: 90 });
            doc.text('Documented Qty', 300, startY + 6, { width: 80 });
            doc.text('Source Type', 385, startY + 6, { width: 70 });
            doc.text('Reference Link', 460, startY + 6, { width: 90 });
            currentY = startY + 22;
            doc.font('Helvetica').fontSize(8).fillColor('#334155');
            if (evidence_items.length === 0) {
                doc.text('No physical receipts recorded for this period.', 45, currentY + 6);
                currentY += 20;
            }
            else {
                for (const ev of evidence_items) {
                    doc.rect(40, currentY, 515, 20).strokeColor('#f1f5f9').stroke();
                    doc.font('Helvetica-Bold').text(ev.evidence_id || ev.transaction_id, 45, currentY + 6, { width: 80 });
                    doc.font('Helvetica').text(ev.transaction_date, 130, currentY + 6, { width: 70 });
                    doc.text(ev.verified_item, 205, currentY + 6, { width: 90 });
                    doc.text(`${ev.quantity_received} ${ev.unit}`, 300, currentY + 6, { width: 80 });
                    doc.text(ev.source_type, 385, currentY + 6, { width: 70 });
                    doc.text(ev.reference_link, 460, currentY + 6, { width: 90 });
                    currentY += 22;
                }
            }
            doc.y = currentY + 20;
            // Section 3: Neutral Administrative Disclaimer Box
            const disclaimerY = Math.min(doc.y, 680);
            doc.rect(40, disclaimerY, 515, 45).fill('#f8fafc').strokeColor('#94a3b8').stroke();
            doc.rect(40, disclaimerY, 4, 45).fill('#64748b'); // Left accent bar
            doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text('Administrative Notice:', 52, disclaimerY + 8);
            doc.font('Helvetica').fillColor('#475569').text(reportTemplate_1.NEUTRAL_DISCLAIMER_TEXT, 52, disclaimerY + 20, { width: 490 });
            // Footer
            doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(`Administrative Reconciliation Report • Document ID: REC-AUDIT-${Date.now()} • RationSaathi Deterministic Core v1.0`, 40, 780, { align: 'center', width: 515 });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
}
