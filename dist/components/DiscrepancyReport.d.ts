import React from 'react';
import { NeutralReportData } from '../reportTemplate';
export interface DiscrepancyReportProps {
    data: NeutralReportData;
    onBack?: () => void;
}
export declare const DiscrepancyReport: React.FC<DiscrepancyReportProps>;
export default DiscrepancyReport;
