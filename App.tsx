import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './src/screens/LoginScreen';
import { WebViewScreen } from './src/screens/WebViewScreen';
import { getSavedCredentials } from './src/services/auth';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [initialParams, setInitialParams] = useState<any>(null);

  useEffect(() => {
    const checkCredentials = async () => {
      const credentials = await getSavedCredentials();
      if (credentials) {
        // Assume user is already logged in, redirect to webview
        let finalUrl = credentials.url;
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = `https://${finalUrl}`;
        }
        setInitialRoute('WebView');
        setInitialParams({ url: `${finalUrl}/admin` });
      } else {
        setInitialRoute('Login');
      }
    };
    checkCredentials();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
          <Stack.Screen
            name="WebView"
            component={WebViewScreen}
            initialParams={initialParams}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
