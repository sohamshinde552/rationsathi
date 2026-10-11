import { VerifyReceiptRequestPayload, DistributionLedgerEntry } from './types';
export interface PendingOfflineReceipt {
    local_id: string;
    payload: VerifyReceiptRequestPayload;
    created_at: string;
    sync_attempts: number;
    last_error?: string | null;
    synced: boolean;
}
export interface SyncResult {
    successful_syncs: number;
    failed_syncs: number;
    synced_entries: DistributionLedgerEntry[];
    errors: string[];
}
/**
 * Storage adapter abstraction supporting IndexedDB in browser environments
 * and an in-memory/localStorage fallback for environments where IndexedDB is unavailable.
 */
export interface IOfflineStorageAdapter {
    savePending(receipt: PendingOfflineReceipt): Promise<void>;
    getPending(): Promise<PendingOfflineReceipt[]>;
    markSynced(local_id: string): Promise<void>;
    updateError(local_id: string, error: string): Promise<void>;
    clearSynced(): Promise<void>;
}
export declare class InMemoryStorageAdapter implements IOfflineStorageAdapter {
    private store;
    savePending(receipt: PendingOfflineReceipt): Promise<void>;
    getPending(): Promise<PendingOfflineReceipt[]>;
    markSynced(local_id: string): Promise<void>;
    updateError(local_id: string, error: string): Promise<void>;
    clearSynced(): Promise<void>;
}
/**
 * IndexedDB storage adapter for modern browsers
 */
export declare class IndexedDBStorageAdapter implements IOfflineStorageAdapter {
    private dbName;
    private storeName;
    private openDB;
    savePending(receipt: PendingOfflineReceipt): Promise<void>;
    getPending(): Promise<PendingOfflineReceipt[]>;
    markSynced(local_id: string): Promise<void>;
    updateError(local_id: string, error: string): Promise<void>;
    clearSynced(): Promise<void>;
}
/**
 * Offline Sync Manager
 * Manages saving receipt items during connectivity outages and triggers sync upon reconnect.
 */
export declare class OfflineSyncManager {
    private storage;
    private apiEndpoint;
    private syncInProgress;
    constructor(storageAdapter?: IOfflineStorageAdapter, apiEndpoint?: string);
    isOnline(): boolean;
    private registerOnlineListener;
    /**
     * Submits or queues a verified receipt.
     * If offline, stores locally in pending queue.
     */
    submitReceipt(payload: VerifyReceiptRequestPayload): Promise<{
        status: 'ONLINE_SYNCED' | 'OFFLINE_QUEUED';
        data?: any;
        local_id?: string;
    }>;
    /**
     * Processes all pending offline items and commits them to the remote database
     */
    syncPendingReceipts(): Promise<SyncResult>;
    getPendingCount(): Promise<number>;
}
