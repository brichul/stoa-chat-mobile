import { apiFetch } from './client';
import type { UserProfile } from './types';

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
