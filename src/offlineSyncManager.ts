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

export class InMemoryStorageAdapter implements IOfflineStorageAdapter {
  private store: Map<string, PendingOfflineReceipt> = new Map();

  async savePending(receipt: PendingOfflineReceipt): Promise<void> {
    this.store.set(receipt.local_id, receipt);
  }

  async getPending(): Promise<PendingOfflineReceipt[]> {
    return Array.from(this.store.values()).filter((item) => !item.synced);
  }

  async markSynced(local_id: string): Promise<void> {
    const item = this.store.get(local_id);
    if (item) {
      item.synced = true;
      this.store.set(local_id, item);
    }
  }

  async updateError(local_id: string, error: string): Promise<void> {
    const item = this.store.get(local_id);
    if (item) {
      item.sync_attempts += 1;
      item.last_error = error;
      this.store.set(local_id, item);
    }
  }

  async clearSynced(): Promise<void> {
    for (const [id, item] of this.store.entries()) {
      if (item.synced) {
        this.store.delete(id);
      }
    }
  }
}

/**
 * IndexedDB storage adapter for modern browsers
 */
export class IndexedDBStorageAdapter implements IOfflineStorageAdapter {
  private dbName = 'RationSaathiOfflineDB';
  private storeName = 'pending_receipts';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        return reject(new Error('IndexedDB is not available in this environment.'));
      }
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'local_id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePending(receipt: PendingOfflineReceipt): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(receipt);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getPending(): Promise<PendingOfflineReceipt[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: PendingOfflineReceipt[] = req.result || [];
        resolve(all.filter((r) => !r.synced));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async markSynced(local_id: string): Promise<void> {
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

  async updateError(local_id: string, error: string): Promise<void> {
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

  async clearSynced(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.openCursor();
      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}

/**
 * Offline Sync Manager
 * Manages saving receipt items during connectivity outages and triggers sync upon reconnect.
 */
export class OfflineSyncManager {
  private storage: IOfflineStorageAdapter;
  private apiEndpoint: string;
  private syncInProgress = false;

  constructor(
    storageAdapter?: IOfflineStorageAdapter,
    apiEndpoint = 'http://localhost:3000/api/receipts/verify'
  ) {
    if (storageAdapter) {
      this.storage = storageAdapter;
    } else if (typeof indexedDB !== 'undefined') {
      this.storage = new IndexedDBStorageAdapter();
    } else {
      this.storage = new InMemoryStorageAdapter();
    }
    this.apiEndpoint = apiEndpoint;

    this.registerOnlineListener();
  }

  public isOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true; // Default fallback in non-browser envs
  }

  private registerOnlineListener(): void {
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
  public async submitReceipt(
    payload: VerifyReceiptRequestPayload
  ): Promise<{ status: 'ONLINE_SYNCED' | 'OFFLINE_QUEUED'; data?: any; local_id?: string }> {
    // Air-gap check
    if (!payload.user_verified) {
      throw new Error('AirGapSecurityViolation: Cannot submit unverified receipt.');
    }

    if (!this.isOnline()) {
      const localId = `LOCAL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const pending: PendingOfflineReceipt = {
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

    const json = (await response.json()) as any;
    if (!response.ok || !json.success) {
      throw new Error(json.error || 'Failed to submit verified receipt.');
    }

    return { status: 'ONLINE_SYNCED', data: json.data };
  }

  /**
   * Processes all pending offline items and commits them to the remote database
   */
  public async syncPendingReceipts(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { successful_syncs: 0, failed_syncs: 0, synced_entries: [], errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    const pendingItems = await this.storage.getPending();
    const result: SyncResult = {
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

        const json = (await response.json()) as any;
        if (!response.ok || !json.success) {
          throw new Error(json.error || `HTTP ${response.status}`);
        }

        await this.storage.markSynced(item.local_id);
        result.successful_syncs += 1;
        if (json.data) {
          result.synced_entries.push(...json.data);
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Unknown network error';
        await this.storage.updateError(item.local_id, errorMsg);
        result.failed_syncs += 1;
        result.errors.push(`Item ${item.local_id} failed: ${errorMsg}`);
      }
    }

    this.syncInProgress = false;
    return result;
  }

  public async getPendingCount(): Promise<number> {
    const list = await this.storage.getPending();
    return list.length;
  }
}
