import { apiFetch } from './client';
import type { KnowledgeNode, NodeLink } from './types';

/** List the knowledge nodes inside a vault (graph vertices for a vault). */
export async function listNodes(vaultId: string): Promise<KnowledgeNode[]> {
  const res = await apiFetch<{ success: boolean; nodes: KnowledgeNode[] }>(`/vaults/${vaultId}/nodes`);
  return res.nodes ?? [];
}

export async function getNode(nodeId: string): Promise<KnowledgeNode> {
  const res = await apiFetch<{ success: boolean; node: KnowledgeNode }>(`/nodes/${nodeId}`);
  return res.node;
}

/** Create a graph edge between two nodes. */
export function createLink(
  nodeId: string,
  toNodeId: string,
  relation?: string
): Promise<{ success: boolean; link: NodeLink }> {
  return apiFetch(`/nodes/${nodeId}/links`, { method: 'POST', json: { to_node_id: toNodeId, relation } });
}

export function deleteLink(nodeId: string, linkId: string): Promise<{ success: boolean }> {
  return apiFetch(`/nodes/${nodeId}/links/${linkId}`, { method: 'DELETE' });
}
