import * as React from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon, type CustomIconName, Logo } from '@/components/icons/custom-icon';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Palette } from '@/constants/theme';
import { useWorkspace } from '@/contexts/workspace-context';
import { MOCK_CHATS } from '@/data/mock';

// Sidebar is always dark (STYLING.md black), independent of the system theme.
const FG = Palette.white;
const MUTED = '#B0B4BA';

interface ActionButton {
  key: string;
  label: string;
  icon: CustomIconName;
  onPress: () => void;
}

/** Row button with a leading custom icon (the three actions above the search). */
function ActionRow({ label, icon, onPress }: Omit<ActionButton, 'key'>) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-xl px-3 py-3 active:bg-white/10">
      <CustomIcon name={icon} size={22} color={FG} />
      <Text className="text-base font-medium" style={{ color: FG }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Text-only row button (a recent chat). Single line, truncated with ellipsis. */
function ChatRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-xl px-3 py-2.5 active:bg-white/10">
      <Text className="text-base" style={{ color: FG }} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const { closeSidebar, setActiveChatId, openGraph, newChat, uploadData } = useWorkspace();
  const [query, setQuery] = React.useState('');

  const actions: ActionButton[] = [
    { key: 'upload', label: 'Upload data', icon: 'data-unorganized', onPress: uploadData },
    { key: 'graph', label: 'View graph', icon: 'data-organized', onPress: openGraph },
    { key: 'new', label: 'New chat', icon: 'stoa-agent', onPress: newChat },
  ];

  const recentChats = MOCK_CHATS.filter((c) =>
    (c.name ?? '').toLowerCase().includes(query.trim().toLowerCase())
  );

  const openChat = (id: string) => {
    setActiveChatId(id);
    closeSidebar();
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Palette.black }}>
      {/* Top bar: X (close) left, logo right. */}
      <View className="h-12 flex-row items-center justify-between px-2">
        <Pressable onPress={closeSidebar} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="close" size={24} color={FG} />
        </Pressable>
        <View className="h-10 w-10 items-center justify-center">
          <Logo size={28} color={FG} />
        </View>
      </View>

      {/* Action buttons (icon + text). */}
      <View className="gap-1 px-2 pt-1">
        {actions.map((a) => (
          <ActionRow key={a.key} label={a.label} icon={a.icon} onPress={a.onPress} />
        ))}
      </View>

      {/* Search bar. */}
      <View className="px-3 pb-1 pt-3">
        <View className="flex-row items-center gap-2 rounded-xl border-hairline border-white/10 bg-white/5 px-3">
          <Icon name="search" size={18} color={MUTED} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={MUTED}
            className="flex-1 py-2.5"
            style={{ color: FG }}
          />
        </View>
      </View>

      <Text className="px-4 pb-1 pt-3 text-xs font-semibold uppercase" style={{ color: MUTED }}>
        Recent chats
      </Text>

      {/* Recent chat buttons (generated from array). */}
      <ScrollView className="flex-1 px-2" contentContainerClassName="pb-6">
        {recentChats.map((c) => (
          <ChatRow key={c.id} title={c.name ?? 'Untitled chat'} onPress={() => openChat(c.id)} />
        ))}
      </ScrollView>
    </View>
  );
}
