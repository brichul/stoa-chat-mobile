import { View } from 'react-native';

import type { Participant } from '@/api/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { authImageSource } from '@/lib/auth-image';

const PALETTE = ['#98514B', '#5B7FA6', '#5B8C6B', '#7B6B9A', '#A67B5B', '#4E7A7A'];

export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function participantLabel(p: Participant): string {
  return p.display_name || p.name || p.username || p.id;
}

export function ParticipantAvatar({
  participant,
  size,
  style,
}: {
  participant: Participant;
  size: number;
  style?: object;
}) {
  const initial = participantLabel(participant).charAt(0).toUpperCase();
  const bg = avatarColor(participant.id);

  // When there's no avatar URL we render the colored initial directly rather
  // than relying on the primitive's image-load status to reveal the fallback —
  // that status can settle on a non-error state and leave nothing painted.
  if (!participant.avatar_url) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          },
          style,
        ]}>
        <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '600' }}>{initial}</Text>
      </View>
    );
  }

  return (
    <Avatar
      alt={initial}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}>
      <AvatarImage source={authImageSource(participant.avatar_url)} />
      <AvatarFallback style={{ backgroundColor: bg }}>
        <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '600' }}>{initial}</Text>
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * iMessage-style cluster: 1 participant → single avatar, 2+ → diagonal pair
 * with an overflow count badge.
 */
export function ParticipantCluster({
  participants,
  size = 34,
}: {
  participants: Participant[];
  size?: number;
}) {
  const SMALL = Math.round(size * 0.65);

  if (participants.length === 0) return null;
  if (participants.length === 1) {
    return <ParticipantAvatar participant={participants[0]} size={size} />;
  }

  return (
    <View style={{ width: size, height: size }}>
      <ParticipantAvatar
        participant={participants[0]}
        size={SMALL}
        style={{ position: 'absolute', top: 0, right: 0 }}
      />
      <ParticipantAvatar
        participant={participants[1]}
        size={SMALL}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
      />
      {participants.length > 2 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 14,
            height: 14,
            borderRadius: 7,
            backgroundColor: '#444',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>
            +{participants.length - 2}
          </Text>
        </View>
      )}
    </View>
  );
}
