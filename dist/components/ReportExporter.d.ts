import React from 'react';
export interface ReportExporterProps {
    containerId?: string;
    filename?: string;
    onBeforeExport?: () => boolean;
}
export declare const ReportExporter: React.FC<ReportExporterProps>;
export default ReportExporter;
