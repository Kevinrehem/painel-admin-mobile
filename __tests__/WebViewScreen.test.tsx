/**
 * Unit tests for src/screens/WebViewScreen.tsx
 *
 * TDD scope:
 * - Verifies that the loading spinner is cleared after the 15s safety timeout
 * - Verifies initial render with loading indicator
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { WebViewScreen } from '../src/screens/WebViewScreen';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../src/services/auth', () => ({
  clearCredentials: jest.fn(() => Promise.resolve()),
  getSavedCredentials: jest.fn(() => Promise.resolve(null)),
  getSavedAuthToken: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../src/services/notifications', () => ({
  getFCMToken: jest.fn(() => Promise.resolve('mock-token')),
  syncFCMTokenToBackend: jest.fn(() => Promise.resolve(true)),
  initializeNotifications: jest.fn(() => jest.fn()),
  createHighPriorityChannel: jest.fn(() => Promise.resolve()),
  getUnreadCount: jest.fn(() => Promise.resolve(0)),
  saveNotificationToStorage: jest.fn(() => Promise.resolve()),
  getStoredNotifications: jest.fn(() => Promise.resolve([])),
  markNotificationAsRead: jest.fn(() => Promise.resolve()),
  parseDynamicFields: jest.fn(() => []),
  setBackgroundMessageHandler: jest.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRoute = (url = 'https://example.com') => ({
  params: { url },
  key: 'WebView',
  name: 'WebView',
});

const makeNavigation = () => ({
  replace: jest.fn(),
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WebViewScreen — loading state', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders ActivityIndicator initially (loading=true)', async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(
        <WebViewScreen route={makeRoute()} navigation={makeNavigation()} />,
      );
    });
    // @ts-ignore
    const json = component!.toJSON();
    // The tree should contain an ActivityIndicator
    // Since toJSON gives plain objects, we check for type string
    const hasSpinner = JSON.stringify(json).includes('ActivityIndicator');
    expect(hasSpinner).toBe(true);
  });

  it('clears the ActivityIndicator after the 15s safety timeout', async () => {
    let component: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(
        <WebViewScreen route={makeRoute()} navigation={makeNavigation()} />,
      );
    });

    // Fast-forward 15 seconds
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    // @ts-ignore
    const json = component!.toJSON();
    const hasSpinner = JSON.stringify(json).includes('ActivityIndicator');
    expect(hasSpinner).toBe(false);
  });
});
