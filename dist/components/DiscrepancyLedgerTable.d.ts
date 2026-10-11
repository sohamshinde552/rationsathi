import React from 'react';
import { DiscrepancyAuditReport, DiscrepancyLineItem } from '../types';
export interface DiscrepancyLedgerTableProps {
    auditReport: DiscrepancyAuditReport;
    onItemSelect?: (item: DiscrepancyLineItem) => void;
}
export declare const DiscrepancyLedgerTable: React.FC<DiscrepancyLedgerTableProps>;
export default DiscrepancyLedgerTable;
