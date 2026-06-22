import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'stoa.access_token';
const REFRESH = 'stoa.refresh_token';
const TENANT = 'stoa.tenant_slug';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  tenantSlug: string;
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken, tenantSlug] = await Promise.all([
    AsyncStorage.getItem(ACCESS),
    AsyncStorage.getItem(REFRESH),
    AsyncStorage.getItem(TENANT),
  ]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken, tenantSlug: tenantSlug ?? '' };
}

export async function saveSession(s: StoredSession): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(ACCESS, s.accessToken),
    AsyncStorage.setItem(REFRESH, s.refreshToken),
    AsyncStorage.setItem(TENANT, s.tenantSlug),
  ]);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS, REFRESH, TENANT]);
}
