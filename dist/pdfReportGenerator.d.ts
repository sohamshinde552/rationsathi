import { NeutralReportData } from './reportTemplate';
/**
 * Generates an official, immutable PDF reconciliation report buffer.
 * Renders Header, Household Summary, Line Item Comparison Table, Neutral Explanatory Disclaimer, and Evidence Appendix.
 */
export declare function generateDiscrepancyPDF(data: NeutralReportData): Promise<Buffer>;
