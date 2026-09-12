import * as Keychain from 'react-native-keychain';
import CookieManager from '@react-native-cookies/cookies';

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
  } catch (error) {
    return false;
  }
};

/**
 * Performs login and stores the authentication cookie.
 */
export const loginAndSetCookie = async (domainUrl: string, password: string): Promise<boolean> => {
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

    // Extract cookie
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      // Parse token from header if needed, but CookieManager can handle setting it natively.
      // However, it's safer to extract 'auth-token' and set it manually via CookieManager.
      const match = setCookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        const tokenValue = match[1];
        await CookieManager.set(finalUrl, {
          name: 'auth-token',
          value: tokenValue,
          domain: new URL(finalUrl).hostname,
          path: '/',
          version: '1',
          expires: '2030-01-01T00:00:00.00-00:00', // Example far future date
          secure: true,
          httpOnly: true,
        });
      }
    }

    // Save to Keychain
    await Keychain.setGenericPassword(finalUrl, password);
    
    return true;
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

export const clearCredentials = async () => {
  await Keychain.resetGenericPassword();
  await CookieManager.clearAll();
};
