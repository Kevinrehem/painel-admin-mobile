import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL_KEY = '@baseURL';

export const saveBaseURL = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(BASE_URL_KEY, url);
  } catch (error) {
    console.error('Error saving baseURL:', error);
  }
};

export const getBaseURL = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(BASE_URL_KEY);
  } catch (error) {
    console.error('Error getting baseURL:', error);
    return null;
  }
};

export const clearBaseURL = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BASE_URL_KEY);
  } catch (error) {
    console.error('Error clearing baseURL:', error);
  }
};
