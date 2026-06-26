import { apiFetch } from './client';
import type { ProjectItem, User, UserProfile } from './types';

/**
 * Fetch a user's public profile: avatar, name, username, job title, bio, current
 * projects, the teams they're on, the bots they own, and the public vaults those
 * bots have created.
 *
 * NOTE: The profile screen currently renders mock data and does not call this.
 * It mirrors the backend contract (GET /v1/users/:id/profile) so the screen
 * can be wired to live data later by swapping the mock lookup for this call.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const res = await apiFetch<{ success: boolean } & UserProfile>(`/users/${userId}/profile`);
  return {
    profile: res.profile,
    teams: res.teams ?? [],
    bots: res.bots ?? [],
    vaults: res.vaults ?? [],
  };
}

/** Editable fields for the current user (mirrors PATCH /v1/users/me).
 *  Username is immutable after account creation, so it isn't included here. */
export interface ProfileEdits {
  display_name?: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  bio?: string | null;
  current_projects?: ProjectItem[];
}

/**
 * Update the signed-in user's own profile.
 *
 * NOTE: The edit screen currently writes to a mock store and does not call this.
 * It mirrors the backend contract so it can be wired to live data later.
 */
export async function updateMyProfile(edits: ProfileEdits): Promise<User> {
  const res = await apiFetch<{ success: boolean; user: User }>('/users/me', {
    method: 'PATCH',
    json: edits,
  });
  return res.user;
}
