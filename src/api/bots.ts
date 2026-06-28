import { apiFetch } from './client';
import type { PublicBot } from './types';

/**
 * Lightweight tenant bot directory. Powers the `@` mention picker for adding
 * (or requesting to add) a bot to a chat. Mirrors `listNodeDirectory` /
 * `listVaults`.
 */
export async function listBots(query?: string): Promise<PublicBot[]> {
  const res = await apiFetch<{ success: boolean; agents: PublicBot[]; count: number }>('/agents', {
    query: query ? { q: query } : undefined,
  });
  return res.agents;
}
