import { apiFetch } from './client';
import type { Vault } from './types';

export async function listVaults(): Promise<Vault[]> {
  const res = await apiFetch<{ success: boolean; vaults: Vault[] }>('/vaults/');
  return res.vaults ?? [];
}

export async function getVault(vaultId: string): Promise<Vault> {
  const res = await apiFetch<{ success: boolean; vault: Vault }>(`/vaults/${vaultId}`);
  return res.vault;
}

export function createVault(name: string, type?: string): Promise<{ success: boolean; vault: Vault }> {
  return apiFetch('/vaults/', { method: 'POST', json: { name, type } });
}
