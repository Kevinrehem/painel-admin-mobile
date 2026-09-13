/**
 * Unit tests for src/services/notifications.ts
 *
 * TDD scope:
 * - parseDynamicFields: safe parsing, malformed JSON, wrong shape
 * - saveNotificationToStorage: persistence, FIFO limit (50), deduplication
 * - getStoredNotifications: empty store, populated store
 * - markNotificationAsRead: toggles read flag
 * - getUnreadCount: counts correctly
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseDynamicFields,
  saveNotificationToStorage,
  getStoredNotifications,
  markNotificationAsRead,
  getUnreadCount,
  StoredNotification,
  DynamicField,
} from '../src/services/notifications';
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@notifications_store';

/** Clears the in-memory AsyncStorage mock between tests */
const clearStorage = async () => {
  await AsyncStorage.clear();
};

/** Builds a minimal RemoteMessage stub */
const makeRemoteMessage = (
  overrides: Partial<FirebaseMessagingTypes.RemoteMessage> = {},
): FirebaseMessagingTypes.RemoteMessage => ({
  messageId: `msg-${Date.now()}`,
  data: {
    type: 'PURCHASE_ALERT',
    title: 'Compra realizada',
    message: 'Compra de R$99,00',
    dynamicFields: '[{"label":"Cliente","value":"João"}]',
  },
  ...overrides,
} as FirebaseMessagingTypes.RemoteMessage);

/** Seeds AsyncStorage with a list of stored notifications */
const seedNotifications = async (notifications: StoredNotification[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
};

/** Builds a stub StoredNotification */
const makeStoredNotification = (id: string, read = false): StoredNotification => ({
  id,
  receivedAt: new Date().toISOString(),
  type: 'PURCHASE_ALERT',
  title: 'Test',
  message: 'Test message',
  dynamicFields: [],
  read,
});

// ─── parseDynamicFields ───────────────────────────────────────────────────────

describe('parseDynamicFields', () => {
  it('parses a valid JSON array of DynamicField objects', () => {
    const input = '[{"label":"Cliente","value":"João"},{"label":"Produto","value":"Plano"}]';
    const result: DynamicField[] = parseDynamicFields(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: 'Cliente', value: 'João' });
    expect(result[1]).toEqual({ label: 'Produto', value: 'Plano' });
  });

  it('returns empty array for undefined input', () => {
    expect(parseDynamicFields(undefined)).toEqual([]);
  });

  it('returns empty array for null input', () => {
    expect(parseDynamicFields(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseDynamicFields('')).toEqual([]);
  });

  it('returns empty array for malformed JSON — does NOT throw', () => {
    expect(() => parseDynamicFields('not-valid-json')).not.toThrow();
    expect(parseDynamicFields('not-valid-json')).toEqual([]);
  });

  it('returns empty array when JSON is valid but not an array', () => {
    expect(parseDynamicFields('{"label":"x","value":"y"}')).toEqual([]);
  });

  it('filters out entries missing label or value', () => {
    const input = '[{"label":"OK","value":"yes"},{"label":"missing"},{"value":"missing label"}]';
    const result = parseDynamicFields(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ label: 'OK', value: 'yes' });
  });

  it('filters out non-object entries in array', () => {
    const input = '[null,42,"string",{"label":"valid","value":"yes"}]';
    const result = parseDynamicFields(input);
    expect(result).toHaveLength(1);
  });
});

// ─── getStoredNotifications ───────────────────────────────────────────────────

describe('getStoredNotifications', () => {
  beforeEach(clearStorage);

  it('returns empty array when nothing is stored', async () => {
    const result = await getStoredNotifications();
    expect(result).toEqual([]);
  });

  it('returns stored notifications correctly', async () => {
    const notifications = [makeStoredNotification('n1'), makeStoredNotification('n2')];
    await seedNotifications(notifications);
    const result = await getStoredNotifications();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('n1');
  });

  it('returns empty array if AsyncStorage contains invalid JSON', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'corrupted-json');
    const result = await getStoredNotifications();
    expect(result).toEqual([]);
  });

  it('returns empty array if AsyncStorage contains a non-array JSON', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{"not":"array"}');
    const result = await getStoredNotifications();
    expect(result).toEqual([]);
  });
});

// ─── saveNotificationToStorage ────────────────────────────────────────────────

describe('saveNotificationToStorage', () => {
  beforeEach(clearStorage);

  it('saves a notification to an empty store', async () => {
    const msg = makeRemoteMessage({ messageId: 'msg-001' });
    await saveNotificationToStorage(msg);
    const stored = await getStoredNotifications();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('msg-001');
    expect(stored[0].read).toBe(false);
    expect(stored[0].type).toBe('PURCHASE_ALERT');
    expect(stored[0].title).toBe('Compra realizada');
  });

  it('parses dynamicFields from message data', async () => {
    const msg = makeRemoteMessage({ messageId: 'msg-002' });
    await saveNotificationToStorage(msg);
    const stored = await getStoredNotifications();
    expect(stored[0].dynamicFields).toHaveLength(1);
    expect(stored[0].dynamicFields[0]).toEqual({ label: 'Cliente', value: 'João' });
  });

  it('handles missing dynamicFields gracefully', async () => {
    const msg = makeRemoteMessage({
      messageId: 'msg-003',
      data: { type: 'PURCHASE_ALERT', title: 'Test', message: 'Msg' },
    });
    await saveNotificationToStorage(msg);
    const stored = await getStoredNotifications();
    expect(stored[0].dynamicFields).toEqual([]);
  });

  it('handles malformed dynamicFields JSON gracefully', async () => {
    const msg = makeRemoteMessage({
      messageId: 'msg-004',
      data: {
        type: 'PURCHASE_ALERT',
        title: 'Test',
        message: 'Msg',
        dynamicFields: 'THIS IS NOT JSON!!!',
      },
    });
    await saveNotificationToStorage(msg);
    const stored = await getStoredNotifications();
    expect(stored[0].dynamicFields).toEqual([]);
  });

  it('deduplicates by messageId — does not add duplicate', async () => {
    const msg = makeRemoteMessage({ messageId: 'msg-dup' });
    await saveNotificationToStorage(msg);
    await saveNotificationToStorage(msg);
    const stored = await getStoredNotifications();
    expect(stored).toHaveLength(1);
  });

  it('prepends new notifications (newest first)', async () => {
    const older = makeRemoteMessage({ messageId: 'older' });
    const newer = makeRemoteMessage({ messageId: 'newer' });
    await saveNotificationToStorage(older);
    await saveNotificationToStorage(newer);
    const stored = await getStoredNotifications();
    expect(stored[0].id).toBe('newer');
    expect(stored[1].id).toBe('older');
  });

  it('enforces the 50-item FIFO limit', async () => {
    // Seed 50 notifications
    const existing = Array.from({ length: 50 }, (_, i) =>
      makeStoredNotification(`existing-${i}`),
    );
    await seedNotifications(existing);

    // Add one more
    const extra = makeRemoteMessage({ messageId: 'extra-51' });
    await saveNotificationToStorage(extra);

    const stored = await getStoredNotifications();
    expect(stored).toHaveLength(50);
    // Newest should be first
    expect(stored[0].id).toBe('extra-51');
    // Oldest (existing-49) should have been evicted
    const ids = stored.map(n => n.id);
    expect(ids).not.toContain('existing-49');
  });
});

// ─── markNotificationAsRead ───────────────────────────────────────────────────

describe('markNotificationAsRead', () => {
  beforeEach(clearStorage);

  it('marks a specific notification as read', async () => {
    const notifications = [
      makeStoredNotification('n1', false),
      makeStoredNotification('n2', false),
    ];
    await seedNotifications(notifications);

    await markNotificationAsRead('n1');
    const stored = await getStoredNotifications();
    const n1 = stored.find(n => n.id === 'n1');
    const n2 = stored.find(n => n.id === 'n2');
    expect(n1?.read).toBe(true);
    expect(n2?.read).toBe(false); // untouched
  });

  it('is idempotent — marking already-read notification has no side effects', async () => {
    await seedNotifications([makeStoredNotification('n1', true)]);
    await markNotificationAsRead('n1');
    const stored = await getStoredNotifications();
    expect(stored[0].read).toBe(true);
  });
});

// ─── getUnreadCount ───────────────────────────────────────────────────────────

describe('getUnreadCount', () => {
  beforeEach(clearStorage);

  it('returns 0 when store is empty', async () => {
    expect(await getUnreadCount()).toBe(0);
  });

  it('returns correct count of unread notifications', async () => {
    const notifications = [
      makeStoredNotification('n1', false),
      makeStoredNotification('n2', true),
      makeStoredNotification('n3', false),
    ];
    await seedNotifications(notifications);
    expect(await getUnreadCount()).toBe(2);
  });

  it('returns 0 when all notifications are read', async () => {
    const notifications = [
      makeStoredNotification('n1', true),
      makeStoredNotification('n2', true),
    ];
    await seedNotifications(notifications);
    expect(await getUnreadCount()).toBe(0);
  });
});
