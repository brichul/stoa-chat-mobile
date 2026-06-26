import * as React from 'react';

import * as authApi from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { clearSession, loadSession, saveSession } from '@/api/storage';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  tenantSlug: string;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

interface AuthContextValue extends AuthState {
  login: (params: authApi.LoginParams, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    tenantSlug: '',
    status: 'loading',
  });
  const refreshTokenRef = React.useRef<string | null>(null);

  const doLogout = React.useCallback(async () => {
    const rt = refreshTokenRef.current;
    refreshTokenRef.current = null;
    setAuthToken(null);
    await clearSession();
    if (rt) authApi.logout(rt).catch(() => {});
    setState({ user: null, tenantSlug: '', status: 'unauthenticated' });
  }, []);

  // Restore a persisted session on boot.
  React.useEffect(() => {
    let active = true;
    (async () => {
      const session = await loadSession();
      if (!active) return;
      if (!session) {
        setState((s) => ({ ...s, status: 'unauthenticated' }));
        return;
      }
      setAuthToken(session.accessToken);
      refreshTokenRef.current = session.refreshToken;
      try {
        const me = await authApi.getMe();
        const user = (me as any).user ?? (me as User);
        if (active) setState({ user, tenantSlug: session.tenantSlug, status: 'authenticated' });
      } catch {
        if (active) await doLogout();
      }
    })();
    return () => {
      active = false;
    };
  }, [doLogout]);

  // Log out on any 401 from the API.
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      doLogout();
    });
    return () => setUnauthorizedHandler(null);
  }, [doLogout]);

  const login = React.useCallback(async (params: authApi.LoginParams, remember = true) => {
    const res = await authApi.login(params);
    // The backend resolves the tenant from the email and returns it.
    const tenantSlug = res.tenant_slug || '';
    setAuthToken(res.access_token);
    refreshTokenRef.current = res.refresh_token;
    // "Remember me": only persist the session to disk when requested, so it
    // survives an app restart. Otherwise it lives only for this app session.
    if (remember) {
      await saveSession({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        tenantSlug,
      });
    } else {
      await clearSession();
    }
    setState({ user: res.user, tenantSlug, status: 'authenticated' });
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, login, logout: doLogout }),
    [state, login, doLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
