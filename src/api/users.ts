import { apiFetch } from './client';
import type { User } from './types';

/** A user in the tenant directory. Regular members receive only the public
 *  fields (id, username, display_name, avatar_url); admins receive full records. */
export interface DirectoryUser {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  [key: string]: unknown;
}

/**
 * List tenant users (GET /v1/users). Used to populate the @mention people
 * directory. Any authenticated user may call this; non-admins get a minimal
 * public projection.
 */
export async function listUsers(): Promise<DirectoryUser[]> {
  const res = await apiFetch<{ success: boolean; users: DirectoryUser[] }>('/users');
  return res.users ?? [];
}

/** Fetch the signed-in user's own record (GET /v1/users/me). */
export async function getMe(): Promise<User> {
  const res = await apiFetch<{ success: boolean; user: User } | User>('/users/me');
  return (res as any).user ?? (res as User);
}
