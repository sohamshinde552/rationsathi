import { OfflineSyncManager, InMemoryStorageAdapter } from '../src/offlineSyncManager';
import { VerifyReceiptRequestPayload } from '../src/types';

describe('Phase 5: Offline Sync Manager Suite', () => {
  let inMemoryStorage: InMemoryStorageAdapter;
  let syncManager: OfflineSyncManager;

  beforeEach(() => {
    inMemoryStorage = new InMemoryStorageAdapter();
    syncManager = new OfflineSyncManager(inMemoryStorage, 'http://localhost:3000/api/receipts/verify');
  });

  const validPayload: VerifyReceiptRequestPayload = {
    household_id: 'HH-OFFLINE-01',
    evidence_id: 'EVID-OFF-01',
    date_received: '2026-10-09',
    user_verified: true,
    items: [{ item_name: 'Wheat', quantity_received: '10.00', unit: 'kg' }],
  };

  test('Queues receipt in offline store when network is unavailable', async () => {
    // Mock offline condition
    jest.spyOn(syncManager, 'isOnline').mockReturnValue(false);

    const result = await syncManager.submitReceipt(validPayload);

    expect(result.status).toBe('OFFLINE_QUEUED');
    expect(result.local_id).toBeDefined();

    const pendingCount = await syncManager.getPendingCount();
    expect(pendingCount).toBe(1);

    const pendingList = await inMemoryStorage.getPending();
    expect(pendingList[0].payload.household_id).toBe('HH-OFFLINE-01');
    expect(pendingList[0].synced).toBe(false);
  });

  test('Reconnection background sync commits queued offline items upon reconnect', async () => {
    // Stage an offline item
    jest.spyOn(syncManager, 'isOnline').mockReturnValue(false);
    await syncManager.submitReceipt(validPayload);
    expect(await syncManager.getPendingCount()).toBe(1);

    // Mock global fetch for remote API synchronization
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: [{ transaction_id: 'TXN-SYNC-01', user_verified: true }],
      }),
    });
    global.fetch = mockFetch as any;

    // Trigger sync
    const syncResult = await syncManager.syncPendingReceipts();

    expect(syncResult.successful_syncs).toBe(1);
    expect(syncResult.failed_syncs).toBe(0);
    expect(syncResult.synced_entries).toHaveLength(1);
    expect(await syncManager.getPendingCount()).toBe(0);
  });

  test('Rejects submission with unverified payload even in offline mode', async () => {
    const unverifiedPayload: VerifyReceiptRequestPayload = {
      ...validPayload,
      user_verified: false,
    };

    await expect(syncManager.submitReceipt(unverifiedPayload)).rejects.toThrow(
      'AirGapSecurityViolation: Cannot submit unverified receipt.'
    );
  });
});
