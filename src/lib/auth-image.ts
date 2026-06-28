import { getAuthToken } from '@/api/client';
import { API_BASE_URL } from '@/api/config';

export interface AuthImageSource {
  uri: string;
  headers?: Record<string, string>;
}

/**
 * Build an `expo-image` source for a possibly auth-protected URL. Uploaded media
 * is served from `${API_BASE_URL}/files/{id}`, which requires the bearer token;
 * for those URLs we attach the Authorization header. External URLs (link
 * previews, gravatars, …) are returned as-is.
 */
export function authImageSource(uri?: string | null): AuthImageSource | undefined {
  if (!uri) return undefined;
  const token = getAuthToken();
  if (token && uri.startsWith(API_BASE_URL)) {
    return { uri, headers: { Authorization: `Bearer ${token}` } };
  }
  return { uri };
}
