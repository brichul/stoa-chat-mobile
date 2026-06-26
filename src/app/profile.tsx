import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ProjectItem, PublicBot, PublicProfile, PublicTeam, PublicVault } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { CustomIcon } from '@/components/icons/custom-icon';
import { avatarColor } from '@/components/chat/participant-avatar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { CURRENT_USER_ID, getMockProfile } from '@/data/mock';
import { useMyProfile } from '@/data/my-profile-store';

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

function ProjectRow({ project }: { project: ProjectItem }) {
  return (
    <View className="flex-row gap-3 px-4 py-3">
      <View className="bg-secondary mt-0.5 h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="work-outline" size={16} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-base font-medium">{project.title}</Text>
        {project.description ? (
          <Text className="text-muted-foreground text-sm">{project.description}</Text>
        ) : null}
      </View>
    </View>
  );
}

function TeamChips({ teams }: { teams: PublicTeam[] }) {
  if (teams.length === 0) return null;
  return (
    <View className="flex-row flex-wrap justify-center gap-2 px-6 pt-1">
      {teams.map((t) => (
        <View key={t.id} className="bg-secondary flex-row items-center gap-1.5 rounded-full px-3 py-1">
          <Icon name="group" size={13} />
          <Text className="text-foreground text-xs">{t.name ?? t.id}</Text>
        </View>
      ))}
    </View>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const isOwn = !userId || userId === CURRENT_USER_ID;

  // Own profile reads from the editable store (reflects edits); others use mocks.
  // See src/api/profile.ts for the live backend contract.
  const myProfile = useMyProfile();
  const { profile, teams, bots, vaults } = isOwn ? myProfile : getMockProfile(userId);
  const projects = profile.current_projects ?? [];

  return (
    <View className="bg-background flex-1" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="close" size={24} />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">Profile</Text>
        {isOwn ? (
          <Pressable onPress={() => router.push('/profile-edit')} hitSlop={8} className="h-10 px-2 justify-center">
            <Text className="text-primary text-base font-semibold">Edit</Text>
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
      </View>

      <ScrollView contentContainerClassName="pb-10">
        {/* Header: avatar, name, username, job title */}
        <View className="items-center gap-1.5 px-6 pb-2 pt-6">
          <ProfileAvatar profile={profile} size={88} />
          <Text className="text-foreground mt-1 text-center text-2xl font-semibold">
            {profileLabel(profile)}
          </Text>
          {profile.job_title ? (
            <Text className="text-foreground text-center text-sm font-medium">{profile.job_title}</Text>
          ) : null}
          {profile.username ? (
            <Text className="text-muted-foreground text-sm">@{profile.username}</Text>
          ) : null}
        </View>
        <TeamChips teams={teams} />

        {/* Bio */}
        {profile.bio ? (
          <Text className="text-foreground px-6 pt-5 text-sm leading-5">{profile.bio}</Text>
        ) : null}

        {/* Current projects */}
        {projects.length > 0 ? (
          <>
            <SectionHeader label="Current projects" count={projects.length} />
            {projects.map((p, i) => (
              <ProjectRow key={`${p.title}-${i}`} project={p} />
            ))}
          </>
        ) : null}

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
