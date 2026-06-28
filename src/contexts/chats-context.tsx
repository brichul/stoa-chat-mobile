import * as React from 'react';

import * as chatsApi from '@/api/chats';
import type { Chat } from '@/api/types';

import { useAuth } from './auth-context';

interface ChatsContextValue {
  chats: Chat[];
  pinned: Chat[];
  loading: boolean;
  error: string | null;
  /** Re-fetch the chat list + pinned chats from the backend. */
  refresh: () => Promise<void>;
  /** Insert or replace a chat in the local list (e.g. after create/update). */
  upsertChat: (chat: Chat) => void;
}

const ChatsContext = React.createContext<ChatsContextValue | null>(null);

export function ChatsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [pinned, setPinned] = React.useState<Chat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setError(null);
    try {
      const [list, pins] = await Promise.all([chatsApi.listChats(), chatsApi.getPinnedChats()]);
      setChats(list);
      setPinned(pins);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chats.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once authenticated; clear when logged out.
  React.useEffect(() => {
    if (status === 'authenticated') {
      setLoading(true);
      void refresh();
    } else if (status === 'unauthenticated') {
      setChats([]);
      setPinned([]);
      setLoading(false);
    }
  }, [status, refresh]);

  const upsertChat = React.useCallback((chat: Chat) => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === chat.id);
      if (idx === -1) return [chat, ...prev];
      const next = [...prev];
      next[idx] = chat;
      return next;
    });
  }, []);

  const value = React.useMemo<ChatsContextValue>(
    () => ({ chats, pinned, loading, error, refresh, upsertChat }),
    [chats, pinned, loading, error, refresh, upsertChat]
  );

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChats(): ChatsContextValue {
  const ctx = React.useContext(ChatsContext);
  if (!ctx) throw new Error('useChats must be used within a ChatsProvider');
  return ctx;
}
