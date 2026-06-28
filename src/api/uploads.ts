import { getAuthToken } from './client';
import { API_V1 } from './config';

export interface UploadAsset {
  uri: string;
  name: string;
  mimeType?: string;
}

export interface UploadResult {
  id: string;
  /** Durable, auth-protected URL (GET /files/{id} — send Authorization header). */
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

/**
 * Upload a file (chat attachment, avatar, …) via multipart POST /v1/uploads.
 * Returns a durable URL served from GET /files/{id}; loading it requires the
 * bearer token, so render through the auth-image helper (src/lib/auth-image.ts).
 *
 * Uses XMLHttpRequest rather than fetch on purpose: Expo's fetch implementation
 * (expo/fetch) rejects React Native's `{ uri, name, type }` FormData part with
 * "Unsupported FormDataPart implementation". RN's XHR handles it natively.
 */
export async function uploadFile(asset: UploadAsset): Promise<UploadResult> {
  const form = new FormData();
  // React Native FormData file shape (read from a file:// or ph:// URI).
  form.append('file', {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/octet-stream',
  } as any);

  const token = getAuthToken();

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_V1}/uploads`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    // Note: do NOT set Content-Type — XHR sets the multipart boundary itself.

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { success: boolean; upload: UploadResult };
          resolve(data.upload);
        } catch (e) {
          reject(new Error(`Upload succeeded but response was not JSON: ${xhr.responseText?.slice(0, 200)}`));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText?.slice(0, 200)}`));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.send(form);
  });
}
