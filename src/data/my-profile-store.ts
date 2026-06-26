import * as React from 'react';

import type { ProjectItem, UserProfile } from '@/api/types';

import { CURRENT_USER_ID } from './mock';

/**
 * Reactive mock store for the *current user's* editable profile.
 *
 * The profile screen reads from here when you view your own account, and the
 * edit screen writes to it on save — so changes show up immediately without a
 * backend. Swap this for `profileApi.getUserProfile` / `updateMyProfile` once
 * the frontend is wired to the API.
 */
let state: UserProfile = {
  profile: {
    id: CURRENT_USER_ID,
    username: 'you',
    display_name: 'You',
    avatar_url: null,
    job_title: null,
    bio: null,
    current_projects: [],
    created_at: new Date().toISOString(),
  },
  // Teams come from the org (admin-managed), so they're shown but not edited here.
  teams: [{ id: 'team_eng', name: 'Engineering', parent_team_id: null }],
  bots: [],
  vaults: [],
};

const listeners = new Set<() => void>();

/** Fields a user can edit about themselves (mirrors PATCH /v1/users/me).
 *  Username is intentionally omitted — it's immutable after account creation. */
export interface MyProfileEdits {
  display_name?: string | null;
  avatar_url?: string | null;
  job_title?: string | null;
  bio?: string | null;
  current_projects?: ProjectItem[];
}

export function getMyProfileSnapshot(): UserProfile {
  return state;
}

export function subscribeMyProfile(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Apply edits to the profile fields and notify subscribers. */
export function saveMyProfile(edits: MyProfileEdits): void {
  state = { ...state, profile: { ...state.profile, ...edits } };
  listeners.forEach((l) => l());
}

/** Subscribe a component to the current user's profile. */
export function useMyProfile(): UserProfile {
  return React.useSyncExternalStore(
    subscribeMyProfile,
    getMyProfileSnapshot,
    getMyProfileSnapshot,
  );
}
