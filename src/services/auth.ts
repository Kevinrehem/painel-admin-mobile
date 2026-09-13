import * as Keychain from 'react-native-keychain';
import CookieManager from '@react-native-cookies/cookies';

const KEYCHAIN_JWT_SERVICE = 'landpager_auth_jwt';

const ALLOWED_DOMAIN_SUFFIX = '.landpager.com';

/**
 * Validates if the given URL belongs to landpager.com
 */
export const isValidDomain = (url: string): boolean => {
  try {
    let checkUrl = url;
    if (!checkUrl.startsWith('http://') && !checkUrl.startsWith('https://')) {
      checkUrl = `https://${checkUrl}`;
    }
    const parsedUrl = new URL(checkUrl);
    return parsedUrl.hostname === 'landpager.com' || parsedUrl.hostname.endsWith(ALLOWED_DOMAIN_SUFFIX);
  } catch {
    return false;
  }
};

/**
 * Performs login and stores the authentication cookie.
 */
export const loginAndSetCookie = async (domainUrl: string, password: string): Promise<string | null> => {
  if (!isValidDomain(domainUrl)) {
    throw new Error('SSRF Blocked: URL is not an allowed landpager.com domain.');
  }

  let finalUrl = domainUrl;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://${finalUrl}`;
  }

  try {
    const loginEndpoint = `${finalUrl}/api/auth/login`;
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Incorrect password.');
      }
      throw new Error(`Login failed with status: ${response.status}`);
    }

    // Extract cookie and return token for explicit injection in subsequent requests
    const setCookieHeader = response.headers.get('set-cookie');
    let extractedToken: string | null = null;

    if (setCookieHeader) {
      const match = setCookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        extractedToken = match[1];
        // Also set via CookieManager for WebView session continuity
        await CookieManager.set(finalUrl, {
          name: 'auth-token',
          value: extractedToken,
          domain: new URL(finalUrl).hostname,
          path: '/',
          version: '1',
          expires: '2030-01-01T00:00:00.00-00:00',
          secure: true,
          httpOnly: true,
        });
        console.log('[Auth] auth-token extraído e setado via CookieManager com sucesso.');
      } else {
        console.warn('[Auth] Header set-cookie recebido mas sem auth-token:', setCookieHeader);
      }
    } else {
      console.warn('[Auth] Nenhum header set-cookie na resposta de login. Backend pode não ter gerado cookie.');
    }

    // Save credentials to Keychain for auto-login
    await Keychain.setGenericPassword(finalUrl, password);

    // Persist JWT in a separate Keychain entry so it can be retrieved
    // on subsequent app opens without a new login request.
    if (extractedToken) {
      await Keychain.setGenericPassword('jwt', extractedToken, { service: KEYCHAIN_JWT_SERVICE });
      console.log('[Auth] JWT persistido no Keychain com sucesso.');
    }

    // Return the raw token string so the caller can inject it explicitly if needed
    return extractedToken;
  } catch (error) {
    console.error('Auth Service Error:', error);
    throw error;
  }
};

export const getSavedCredentials = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      return {
        url: credentials.username, // we used username field for URL
        password: credentials.password
      };
    }
    return null;
  } catch (error) {
    console.error('Keychain could not be accessed!', error);
    return null;
  }
};

/**
 * Retrieves the persisted JWT auth token from the Keychain.
 * Returns null if no token has been stored yet.
 */
export const getSavedAuthToken = async (): Promise<string | null> => {
  try {
    const result = await Keychain.getGenericPassword({ service: KEYCHAIN_JWT_SERVICE });
    if (result) {
      return result.password; // JWT is stored in the password field
    }
    return null;
  } catch (error) {
    console.error('[Auth] Falha ao recuperar JWT do Keychain:', error);
    return null;
  }
};

export const clearCredentials = async () => {
  await Keychain.resetGenericPassword();
  await Keychain.resetGenericPassword({ service: KEYCHAIN_JWT_SERVICE });
  await CookieManager.clearAll();
};
