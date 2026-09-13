import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { loginAndSetCookie } from '../services/auth';
import { getFCMToken, syncFCMTokenToBackend } from '../services/notifications';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const themeBackgroundColor = isDarkMode ? '#1A202C' : '#F7FAFC';
  const statusBarStyle = isDarkMode ? 'light-content' : 'dark-content';

  const handleLogin = async () => {
    if (!domain || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      const authToken = await loginAndSetCookie(domain, password);
      let finalUrl = domain;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = `https://${finalUrl}`;
      }

      try {
        const token = await getFCMToken();
        if (token) {
          // Pass authToken explicitly to bypass CookieManager native race condition
          await syncFCMTokenToBackend(token, finalUrl, authToken);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar token no login', err);
      }

      navigation.replace('MainTabs', { screen: 'WebView', params: { url: `${finalUrl}/admin` } });
    } catch (error: any) {
      Alert.alert('Erro de Autenticação', error.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeBackgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar 
        barStyle={statusBarStyle} 
        backgroundColor={themeBackgroundColor} 
      />
      <View style={styles.card}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Landpager Admin</Text>
          <Text style={styles.subtitle}>Gerencie suas páginas com segurança</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Domínio da Página</Text>
          <TextInput
            style={styles.input}
            placeholder="exemplo.landpager.com"
            placeholderTextColor="#A0AEC0"
            value={domain}
            onChangeText={setDomain}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Senha do Painel</Text>
          <TextInput
            style={styles.input}
            placeholder="Sua senha secreta"
            placeholderTextColor="#A0AEC0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Acessar Painel</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  button: {
    backgroundColor: '#3182CE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3182CE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#90CDF4',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
