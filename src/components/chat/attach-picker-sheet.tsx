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

import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { ANIM_SLOW } from '@/constants/animation';
import { Colors } from '@/constants/theme';
import { MOCK_NODES, MOCK_VAULTS } from '@/data/mock';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AttachPickerMode = 'node' | 'vault' | null;

export interface PickedRef {
  id: string;
  name: string;
  kind: 'node' | 'vault';
  /** Secondary label — node status or vault type. */
  subtitle?: string;
}

export interface AttachPickerSheetProps {
  /** Which list to show; `null` keeps the sheet closed. */
  mode: AttachPickerMode;
  onClose: () => void;
  onSelect: (ref: PickedRef) => void;
}

/**
 * Bottom sheet for attaching a node or vault to a chat. Backed by mock data
 * for now (src/data/mock.ts) — there is no backend picker endpoint yet.
 */
export function AttachPickerSheet({ mode, onClose, onSelect }: AttachPickerSheetProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // Keep mounted through the exit animation.
  const [showing, setShowing] = React.useState(false);
  const translateY = useSharedValue(600);

  const visible = mode !== null;

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

  const isNode = mode === 'node';
  const items = isNode
    ? MOCK_NODES.map((n) => ({ id: n.id, name: n.title ?? n.id, subtitle: n.status }))
    : MOCK_VAULTS.map((v) => ({ id: v.id, name: v.name ?? v.id, subtitle: v.type }));

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

        <Text style={{ color: theme.text }} className="px-4 pb-2 text-base font-semibold">
          {isNode ? 'Attach a node' : 'Attach a vault'}
        </Text>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {items.length === 0 && (
            <Text className="text-muted-foreground px-4 py-6 text-center text-sm">
              Nothing to attach.
            </Text>
          )}
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                onSelect({
                  id: item.id,
                  name: item.name,
                  kind: isNode ? 'node' : 'vault',
                  subtitle: item.subtitle ?? undefined,
                });
                onClose();
              }}
              className="active:bg-secondary flex-row items-center gap-3 px-4 py-3">
              <View className="bg-secondary h-9 w-9 items-center justify-center rounded-xl">
                <Icon name={isNode ? 'data-object' : 'data-array'} size={18} />
              </View>
              <View className="flex-1">
                <Text style={{ color: theme.text }} className="text-base" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.subtitle ? (
                  <Text className="text-muted-foreground text-xs">{item.subtitle}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
