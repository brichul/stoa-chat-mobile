import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as chatsApi from '@/api/chats';
import type { Participant } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { useChats } from '@/contexts/chats-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { chatDisplayTitle } from '@/lib/chat-title';
import { useColorScheme } from 'nativewind';

function participantLabel(p: Participant): string {
  return p.display_name || p.name || p.username || p.id;
}

function Row({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string }) {
  return (
    <View className="border-border flex-row items-center gap-3 border-b-hairline px-4 py-3">
      <Icon name={icon} size={20} />
      <Text className="text-muted-foreground flex-1 text-sm">{label}</Text>
      <Text className="text-foreground text-sm">{value}</Text>
    </View>
  );
}

export default function ChatDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { chats } = useChats();
  const currentUserId = useCurrentUserId();
  const chat = chats.find((c) => c.id === chatId) ?? null;

  const [participants, setParticipants] = React.useState<Participant[]>(chat?.participants ?? []);
  React.useEffect(() => {
    setParticipants(chat?.participants ?? []);
  }, [chat]);

  // Owner can't be removed; everyone else (users/bots) can. Removing yourself
  // is "leave", removing someone else is owner-only (enforced server-side).
  const canRemove = (p: Participant) => !!chat && p.id !== chat.owner_id;

  const handleRemove = (p: Participant) => {
    if (!chat) return;
    const isSelf = p.id === currentUserId;
    Alert.alert(
      isSelf ? 'Leave chat?' : `Remove ${participantLabel(p)}?`,
      isSelf
        ? 'You will be removed from this conversation.'
        : `${participantLabel(p)} will be removed from this conversation.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSelf ? 'Leave' : 'Remove',
          style: 'destructive',
          onPress: () => {
            setParticipants((prev) => prev.filter((x) => x.id !== p.id));
            chatsApi.removeParticipant(chat.id, p.id).catch(() => {
              // Re-add on failure.
              setParticipants((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
            });
            if (isSelf) router.back();
          },
        },
      ]
    );
  };

  if (!chat) {
    return (
      <View className="bg-background flex-1 items-center justify-center" style={{ paddingTop: insets.top }}>
        <Text className="text-muted-foreground text-sm">Chat not found.</Text>
      </View>
    );
  }

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <Text className="text-foreground text-base font-semibold">Chat details</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="close" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="pb-10">
        <View className="items-center gap-2 px-6 py-6">
          <View className="bg-secondary h-16 w-16 items-center justify-center rounded-full">
            <Icon name="forum" size={28} />
          </View>
          <Text className="text-foreground text-center text-xl font-semibold">
            {chatDisplayTitle(chat, currentUserId)}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {chat.chat_type === 'session' ? 'Agent session' : 'Conversation'}
          </Text>
        </View>

        <Row icon="info" label="Status" value={chat.status} />
        <Row icon="group" label="Participants" value={String(participants.length)} />
        <Row icon="data-object" label="Attached nodes" value={String(chat.attached_nodes?.length ?? 0)} />
        <Row icon="data-array" label="Attached vaults" value={String(chat.attached_vaults?.length ?? 0)} />

        <Text className="text-muted-foreground px-4 pb-1 pt-5 text-xs font-semibold uppercase">
          Participants
        </Text>
        {participants.map((p) => {
          const isUser = p.type === 'user';
          const removable = canRemove(p);
          return (
            <Pressable
              key={p.id}
              disabled={!isUser}
              onPress={() => router.push({ pathname: '/profile', params: { userId: p.id } })}
              className="active:bg-secondary flex-row items-center gap-3 px-4 py-3">
              <View className="bg-primary/15 h-9 w-9 items-center justify-center rounded-full">
                <Text className="text-foreground text-sm font-semibold">
                  {participantLabel(p).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-base" numberOfLines={1}>
                  {participantLabel(p)}
                  {p.id === currentUserId ? ' (you)' : ''}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {p.type === 'bot' ? 'agent' : p.type} · {p.permission}
                </Text>
              </View>
              {removable ? (
                <Pressable
                  onPress={() => handleRemove(p)}
                  hitSlop={10}
                  className="h-9 w-9 items-center justify-center">
                  <Icon
                    name={p.id === currentUserId ? 'exit-to-app' : 'person-remove'}
                    size={20}
                    color="#E57373"
                  />
                </Pressable>
              ) : isUser ? (
                <Icon name="chevron-right" size={20} color={theme.textSecondary} />
              ) : null}
            </Pressable>
          );
        })}

        <View className="gap-2 px-4 pt-6">
          <Pressable
            onPress={() => chatsApi.pinChat(chat.id).catch(() => {})}
            className="active:bg-secondary flex-row items-center gap-3 rounded-xl px-3 py-3">
            <Icon name="push-pin" size={20} />
            <Text className="text-foreground text-base">Pin chat</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              Alert.alert('Archive chat?', 'This conversation will be archived.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Archive',
                  style: 'destructive',
                  onPress: () => {
                    chatsApi.archiveChat(chat.id).catch(() => {});
                    router.back();
                  },
                },
              ])
            }
            className="active:bg-secondary flex-row items-center gap-3 rounded-xl px-3 py-3">
            <Icon name="archive" size={20} />
            <Text className="text-foreground text-base">Archive chat</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
