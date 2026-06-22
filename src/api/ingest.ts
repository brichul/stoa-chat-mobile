import { apiFetch } from './client';

export interface IngestFile {
  uri: string;
  name: string;
  mimeType?: string;
}

/**
 * Upload data into a vault (POST /v1/vaults/{vault_id}/ingest).
 * Accepts either raw text or picked files (multipart form-data).
 */
export function ingestText(vaultId: string, text: string, title?: string): Promise<unknown> {
  return apiFetch(`/vaults/${vaultId}/ingest`, { method: 'POST', json: { text, title } });
}

export function ingestFiles(vaultId: string, files: IngestFile[]): Promise<unknown> {
  const form = new FormData();
  for (const f of files) {
    // React Native FormData file shape.
    form.append('files', { uri: f.uri, name: f.name, type: f.mimeType ?? 'application/octet-stream' } as any);
  }
  return apiFetch(`/vaults/${vaultId}/ingest`, { method: 'POST', body: form });
}
