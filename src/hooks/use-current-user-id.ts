import { useAuth } from '@/contexts/auth-context';

/** The signed-in user's id. Empty string when unauthenticated (callers render
 *  behind the auth gate, so this is effectively always populated). */
export function useCurrentUserId(): string {
  const { user } = useAuth();
  return user?.id ?? '';
}
