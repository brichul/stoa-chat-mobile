import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Chat } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';

import { ParticipantCluster } from './participant-avatar';

export interface ChatHeaderProps {
  chat: Chat;
  onPressMenu: () => void;
  onPressTitle?: () => void;
}

export function ChatHeader({ chat, onPressMenu, onPressTitle }: ChatHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const attachedCount =
    (chat.attached_nodes?.length ?? 0) + (chat.attached_vaults?.length ?? 0);

  // Others' write-access participants (exclude self) for the cluster
  const others = chat.participants.filter(
    (p) => p.permission === 'write' && p.id !== user?.id
  );

  return (
    <View
      className="border-border bg-background border-solid border-b border-[#131211]"
      style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-3 py-3 pt-0">
        {/* Sidebar toggle */}
        <Pressable onPress={onPressMenu} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="menu" size={24} />
        </Pressable>

        {/* iMessage-style participant cluster */}
        <ParticipantCluster participants={others.length ? others : chat.participants} size={34} />

        {/* Title + subtitle */}
        <Pressable onPress={onPressTitle} className="flex-1 justify-center" hitSlop={4}>
          <Text
            className="text-foreground text-xl"
            style={{ maxWidth: 200 }}
            numberOfLines={1}>
            {chat.name ?? 'Untitled chat'}
          </Text>
          <Text
            className="text-muted-foreground text-xs"
            style={{ fontFamily: 'Fragment_Mono', textTransform: 'uppercase', letterSpacing: -0.4 }}>
            {chat.participants.length} participant{chat.participants.length !== 1 ? 's' : ''}
            {attachedCount > 0 ? ` · ${attachedCount} attached` : ''}
          </Text>
        </Pressable>

        {/* Add node / vault */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable
              hitSlop={8}
              className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary">
              <Icon name="add" size={22} />
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Add to chat</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={() => {}}>
              <Icon name="hub" size={16} />
              <DropdownMenuItemTitle>Add node</DropdownMenuItemTitle>
            </DropdownMenuItem>
            <DropdownMenuItem onPress={() => {}}>
              <Icon name="folder" size={16} />
              <DropdownMenuItemTitle>Add vault</DropdownMenuItemTitle>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>
    </View>
  );
}
