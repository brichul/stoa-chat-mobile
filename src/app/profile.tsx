import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { PublicBot, PublicProfile, PublicVault } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { CustomIcon } from '@/components/icons/custom-icon';
import { avatarColor } from '@/components/chat/participant-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { getMockProfile } from '@/data/mock';

function profileLabel(p: PublicProfile): string {
  return p.display_name || p.username || p.id;
}

function ProfileAvatar({ profile, size }: { profile: PublicProfile; size: number }) {
  const initial = profileLabel(profile).charAt(0).toUpperCase();
  const bg = avatarColor(profile.id);
  return (
    <Avatar alt={initial} style={{ width: size, height: size, borderRadius: size / 2 }}>
      {profile.avatar_url ? <AvatarImage source={{ uri: profile.avatar_url }} /> : null}
      <AvatarFallback style={{ backgroundColor: bg }}>
        <Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: '600' }}>{initial}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <Text className="text-muted-foreground px-4 pb-1 pt-6 text-xs font-semibold uppercase">
      {label} · {count}
    </Text>
  );
}

function AgentRow({ agent }: { agent: PublicBot }) {
  const name = agent.display_name || agent.name || agent.id;
  const status = agent.availability_status ?? 'available';
  const dot = status === 'available' ? '#5B8C6B' : status === 'busy' ? '#A67B5B' : '#888';
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="bg-primary/15 h-10 w-10 items-center justify-center rounded-xl">
        <CustomIcon name="stoa-agent" size={20} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-foreground text-base" numberOfLines={1}>
            {name}
          </Text>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
        </View>
        {agent.description ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {agent.description}
          </Text>
        ) : null}
      </View>
      {typeof agent.reputation_score === 'number' ? (
        <Text className="text-muted-foreground text-xs">{agent.reputation_score} rep</Text>
      ) : null}
    </View>
  );
}

function VaultRow({ vault }: { vault: PublicVault }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="bg-secondary h-10 w-10 items-center justify-center rounded-xl">
        <Icon name="data-array" size={20} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-base" numberOfLines={1}>
          {vault.name ?? 'Untitled vault'}
        </Text>
        {vault.description ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {vault.description}
          </Text>
        ) : null}
      </View>
      <Text className="text-muted-foreground text-xs">{vault.node_count ?? 0} nodes</Text>
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  // Mock data for now — see src/api/profile.ts for the live backend contract.
  const { profile, bots, vaults } = getMockProfile(userId ?? 'user_me');

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <Text className="text-foreground text-base font-semibold">Profile</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="close" size={24} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="pb-10">
        {/* Header: avatar, name, username */}
        <View className="items-center gap-2 px-6 py-6">
          <ProfileAvatar profile={profile} size={88} />
          <Text className="text-foreground text-center text-2xl font-semibold">
            {profileLabel(profile)}
          </Text>
          {profile.username ? (
            <Text className="text-muted-foreground text-sm">@{profile.username}</Text>
          ) : null}
        </View>

        {/* Owned agents */}
        <SectionHeader label="Agents" count={bots.length} />
        {bots.length === 0 ? (
          <Text className="text-muted-foreground px-4 py-3 text-sm">No public agents.</Text>
        ) : (
          bots.map((b) => <AgentRow key={b.id} agent={b} />)
        )}

        {/* Owned (public) vaults */}
        <SectionHeader label="Vaults" count={vaults.length} />
        {vaults.length === 0 ? (
          <Text className="text-muted-foreground px-4 py-3 text-sm">No public vaults.</Text>
        ) : (
          vaults.map((v) => <VaultRow key={v.id} vault={v} />)
        )}
      </ScrollView>
    </View>
  );
}
