import { apiFetch } from './client';

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
 */
export async function uploadFile(asset: UploadAsset): Promise<UploadResult> {
  const form = new FormData();
  // React Native FormData file shape.
  form.append('file', {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? 'application/octet-stream',
  } as any);
  const res = await apiFetch<{ success: boolean; upload: UploadResult }>('/uploads', {
    method: 'POST',
    body: form,
  });
  return res.upload;
}
