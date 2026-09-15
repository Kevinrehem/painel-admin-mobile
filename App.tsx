import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { WebViewScreen } from './src/screens/WebViewScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { getSavedCredentials, getSavedAuthToken } from './src/services/auth';
import {
  ActivityIndicator,
  View,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { CustomTabBar } from './src/components/CustomTabBar';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import {
  initializeNotifications,
  setupNotificationInteractions,
  createHighPriorityChannel,
  getUnreadCount,
  NOTIFICATION_RECEIVED_EVENT,
  NOTIFICATION_READ_EVENT,
} from './src/services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Navigators ───────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Main Tabs (shown after login) ───────────────────────────────────────────

interface MainTabsProps {
  initialUrl: string;
}

/**
 * Bottom tab navigator rendered after a successful login.
 * Contains: WebView (admin panel) + Notificações.
 */
const renderTabBar = (props: any) => <CustomTabBar {...props} />;

const MainTabs: React.FC<MainTabsProps> = ({ initialUrl }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Refresh unread badge on focus
  useEffect(() => {
    const refreshBadge = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };
    refreshBadge();
    
    // Listen for real-time notification events
    const subReceived = DeviceEventEmitter.addListener(NOTIFICATION_RECEIVED_EVENT, refreshBadge);
    const subRead = DeviceEventEmitter.addListener(NOTIFICATION_READ_EVENT, refreshBadge);

    return () => {
      subReceived.remove();
      subRead.remove();
    };
  }, []);

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="WebView"
        options={{
          tabBarLabel: 'Painel',
        }}
      >
        {props => <WebViewScreen {...props} route={{ ...props.route, params: { url: initialUrl } }} />}
      </Tab.Screen>

      <Tab.Screen
        name="Notificações"
        component={NotificationScreen}
        options={{
          tabBarLabel: 'Notificações',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
        listeners={{
          tabPress: async () => {
            // Refresh badge after visiting notifications tab
            const count = await getUnreadCount();
            setUnreadCount(count);
          },
        }}
      />
    </Tab.Navigator>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string>('');

  useEffect(() => {
    const requestPushPermissionAndToken = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        try {
          const fcmToken = await getToken(messagingInstance);
          console.log('FCM Token:', fcmToken);

          // Guard: não envia se o token for nulo
          if (!fcmToken) {
            console.warn('[PushToken] FCM token nulo — registro ignorado.');
            return;
          }

          const credentials = await getSavedCredentials();
          if (credentials && credentials.url) {
            const authToken = await getSavedAuthToken();
            const success = await syncFCMTokenToBackend(fcmToken, credentials.url, authToken);
            if (success) {
              console.log('Push token registrado com sucesso no backend no boot do app!');
            }
          }
        } catch (error) {
          console.error('Erro ao obter FCM token:', error);
        }
      }
    };

    const checkCredentials = async () => {
      const credentials = await getSavedCredentials();
      if (credentials) {
        let finalUrl = credentials.url;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`;
        }
        setWebViewUrl(`${finalUrl}/admin`);
        setInitialRoute('MainTabs');
      } else {
        setInitialRoute('Login');
      }
    };

    // Initialize: create high-priority FCM channel, then request permissions
    createHighPriorityChannel();
    requestPushPermissionAndToken();
    checkCredentials();

    // Initialize foreground notification handler and background interactions
    const unsubscribeNotifications = initializeNotifications();
    const unsubscribeInteractions = setupNotificationInteractions();

    const messagingInstance = getMessaging();
    const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async newToken => {
      console.log('FCM Token atualizado:', newToken);
      const credentials = await getSavedCredentials();
      if (credentials && credentials.url) {
        const authToken = await getSavedAuthToken();
        await syncFCMTokenToBackend(newToken, credentials.url, authToken);
      }
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeInteractions();
      unsubscribeTokenRefresh();
    };
  }, []);

  if (!initialRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs">
            {(props) => {
              const url = props.route?.params?.params?.url || props.route?.params?.url || webViewUrl;
              return <MainTabs initialUrl={url} />;
            }}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
