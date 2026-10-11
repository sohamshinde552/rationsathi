"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineSyncManager = exports.IndexedDBStorageAdapter = exports.InMemoryStorageAdapter = void 0;
class InMemoryStorageAdapter {
    store = new Map();
    async savePending(receipt) {
        this.store.set(receipt.local_id, receipt);
    }
    async getPending() {
        return Array.from(this.store.values()).filter((item) => !item.synced);
    }
    async markSynced(local_id) {
        const item = this.store.get(local_id);
        if (item) {
            item.synced = true;
            this.store.set(local_id, item);
        }
    }
    async updateError(local_id, error) {
        const item = this.store.get(local_id);
        if (item) {
            item.sync_attempts += 1;
            item.last_error = error;
            this.store.set(local_id, item);
        }
    }
    async clearSynced() {
        for (const [id, item] of this.store.entries()) {
            if (item.synced) {
                this.store.delete(id);
            }
        }
    }
}
exports.InMemoryStorageAdapter = InMemoryStorageAdapter;
/**
 * IndexedDB storage adapter for modern browsers
 */
class IndexedDBStorageAdapter {
    dbName = 'RationSaathiOfflineDB';
    storeName = 'pending_receipts';
    async openDB() {
        return new Promise((resolve, reject) => {
            if (typeof indexedDB === 'undefined') {
                return reject(new Error('IndexedDB is not available in this environment.'));
            }
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'local_id' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async savePending(receipt) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.put(receipt);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    async getPending() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const req = store.getAll();
            req.onsuccess = () => {
                const all = req.result || [];
                resolve(all.filter((r) => !r.synced));
            };
            req.onerror = () => reject(req.error);
        });
    }
    async markSynced(local_id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getReq = store.get(local_id);
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (item) {
                    item.synced = true;
                    store.put(item);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }
    async updateError(local_id, error) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const getReq = store.get(local_id);
            getReq.onsuccess = () => {
                const item = getReq.result;
                if (item) {
                    item.sync_attempts += 1;
                    item.last_error = error;
                    store.put(item);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }
    async clearSynced() {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const req = store.openCursor();
            req.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.synced) {
                        cursor.delete();
                    }
                    cursor.continue();
                }
                else {
                    resolve();
                }
            };
            req.onerror = () => reject(req.error);
        });
    }
}
exports.IndexedDBStorageAdapter = IndexedDBStorageAdapter;
/**
 * Offline Sync Manager
 * Manages saving receipt items during connectivity outages and triggers sync upon reconnect.
 */
class OfflineSyncManager {
    storage;
    apiEndpoint;
    syncInProgress = false;
    constructor(storageAdapter, apiEndpoint = 'http://localhost:3000/api/receipts/verify') {
        if (storageAdapter) {
            this.storage = storageAdapter;
        }
        else if (typeof indexedDB !== 'undefined') {
            this.storage = new IndexedDBStorageAdapter();
        }
        else {
            this.storage = new InMemoryStorageAdapter();
        }
        this.apiEndpoint = apiEndpoint;
        this.registerOnlineListener();
    }
    isOnline() {
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        return true; // Default fallback in non-browser envs
    }
    registerOnlineListener() {
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('online', () => {
                this.syncPendingReceipts().catch((err) => {
                    console.error('[OfflineSyncManager] Online auto-sync failed:', err);
                });
            });
        }
    }
    /**
     * Submits or queues a verified receipt.
     * If offline, stores locally in pending queue.
     */
    async submitReceipt(payload) {
        // Air-gap check
        if (!payload.user_verified) {
            throw new Error('AirGapSecurityViolation: Cannot submit unverified receipt.');
        }
        if (!this.isOnline()) {
            const localId = `LOCAL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const pending = {
                local_id: localId,
                payload,
                created_at: new Date().toISOString(),
                sync_attempts: 0,
                synced: false,
            };
            await this.storage.savePending(pending);
            return { status: 'OFFLINE_QUEUED', local_id: localId };
        }
        // When online, POST directly
        const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const json = (await response.json());
        if (!response.ok || !json.success) {
            throw new Error(json.error || 'Failed to submit verified receipt.');
        }
        return { status: 'ONLINE_SYNCED', data: json.data };
    }
    /**
     * Processes all pending offline items and commits them to the remote database
     */
    async syncPendingReceipts() {
        if (this.syncInProgress) {
            return { successful_syncs: 0, failed_syncs: 0, synced_entries: [], errors: ['Sync already in progress'] };
        }
        this.syncInProgress = true;
        const pendingItems = await this.storage.getPending();
        const result = {
            successful_syncs: 0,
            failed_syncs: 0,
            synced_entries: [],
            errors: [],
        };
        for (const item of pendingItems) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.payload),
                });
                const json = (await response.json());
                if (!response.ok || !json.success) {
                    throw new Error(json.error || `HTTP ${response.status}`);
                }
                await this.storage.markSynced(item.local_id);
                result.successful_syncs += 1;
                if (json.data) {
                    result.synced_entries.push(...json.data);
                }
            }
            catch (err) {
                const errorMsg = err.message || 'Unknown network error';
                await this.storage.updateError(item.local_id, errorMsg);
                result.failed_syncs += 1;
                result.errors.push(`Item ${item.local_id} failed: ${errorMsg}`);
            }
        }
        this.syncInProgress = false;
        return result;
    }
    async getPendingCount() {
        const list = await this.storage.getPending();
        return list.length;
    }
}
exports.OfflineSyncManager = OfflineSyncManager;
