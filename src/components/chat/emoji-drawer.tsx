import * as React from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';
import Animated, {
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { ANIM_SLOW } from '@/constants/animation';
import { Colors } from '@/constants/theme';

// ─── Emoji data ───────────────────────────────────────────────────────────────
//
// Add your emoji entries here. Each category has a label and a flat list of
// emoji strings. To add more categories or emoji, extend EMOJI_CATEGORIES.
//
// Example entry: { label: 'Smileys', emoji: ['😀', '😃', '😄', ...] }
//

export interface EmojiCategory {
  label: string;
  emoji: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    label: 'Smileys',
    emoji: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
      '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
      '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸',
      '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳',
      '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖',
      '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    ],
  },
  {
    label: 'Gestures',
    emoji: [
      '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘',
      '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
      '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🫶',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    ],
  },
  {
    label: 'Nature',
    emoji: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧',
      '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝',
    ],
  },
  {
    label: 'Food',
    emoji: [
      '🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍈', '🍑', '🍒', '🍍',
      '🥭', '🥥', '🍅', '🍆', '🥑', '🥦', '🌽', '🌶', '🫑', '🥕',
      '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🫓', '🧀', '🍔', '🌮',
      '🍕', '🍣', '🍜', '🍦', '🎂', '🍰', '🧁', '🍩', '☕', '🧋',
    ],
  },
  {
    label: 'Activities',
    emoji: [
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓',
      '🏸', '🥊', '🥋', '⛳', '🏹', '🎣', '🤿', '🎿', '🛷', '🏂',
      '🎮', '🕹', '🎲', '♟', '🎯', '🎳', '🎰', '🧩', '🎭', '🎨',
      '🎵', '🎸', '🎹', '🥁', '🎺', '🎻', '🎤', '🎧', '📷', '🔭',
    ],
  },
  {
    label: 'Objects',
    emoji: [
      '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💰', '💳', '💎', '⚖️',
      '🔧', '🪛', '🔩', '⚙️', '🔗', '⛓', '🧲', '🔑', '🗝', '🔓',
      '🪝', '🧰', '📦', '📮', '📫', '📬', '📭', '📝', '📋', '📌',
      '📎', '✂️', '🗑', '🔒', '🪞', '🛏', '🛋', '🚿', '🛁', '🪥',
    ],
  },
  {
    label: 'Symbols',
    emoji: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯',
      '🔥', '✨', '⭐', '🌟', '💫', '⚡', '🌈', '❄️', '🌊', '💥',
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🎖', '🏅',
      '✅', '❌', '⛔', '🚫', '⚠️', '❗', '❓', '💬', '💭', '🔔',
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface EmojiDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const COLS = 8;

export function EmojiDrawer({ visible, onClose, onSelect }: EmojiDrawerProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [activeCategory, setActiveCategory] = React.useState(0);

  // Internal flag keeps the Modal mounted during the exit animation.
  const [showing, setShowing] = React.useState(false);
  const translateY = useSharedValue(600);

  React.useEffect(() => {
    if (visible) {
      setShowing(true);
      translateY.value = 600; // snap to off-screen before animating in
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

  const category = EMOJI_CATEGORIES[activeCategory];

  return (
    <Modal transparent visible={showing} animationType="none" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        onPress={onClose}
      />
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

        {/* Category tabs */}
        <View
          style={{ borderBottomWidth: 1, borderBottomColor: '#1312110f' }}
          className="flex-row px-2">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <Pressable
              key={cat.label}
              onPress={() => setActiveCategory(i)}
              className="flex-1 items-center py-2"
              style={{
                borderBottomWidth: 2,
                borderBottomColor: activeCategory === i ? '#98514B' : 'transparent',
              }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: activeCategory === i ? '700' : '400',
                  color: activeCategory === i ? '#98514B' : theme.textSecondary,
                }}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Emoji grid */}
        <FlatList
          data={category.emoji}
          keyExtractor={(e, i) => `${e}-${i}`}
          numColumns={COLS}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onSelect(item);
                onClose();
              }}
              style={{ width: `${100 / COLS}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 24 }}>{item}</Text>
            </Pressable>
          )}
        />
      </Animated.View>
    </Modal>
  );
}
