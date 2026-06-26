import { apiFetch } from './client';
import type { Chat, ChatStatus, ChatType, Message } from './types';

export interface ListChatsParams {
  chat_type?: ChatType;
  status?: ChatStatus;
  limit?: number;
  offset?: number;
}

export async function listChats(params: ListChatsParams = {}): Promise<Chat[]> {
  const res = await apiFetch<{ success: boolean; chats: Chat[]; count: number }>('/chats', {
    query: params as Record<string, unknown>,
  });
  return res.chats;
}

export async function getPinnedChats(): Promise<Chat[]> {
  const res = await apiFetch<{ success: boolean; chats: Chat[] }>('/chats/pinned');
  return res.chats;
}

export async function getChat(chatId: string): Promise<Chat> {
  const res = await apiFetch<{ success: boolean; chat: Chat }>(`/chats/${chatId}`);
  return res.chat;
}

export async function createChat(name?: string): Promise<Chat> {
  const res = await apiFetch<{ success: boolean; chat: Chat }>('/chats', { method: 'POST', json: { name } });
  return res.chat;
}

export function updateChat(chatId: string, name: string): Promise<{ success: boolean; chat: Chat }> {
  return apiFetch(`/chats/${chatId}`, { method: 'PATCH', json: { name } });
}

export function archiveChat(chatId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}`, { method: 'DELETE' });
}

export interface ListMessagesParams {
  before?: number;
  limit?: number;
}

export async function listMessages(
  chatId: string,
  params: ListMessagesParams = {}
): Promise<{ messages: Message[]; has_more: boolean }> {
  const res = await apiFetch<{ success: boolean; messages: Message[]; has_more: boolean }>(
    `/chats/${chatId}/messages`,
    { query: params as Record<string, unknown> }
  );
  return { messages: res.messages, has_more: res.has_more };
}

export async function sendMessage(
  chatId: string,
  content: string,
  replyToId?: string
): Promise<Message> {
  const res = await apiFetch<{ success: boolean; message: Message }>(`/chats/${chatId}/messages`, {
    method: 'POST',
    json: { content, ...(replyToId ? { reply_to_id: replyToId } : {}) },
  });
  return res.message;
}

export async function forwardMessage(
  chatId: string,
  messageId: string,
  targetChatId: string
): Promise<Message> {
  const res = await apiFetch<{ success: boolean; message: Message }>(
    `/chats/${chatId}/messages/${messageId}/forward`,
    { method: 'POST', json: { target_chat_id: targetChatId } }
  );
  return res.message;
}

export function markRead(chatId: string, messageId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/read`, { method: 'POST', json: { message_id: messageId } });
}

export function addParticipant(
  chatId: string,
  id: string,
  type: 'user' | 'bot',
  permission: 'read' | 'write' = 'write'
): Promise<{ success: boolean; status?: string }> {
  return apiFetch(`/chats/${chatId}/participants`, { method: 'POST', json: { id, type, permission } });
}

/** Remove a participant (or leave, when removing yourself). Owner-only for others. */
export function removeParticipant(
  chatId: string,
  participantId: string
): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/participants/${participantId}`, { method: 'DELETE' });
}

export function pinChat(chatId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/pin`, { method: 'POST' });
}

export function unpinChat(chatId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/pin`, { method: 'DELETE' });
}

export function attachNode(
  chatId: string,
  nodeId: string
): Promise<{ success: boolean; status?: string }> {
  return apiFetch(`/chats/${chatId}/nodes`, { method: 'POST', json: { node_id: nodeId } });
}

export function detachNode(chatId: string, nodeId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/nodes/${nodeId}`, { method: 'DELETE' });
}

export function attachVault(
  chatId: string,
  vaultId: string
): Promise<{ success: boolean; status?: string }> {
  return apiFetch(`/chats/${chatId}/vaults`, { method: 'POST', json: { vault_id: vaultId } });
}

export function detachVault(chatId: string, vaultId: string): Promise<{ success: boolean }> {
  return apiFetch(`/chats/${chatId}/vaults/${vaultId}`, { method: 'DELETE' });
}

export function addReaction(
  chatId: string,
  messageId: string,
  emoji: string
): Promise<{ success: boolean; counts: Record<string, number> }> {
  return apiFetch(`/chats/${chatId}/messages/${messageId}/reactions`, {
    method: 'POST',
    json: { emoji },
  });
}

export function getPinnedMessages(chatId: string): Promise<{ success: boolean; messages: Message[] }> {
  return apiFetch(`/chats/${chatId}/pinned-messages`);
}
