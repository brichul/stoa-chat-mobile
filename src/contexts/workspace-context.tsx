import * as React from 'react';

import type { Chat } from '@/api/types';

/**
 * Coordinates the surfaces that share the main screen:
 *  - the sidebar drawer (swipe right / toggle button)
 *  - the chat surface
 *  - the graph overlay (wipes in over the chat)
 * The Workspace component supplies the implementation.
 */
export interface WorkspaceContextValue {
  activeChat: Chat | null;
  /** Convenience derived field — same as activeChat?.id ?? null. */
  activeChatId: string | null;
  setActiveChat: (chat: Chat | null) => void;

  isGraphOpen: boolean;

  openSidebar: () => void;
  closeSidebar: () => void;

  openGraph: () => void;
  closeGraph: () => void;

  newChat: () => void;
  uploadData: () => void;
}

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

export function useWorkspace(): WorkspaceContextValue {
  const ctx = React.useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within a Workspace');
  return ctx;
}
