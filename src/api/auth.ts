import { apiFetch } from './client';
import type { LoginResponse, User } from './types';

export interface LoginParams {
  email?: string;
  username?: string;
  password: string;
  tenant_slug: string;
}

export function login(params: LoginParams): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', { method: 'POST', json: params, anonymous: true });
}

export function refresh(refreshToken: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/refresh', {
    method: 'POST',
    json: { refresh_token: refreshToken },
    anonymous: true,
  });
}

export function logout(refreshToken: string): Promise<{ success: boolean }> {
  return apiFetch('/auth/logout', { method: 'POST', json: { refresh_token: refreshToken } });
}

export function getMe(): Promise<{ success: boolean; user: User } | User> {
  return apiFetch('/users/me');
}
