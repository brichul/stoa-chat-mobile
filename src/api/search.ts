import { apiFetch } from './client';
import type { SearchResult } from './types';

export interface SemanticSearchParams {
  query: string;
  vault_id?: string;
  limit?: number;
}

export async function semanticSearch(params: SemanticSearchParams): Promise<SearchResult[]> {
  const res = await apiFetch<{ success: boolean; results: SearchResult[] }>('/search/semantic', {
    method: 'POST',
    json: params,
  });
  return res.results ?? [];
}
