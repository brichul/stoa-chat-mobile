import * as Clipboard from 'expo-clipboard';
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

export interface TextAttachmentDrawerProps {
  visible: boolean;
  text: string;
  onClose: () => void;
}

/** Bottom sheet that shows the full body of a pasted-text attachment, scrollable. */
export function TextAttachmentDrawer({ visible, text, onClose }: TextAttachmentDrawerProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // Keep mounted through the exit animation.
  const [showing, setShowing] = React.useState(false);
  const translateY = useSharedValue(800);

  React.useEffect(() => {
    if (visible) {
      setShowing(true);
      translateY.value = 800;
      translateY.value = withTiming(0, ANIM_SLOW);
    } else if (showing) {
      // eslint-disable-next-line deprecation/deprecation
      translateY.value = withTiming(800, ANIM_SLOW, (done) => {
        if (done) runOnJS(setShowing)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

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
            maxHeight: '80%',
          },
          sheetStyle,
        ]}>
        {/* Handle */}
        <View className="items-center py-2">
          <View className="bg-secondary h-1 w-10 rounded-full" />
        </View>

        <View className="flex-row items-center justify-between px-4 pb-2">
          <Text style={{ color: theme.text }} className="text-base font-semibold">
            Text
          </Text>
          <Pressable
            onPress={() => Clipboard.setStringAsync(text)}
            hitSlop={8}
            className="flex-row items-center gap-1.5 active:opacity-60">
            <Icon name="content-copy" size={16} color={theme.textSecondary} />
            <Text className="text-muted-foreground text-sm">Copy</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator>
          <Text style={{ color: theme.text }} className="text-base leading-6">
            {text}
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
