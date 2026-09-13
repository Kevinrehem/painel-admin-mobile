import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, useColorScheme, StatusBar, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview';
import { getFCMToken } from '../services/notifications';
import { clearCredentials } from '../services/auth';

interface WebViewScreenProps {
  route: any;
  navigation: any;
}

export const WebViewScreen: React.FC<WebViewScreenProps> = ({ route, navigation }) => {
  const { url } = route.params;
  const webViewRef = useRef<WebView>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const themeBackgroundColor = isDarkMode ? '#1A202C' : '#FFFFFF';
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to clear loading indicator after 15s
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 15000);
    return () => clearTimeout(timer);
  }, []);

  // Expose function to send token to webview
  const injectTokenScript = (token: string) => `
    window.postMessage({ type: 'FCM_TOKEN', token: '${token}' }, '*');
    true;
  `;

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'REQUEST_FCM_TOKEN') {
        const token = await getFCMToken();
        if (token && webViewRef.current) {
          webViewRef.current.injectJavaScript(injectTokenScript(token));
        }
      } else if (data.type === 'LOGOUT') {
        await clearCredentials();
        navigation.replace('Login');
      }
    } catch (error) {
      console.log('Error parsing webview message', error);
    }
  };

  const handleError = (syntheticEvent: WebViewErrorEvent) => {
    console.warn('[WebView] onError:', syntheticEvent.nativeEvent);
  };

  const handleHttpError = (syntheticEvent: WebViewHttpErrorEvent) => {
    console.warn('[WebView] onHttpError:', syntheticEvent.nativeEvent.statusCode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBackgroundColor }]} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={themeBackgroundColor}
      />
      {isLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: themeBackgroundColor }]}>
          <ActivityIndicator size="large" color="#3182CE" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadEnd={() => setIsLoading(false)}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        sharedCookiesEnabled={true} // ensure cookies are shared with webview
        injectedJavaScript={`
          // Setup a global error handler or initial message if needed
          true;
        `}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
