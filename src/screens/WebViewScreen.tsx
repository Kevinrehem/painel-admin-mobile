import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { registerForPushNotificationsAsync } from '../utils/notifications';

interface WebViewScreenProps {
  baseURL: string;
  onClearBaseURL: () => void;
}

export default function WebViewScreen({ baseURL, onClearBaseURL }: WebViewScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const [pushToken, setPushToken] = useState<string | undefined>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setPushToken(token);
      }
    });
  }, []);

  const INJECTED_JAVASCRIPT = `
    window.isNativeApp = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
    true;
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'READY' && pushToken) {
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('ExpoPushTokenReceived', { detail: '${pushToken}' }));
          true;
        `);
      } else if (data.type === 'CLEAR_BASE_URL') {
        onClearBaseURL();
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: baseURL }}
        style={styles.webview}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        onMessage={handleMessage}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
