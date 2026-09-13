/* eslint-env jest */
jest.mock('@react-native-cookies/cookies', () => ({
  clearAll: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return {
    getMessaging: jest.fn(() => ({})),
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(1)), // AUTHORIZED
    getToken: jest.fn(() => Promise.resolve('myMockToken')),
    onTokenRefresh: jest.fn(() => jest.fn()),
    setBackgroundMessageHandler: jest.fn(),
    onMessage: jest.fn(),
    AuthorizationStatus: {
      AUTHORIZED: 1,
      PROVISIONAL: 2,
      DENIED: 0,
      NOT_DETERMINED: -1,
    }
  };
});

jest.mock('@notifee/react-native', () => ({
  default: {
    createChannel: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
  },
  AndroidImportance: {
    DEFAULT: 3,
    HIGH: 4,
    MAX: 5,
  },
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  // In-memory store that mimics AsyncStorage API
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(k => delete store[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map(k => [k, store[k] ?? null])),
    ),
    multiSet: jest.fn((pairs: [string, string][]) => {
      pairs.forEach(([k, v]) => { store[k] = v; });
      return Promise.resolve();
    }),
    multiRemove: jest.fn((keys: string[]) => {
      keys.forEach(k => delete store[k]);
      return Promise.resolve();
    }),
    __store: store, // expose for test introspection
  };
});

