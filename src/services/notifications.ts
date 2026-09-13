import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onMessage,
  setBackgroundMessageHandler,
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';

export const NOTIFICATION_RECEIVED_EVENT = 'onNotificationReceived';
export const NOTIFICATION_READ_EVENT = 'onNotificationRead';

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTIFICATIONS_STORAGE_KEY = '@notifications_store';
const MAX_STORED_NOTIFICATIONS = 50;
const HIGH_PRIORITY_CHANNEL_ID = 'high_priority_channel_v2';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DynamicField {
  label: string;
  value: string;
}

export interface StoredNotification {
  id: string;
  receivedAt: string;
  type: string;
  title: string;
  message: string;
  dynamicFields: DynamicField[];
  read: boolean;
}

// ─── FCM Token Sync ───────────────────────────────────────────────────────────

/**
 * Syncs the FCM token to the backend.
 *
 * @param token - The FCM device token.
 * @param domainUrl - The target Landpager domain URL.
 * @param authToken - Optional: the raw JWT string extracted at login time.
 *   Use this to mitigate the CookieManager native-thread race condition on the
 *   first fetch immediately after login. If provided, it is injected explicitly
 *   as a Cookie header instead of relying on the cookie jar being ready.
 */
export const syncFCMTokenToBackend = async (
  token: string,
  domainUrl: string,
  authToken?: string | null,
): Promise<boolean> => {
  let finalUrl = domainUrl;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://${finalUrl}`;
  }

  const endpoint = `${finalUrl}/api/settings/push-token`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Mitigação: se o authToken foi fornecido pelo caller, injeta explicitamente
  // no header Cookie para evitar dependência do CookieManager nativo ser
  // resolvido a tempo nesta thread.
  if (authToken) {
    headers.Cookie = `auth-token=${authToken}`;
    console.log('[PushToken] Injetando Cookie explícito via authToken fornecido pelo caller.');
  } else {
    console.log('[PushToken] authToken não fornecido. Dependendo do CookieManager nativo.');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token, deviceType: 'android' }),
    });

    if (!response.ok) {
      // Diagnóstico completo: loga status e corpo do erro
      const errText = await response.text();
      console.error(
        `[PushToken] ❌ Falha ao registrar Push Token.` +
        ` Status: ${response.status} | Endpoint: ${endpoint} | Erro: ${errText}`,
      );
      return false;
    }

    console.log('[PushToken] ✅ Push token registrado com sucesso no backend!');
    return true;
  } catch (error) {
    console.error('[PushToken] ❌ Erro de rede ao registrar push token:', error);
    return false;
  }
};

// ─── Permission & Token ───────────────────────────────────────────────────────

export const requestUserPermission = async (): Promise<boolean> => {
  const messagingInstance = getMessaging();
  const authStatus = await requestPermission(messagingInstance);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  return enabled;
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = getMessaging();
    const token = await getToken(messagingInstance);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

// ─── Channel Creation ─────────────────────────────────────────────────────────

/**
 * Cria o canal Android de alta prioridade para heads-up notifications.
 * Deve ser chamado na inicialização do app, antes da primeira notificação.
 *
 * Canais Android são imutáveis após criação. Se o canal já existir com
 * prioridade inferior, será necessário desinstalar e reinstalar o app.
 *
 * Ref: https://firebase.google.com/docs/cloud-messaging/android/client#create-notification-channel
 */
export const createHighPriorityChannel = async (): Promise<void> => {
  try {
    await notifee.createChannel({
      id: HIGH_PRIORITY_CHANNEL_ID,
      name: 'High Priority Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'coin_8bit',
      vibration: true,
      vibrationPattern: [300, 500],
    });
    console.log(`[Channel] Canal '${HIGH_PRIORITY_CHANNEL_ID}' criado via Notifee com sucesso.`);
  } catch (error) {
    console.error('[Channel] Erro ao configurar canal de alta prioridade via Notifee:', error);
  }
};

// ─── Persistence ──────────────────────────────────────────────────────────────

/**
 * Parses the `dynamicFields` string from an FCM data payload safely.
 * Returns an empty array if the value is missing, not a string, or malformed JSON.
 */
export const parseDynamicFields = (raw: string | undefined | null): DynamicField[] => {
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Validate shape: filter out entries without label or value
    return parsed.filter(
      (item): item is DynamicField =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.label === 'string' &&
        typeof item.value === 'string',
    );
  } catch {
    console.warn('[Notifications] Failed to parse dynamicFields — returning empty array.');
    return [];
  }
};

/**
 * Persists a received remote message to AsyncStorage.
 * Enforces a FIFO limit of MAX_STORED_NOTIFICATIONS items.
 * Deduplicates by `id` (messageId).
 */
export const saveNotificationToStorage = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> => {
  try {
    const data = remoteMessage.data ?? {};
    const id = remoteMessage.messageId ?? new Date().toISOString();

    const notification: StoredNotification = {
      id,
      receivedAt: new Date().toISOString(),
      type: (data.type as string) ?? 'UNKNOWN',
      title: (data.title as string) ?? remoteMessage.notification?.title ?? '',
      message: (data.message as string) ?? remoteMessage.notification?.body ?? '',
      dynamicFields: parseDynamicFields(data.dynamicFields as string | undefined),
      read: false,
    };

    const existing = await getStoredNotifications();

    // Deduplicate: skip if this messageId already exists
    if (existing.some(n => n.id === id)) {
      console.log(`[Notifications] Notificação ${id} já existe — ignorando.`);
      return;
    }

    // Prepend new notification and enforce FIFO limit
    const updated = [notification, ...existing].slice(0, MAX_STORED_NOTIFICATIONS);

    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    console.log(`[Notifications] ✅ Notificação ${id} salva. Total: ${updated.length}`);
    DeviceEventEmitter.emit(NOTIFICATION_RECEIVED_EVENT);
  } catch (error) {
    console.error('[Notifications] ❌ Erro ao salvar notificação:', error);
  }
};

/**
 * Retrieves all stored notifications from AsyncStorage, sorted newest-first.
 * Returns an empty array if nothing is stored or on parse error.
 */
export const getStoredNotifications = async (): Promise<StoredNotification[]> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as StoredNotification[];
  } catch (error) {
    console.error('[Notifications] ❌ Erro ao recuperar notificações:', error);
    return [];
  }
};

/**
 * Marks a notification as read by its ID.
 */
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const notifications = await getStoredNotifications();
    const updated = notifications.map(n => (n.id === id ? { ...n, read: true } : n));
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    DeviceEventEmitter.emit(NOTIFICATION_READ_EVENT, id);
  } catch (error) {
    console.error('[Notifications] ❌ Erro ao marcar notificação como lida:', error);
  }
};

/**
 * Returns the count of unread notifications.
 */
export const getUnreadCount = async (): Promise<number> => {
  const notifications = await getStoredNotifications();
  return notifications.filter(n => !n.read).length;
};

// ─── Notification Handlers ────────────────────────────────────────────────────

/**
 * Initializes foreground notification handling.
 * Saves the notification to AsyncStorage and shows an alert.
 *
 * @returns Unsubscribe function — call it on component unmount.
 */
export const initializeNotifications = () => {
  const messagingInstance = getMessaging();

  const unsubscribe = onMessage(messagingInstance, async remoteMessage => {
    // Persist to storage before displaying
    await saveNotificationToStorage(remoteMessage);

    const title = remoteMessage.data?.title as string || remoteMessage.notification?.title || 'Nova Notificação';
    const body = remoteMessage.data?.message as string || remoteMessage.notification?.body || '';

    // Show heads-up notification using Notifee instead of Alert
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: HIGH_PRIORITY_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher', // default android icon
        pressAction: {
          id: 'default',
        },
      },
    });
  });

  return unsubscribe;
};

// Handle background messages — must be registered outside of React component tree
// and called as early as possible (module level).
setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
  console.log('[Notifications] Mensagem recebida em background:', remoteMessage.messageId);
  await saveNotificationToStorage(remoteMessage);

  const title = remoteMessage.data?.title as string || remoteMessage.notification?.title;
  const body = remoteMessage.data?.message as string || remoteMessage.notification?.body;

  if (title || body) {
    await notifee.displayNotification({
      title: title || 'Nova Notificação',
      body: body || '',
      android: {
        channelId: HIGH_PRIORITY_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  }
});
