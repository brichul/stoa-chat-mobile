import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, {
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Participant } from '@/api/types';
import { Text } from '@/components/ui/text';
import { ANIM_SLOW } from '@/constants/animation';
import { Colors } from '@/constants/theme';

import { ParticipantAvatar, participantLabel } from './participant-avatar';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReactionsSheetProps {
  visible: boolean;
  /** Emoji → list of actor ids who reacted. */
  reactions: Record<string, string[]> | null;
  participants: Participant[];
  currentActorId: string;
  onClose: () => void;
}

/**
 * Bottom sheet breaking down a message's reactions: which actor sent which
 * emoji. Read-only — tapping a reaction pill on a bubble opens this rather
 * than toggling the current user's reaction.
 */
export function ReactionsSheet({
  visible,
  reactions,
  participants,
  currentActorId,
  onClose,
}: ReactionsSheetProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // Keep mounted through the exit animation.
  const [showing, setShowing] = React.useState(false);
  const translateY = useSharedValue(600);

  React.useEffect(() => {
    if (visible) {
      setShowing(true);
      translateY.value = 600;
      translateY.value = withTiming(0, ANIM_SLOW);
    } else if (showing) {
      // eslint-disable-next-line deprecation/deprecation
      translateY.value = withTiming(600, ANIM_SLOW, (done) => {
        if (done) runOnJS(setShowing)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const participantMap = React.useMemo(
    () => new Map(participants.map((p) => [p.id, p])),
    [participants]
  );

  const entries = React.useMemo(
    () => Object.entries(reactions ?? {}).filter(([, ids]) => ids.length > 0),
    [reactions]
  );

  return (
    <Modal transparent visible={showing} animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '65%',
          },
          sheetStyle,
        ]}>
        {/* Handle */}
        <View className="items-center py-2">
          <View className="bg-secondary h-1 w-10 rounded-full" />
        </View>

        <Text
          style={{ color: theme.text }}
          className="px-4 pb-2 text-base font-semibold">
          Reactions
        </Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {entries.length === 0 && (
            <Text className="text-muted-foreground px-4 py-6 text-center text-sm">
              No reactions yet.
            </Text>
          )}
          {entries.map(([emoji, ids]) => (
            <View key={emoji}>
              <View
                className="flex-row items-center gap-2 px-4 pb-1 pt-3"
                style={{ borderTopWidth: 1, borderTopColor: theme.backgroundElement }}>
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
                <Text className="text-muted-foreground text-xs font-semibold">{ids.length}</Text>
              </View>
              {ids.map((id) => {
                const p = participantMap.get(id);
                const name = id === currentActorId ? 'You' : p ? participantLabel(p) : id;
                return (
                  <View key={`${emoji}_${id}`} className="flex-row items-center gap-3 px-4 py-2">
                    {p ? (
                      <ParticipantAvatar participant={p} size={28} />
                    ) : (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: theme.backgroundElement,
                        }}
                      />
                    )}
                    <Text style={{ color: theme.text }} className="text-sm">
                      {name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
