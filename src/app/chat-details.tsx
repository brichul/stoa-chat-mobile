import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Participant } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { MOCK_CHATS } from '@/data/mock';

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
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chat = MOCK_CHATS.find((c) => c.id === chatId) ?? MOCK_CHATS[0];

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
            {chat.name ?? 'Untitled chat'}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {chat.chat_type === 'session' ? 'Agent session' : 'Conversation'}
          </Text>
        </View>

        <Row icon="info" label="Status" value={chat.status} />
        <Row icon="group" label="Participants" value={String(chat.participants.length)} />
        <Row icon="data-object" label="Attached nodes" value={String(chat.attached_nodes?.length ?? 0)} />
        <Row icon="data-array" label="Attached vaults" value={String(chat.attached_vaults?.length ?? 0)} />

        <Text className="text-muted-foreground px-4 pb-1 pt-5 text-xs font-semibold uppercase">
          Participants
        </Text>
        {chat.participants.map((p) => {
          const isUser = p.type === 'user';
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
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {p.type === 'bot' ? 'agent' : p.type} · {p.permission}
                </Text>
              </View>
              {isUser ? <Icon name="chevron-right" size={20} /> : null}
            </Pressable>
          );
        })}

        <View className="gap-2 px-4 pt-6">
          <Pressable className="active:bg-secondary flex-row items-center gap-3 rounded-xl px-3 py-3">
            <Icon name="push-pin" size={20} />
            <Text className="text-foreground text-base">Pin chat</Text>
          </Pressable>
          <Pressable className="active:bg-secondary flex-row items-center gap-3 rounded-xl px-3 py-3">
            <Icon name="archive" size={20} />
            <Text className="text-foreground text-base">Archive chat</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
