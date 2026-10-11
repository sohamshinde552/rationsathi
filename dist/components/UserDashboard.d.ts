import React from 'react';
import { DiscrepancyAuditReport } from '../types';
export interface UserDashboardProps {
    auditReport: DiscrepancyAuditReport;
    onNavigateToReport?: () => void;
    onNavigateToNewEntry?: () => void;
    onRefresh?: () => void;
}
export declare const UserDashboard: React.FC<UserDashboardProps>;
export default UserDashboard;
