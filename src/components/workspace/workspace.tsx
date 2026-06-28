import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ANIM_SLOW } from '@/constants/animation';

import * as chatsApi from '@/api/chats';
import type { Chat } from '@/api/types';
import { ChatScreen } from '@/components/chat/chat-screen';
import { GraphScreen } from '@/components/graph/graph-screen';
import { Sidebar } from '@/components/sidebar/sidebar';
import { useChats } from '@/contexts/chats-context';
import { WorkspaceProvider, type WorkspaceContextValue } from '@/contexts/workspace-context';

/**
 * Composes the surfaces:
 *  - Sidebar: a full-width left drawer (drawerType "back") layered *underneath*
 *    the chat, opened by swiping right or the top-left menu button.
 *  - Chat: the primary messaging surface, fixed at full height.
 *  - Graph: an overlay that *wipes* in left-to-right over the chat without the
 *    chat translating (an expanding clip reveals fixed content).
 */
export function Workspace() {
  const { width } = useWindowDimensions();
  const { chats, upsertChat } = useChats();

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);
  const [activeChat, setActiveChatState] = React.useState<Chat | null>(null);

  // Default to the most recent chat once chats load, until the user picks one.
  const userPickedRef = React.useRef(false);
  React.useEffect(() => {
    if (!userPickedRef.current && !activeChat && chats.length) {
      setActiveChatState(chats[0]);
    }
  }, [chats, activeChat]);

  const setActiveChat = React.useCallback((chat: Chat | null) => {
    userPickedRef.current = true;
    setActiveChatState(chat);
  }, []);

  // Create a conversation on the backend, then open it. The POST response is a
  // partial chat (no participants), so re-fetch the full document before making
  // it active — the chat header/list read `chat.participants` directly.
  const creatingRef = React.useRef(false);
  const newChat = React.useCallback(async () => {
    setSidebarOpen(false);
    if (creatingRef.current) return;
    creatingRef.current = true;
    try {
      const created = await chatsApi.createChat();
      const full = await chatsApi.getChat(created.id);
      upsertChat(full);
      userPickedRef.current = true;
      setActiveChatState(full);
    } catch {
      // Surfacing failures here can come with a retry affordance later; for now
      // leaving the user on their current view is preferable to a hard crash.
    } finally {
      creatingRef.current = false;
    }
  }, [upsertChat]);

  const graphProgress = useSharedValue(0);

  const openGraph = React.useCallback(() => {
    setIsGraphOpen(true);
    graphProgress.value = withTiming(1, ANIM_SLOW);
  }, [graphProgress]);

  const closeGraph = React.useCallback(() => {
    graphProgress.value = withTiming(0, ANIM_SLOW, (finished) => {
      if (finished) runOnJS(setIsGraphOpen)(false);
    });
  }, [graphProgress]);

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      activeChat,
      activeChatId: activeChat?.id ?? null,
      setActiveChat,
      isGraphOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      openGraph,
      closeGraph,
      newChat,
      uploadData: () => setSidebarOpen(false),
    }),
    [activeChat, setActiveChat, isGraphOpen, openGraph, closeGraph, newChat]
  );

  const graphClipStyle = useAnimatedStyle(() => ({ width: graphProgress.value * width }));

  return (
    <WorkspaceProvider value={value}>
      <Drawer
        open={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        drawerType="back"
        drawerPosition="left"
        swipeEnabled={!isGraphOpen}
        drawerStyle={{ width }}
        renderDrawerContent={() => <Sidebar />}>
        <View className="flex-1">
          <ChatScreen />

          <Animated.View
            pointerEvents={isGraphOpen ? 'auto' : 'none'}
            style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' }, graphClipStyle]}>
            <View style={{ width, flex: 1 }}>
              <GraphScreen onClose={closeGraph} />
            </View>
          </Animated.View>
        </View>
      </Drawer>
    </WorkspaceProvider>
  );
}
