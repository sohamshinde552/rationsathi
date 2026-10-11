import { DistributionLedgerEntry } from './types';
export declare const app: import("express-serve-static-core").Express;
export declare const inMemoryLedger: DistributionLedgerEntry[];
export interface RegisteredUser {
    id: string;
    name: string;
    email: string;
    household_id: string;
    family_count: number;
    created_at: string;
}
export declare const registeredUsers: RegisteredUser[];
export default app;
