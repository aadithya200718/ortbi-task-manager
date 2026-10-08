import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from './session-core';

export { restoreSession, type TokenStorage } from './session-core';

export const TOKEN_STORAGE_KEY = 'orbit_access_token';

export const tokenStorage: TokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_STORAGE_KEY),
  set: (token) => SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  clear: () => SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY),
};
