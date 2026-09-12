import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SetupScreen from './src/screens/SetupScreen';
import WebViewScreen from './src/screens/WebViewScreen';
import { getBaseURL, saveBaseURL, clearBaseURL } from './src/utils/storage';

export default function App() {
  const [baseURL, setBaseURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBaseURL = async () => {
      const url = await getBaseURL();
      if (url) {
        setBaseURL(url);
      }
      setIsLoading(false);
    };
    loadBaseURL();
  }, []);

  const handleSetupComplete = async (url: string) => {
    await saveBaseURL(url);
    setBaseURL(url);
  };

  const handleClearBaseURL = async () => {
    await clearBaseURL();
    setBaseURL(null);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {baseURL ? (
        <WebViewScreen baseURL={baseURL} onClearBaseURL={handleClearBaseURL} />
      ) : (
        <SetupScreen onComplete={handleSetupComplete} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
