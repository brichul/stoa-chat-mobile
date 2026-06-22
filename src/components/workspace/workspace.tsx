import * as React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ChatScreen } from '@/components/chat/chat-screen';
import { GraphScreen } from '@/components/graph/graph-screen';
import { Sidebar } from '@/components/sidebar/sidebar';
import { WorkspaceProvider, type WorkspaceContextValue } from '@/contexts/workspace-context';
import { MOCK_CHATS } from '@/data/mock';

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

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(MOCK_CHATS[0]?.id ?? null);

  const graphProgress = useSharedValue(0);

  const openGraph = React.useCallback(() => {
    setIsGraphOpen(true);
    graphProgress.value = withTiming(1, { duration: 420 });
  }, [graphProgress]);

  const closeGraph = React.useCallback(() => {
    graphProgress.value = withTiming(0, { duration: 360 }, (finished) => {
      if (finished) runOnJS(setIsGraphOpen)(false);
    });
  }, [graphProgress]);

  const value = React.useMemo<WorkspaceContextValue>(
    () => ({
      activeChatId,
      setActiveChatId,
      isGraphOpen,
      openSidebar: () => setSidebarOpen(true),
      closeSidebar: () => setSidebarOpen(false),
      openGraph,
      closeGraph,
      // Scaffold stubs — wire to chatsApi.createChat / ingestApi later.
      newChat: () => setSidebarOpen(false),
      uploadData: () => setSidebarOpen(false),
    }),
    [activeChatId, isGraphOpen, openGraph, closeGraph]
  );

  // Left-anchored clip that grows 0 -> full width (the wipe).
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

          {/* Graph wipe overlay (content stays fixed; the clip reveals it). */}
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
