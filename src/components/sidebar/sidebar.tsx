import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ANIM_FAST } from '@/constants/animation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomIcon, type CustomIconName, Logo } from '@/components/icons/custom-icon';
import { Icon } from '@/components/icons/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
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

function ProfileMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Keep modal mounted during exit animation.
  const [showing, setShowing] = React.useState(false);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      setShowing(true);
      opacity.value = withTiming(1, ANIM_FAST);
    } else if (showing) {
      // eslint-disable-next-line deprecation/deprecation
      opacity.value = withTiming(0, ANIM_FAST, (done) => {
        if (done) runOnJS(setShowing)(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Modal visible={showing} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }, fadeStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl overflow-hidden"
          onStartShouldSetResponder={() => true}>
          <View style={{ backgroundColor: '#1C1B1A' }}>
            {/* Profile row */}
            <View className="flex-row items-center gap-3 px-5 py-4 border-b border-white/10">
              <UserAvatar size={40} />
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: FG }}>
                  {user?.display_name || user?.username || user?.email?.split('@')[0] || 'You'}
                </Text>
                {user?.email ? (
                  <Text className="text-sm" style={{ color: MUTED }}>
                    {user.email}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Actions */}
            <Pressable
              onPress={onClose}
              className="flex-row items-center gap-3 px-5 py-4 active:bg-white/10">
              <Icon name="person" size={20} color={FG} />
              <Text className="text-base" style={{ color: FG }}>
                View profile
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="flex-row items-center gap-3 px-5 py-4 active:bg-white/10">
              <Icon name="settings" size={20} color={FG} />
              <Text className="text-base" style={{ color: FG }}>
                Settings
              </Text>
            </Pressable>
            <View className="h-px mx-4 bg-white/10" />
            <Pressable
              onPress={() => { onClose(); logout(); }}
              className="flex-row items-center gap-3 px-5 py-4 active:bg-white/10">
              <Icon name="logout" size={20} color="#E57373" />
              <Text className="text-base" style={{ color: '#E57373' }}>
                Sign out
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

function UserAvatar({ size = 32 }: { size?: number }) {
  const { user } = useAuth();
  const initial = (
    user?.display_name || user?.username || user?.email || 'U'
  ).charAt(0).toUpperCase();

  return (
    <Avatar
      alt={initial}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      {user?.avatar_url ? (
        <AvatarImage source={{ uri: user.avatar_url }} />
      ) : null}
      <AvatarFallback style={{ backgroundColor: '#98514B' }}>
        <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '600' }}>{initial}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

export function Sidebar() {
  const insets = useSafeAreaInsets();
  const { closeSidebar, setActiveChat, openGraph, newChat, uploadData } = useWorkspace();
  const [query, setQuery] = React.useState('');
  const [profileOpen, setProfileOpen] = React.useState(false);

  const actions: ActionButton[] = [
    { key: 'upload', label: 'Upload data', icon: 'data-unorganized', onPress: uploadData },
    { key: 'graph', label: 'View graph', icon: 'data-organized', onPress: openGraph },
    { key: 'new', label: 'New chat', icon: 'stoa-agent', onPress: newChat },
  ];

  const recentChats = MOCK_CHATS.filter((c) =>
    (c.name ?? '').toLowerCase().includes(query.trim().toLowerCase())
  );

  const openChat = (id: string) => {
    const chat = MOCK_CHATS.find((c) => c.id === id);
    if (chat) setActiveChat(chat);
    closeSidebar();
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top - 8, backgroundColor: Palette.black }}>
      <View className="h-16 flex-row items-center justify-between px-3 py-3">
        <Pressable onPress={closeSidebar} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="close" size={24} color={FG} />
        </Pressable>
        <View className="h-10 w-10 items-center justify-center">
          <Logo size={28} color={FG} />
        </View>
        {/* Profile photo — opens profile menu */}
        <Pressable
          onPress={() => setProfileOpen(true)}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center">
          <UserAvatar size={32} />
        </Pressable>
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

      <ProfileMenu visible={profileOpen} onClose={() => setProfileOpen(false)} />
    </View>
  );
}
