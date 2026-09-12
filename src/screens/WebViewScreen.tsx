import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, useColorScheme, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { getFCMToken } from '../services/notifications';
import { clearCredentials } from '../services/auth';

interface WebViewScreenProps {
  route: any;
  navigation: any;
}

export const WebViewScreen: React.FC<WebViewScreenProps> = ({ route, navigation }) => {
  const { url } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';
  const themeBackgroundColor = isDarkMode ? '#1A202C' : '#FFFFFF';
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBackgroundColor }]}>
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={themeBackgroundColor} 
      />
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleMessage}
        sharedCookiesEnabled={true} // ensure cookies are shared with webview
        injectedJavaScript={`
          // Setup a global error handler or initial message if needed
          true;
        `}
      />
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182CE" />
        </View>
      )}
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
  },
});
