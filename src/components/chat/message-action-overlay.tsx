import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { Message } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { ANIM_FAST } from '@/constants/animation';
import { Colors } from '@/constants/theme';

import { BubbleContent } from './message-bubble';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MessageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MessageActionOverlayProps {
  message: Message;
  layout: MessageLayout;
  isMine: boolean;
  currentActorId: string;
  onDismiss: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onPin: () => void;
  /** Open the full emoji picker (handled by the parent, after this overlay closes). */
  onOpenEmojiPicker: () => void;
  /**
   * The exact sender name the in-list bubble rendered (undefined when it showed
   * none), so the selected replica mirrors it precisely.
   */
  senderName?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const STRIP_WIDTH = 286;   // 6 × 40px pills + 5 × 6px gaps + 2 × padding
const STRIP_HEIGHT = 52;
const ACTION_ITEM_H = 48;
const ACTION_COUNT = 4;    // Reply, Forward, Copy, Pin
const ACTION_MENU_H = ACTION_ITEM_H * ACTION_COUNT + 16;
const MARGIN = 10;

// ─── Quick emoji strip ────────────────────────────────────────────────────────

function QuickEmojiStrip({
  onReact,
  onOpenDrawer,
  style,
}: {
  onReact: (emoji: string) => void;
  onOpenDrawer: () => void;
  style?: object;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: theme.background,
          borderRadius: 28,
          paddingHorizontal: 8,
          paddingVertical: 6,
          width: STRIP_WIDTH,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        },
        style,
      ]}>
      {QUICK_EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => onReact(emoji)}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? theme.backgroundElement : 'transparent',
          })}>
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </Pressable>
      ))}
      {/* Plus → full emoji drawer */}
      <Pressable
        onPress={onOpenDrawer}
        style={({ pressed }) => ({
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? theme.backgroundElement : theme.backgroundElement,
        })}>
        <Icon name="add" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

// ─── Action menu ─────────────────────────────────────────────────────────────

interface ActionItem {
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  onPress: () => void;
  destructive?: boolean;
}

function ActionMenu({ items, style }: { items: ActionItem[]; style?: object }) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <View
      style={[
        {
          backgroundColor: theme.background,
          borderRadius: 14,
          overflow: 'hidden',
          minWidth: 200,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        },
        style,
      ]}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.backgroundElement }} />
          )}
          <Pressable
            onPress={item.onPress}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 13,
              gap: 12,
              backgroundColor: pressed ? theme.backgroundElement : 'transparent',
            })}>
            <Icon
              name={item.icon}
              size={20}
              color={item.destructive ? '#E57373' : theme.text}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                color: item.destructive ? '#E57373' : theme.text,
              }}>
              {item.label}
            </Text>
          </Pressable>
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export function MessageActionOverlay({
  message,
  layout,
  isMine,
  currentActorId,
  onDismiss,
  onReact,
  onReply,
  onForward,
  onCopy,
  onPin,
  onOpenEmojiPicker,
  senderName,
}: MessageActionOverlayProps) {
  const { colorScheme } = useColorScheme();

  // Fade in on mount; fade out before calling onDismiss.
  const opacity = useSharedValue(0);
  // The in-list bubble was swelled to ~1.06 by the long-press; the replica picks
  // up at that scale and settles to 1.0 so the hand-off looks continuous.
  const bubbleScale = useSharedValue(1.06);
  React.useEffect(() => {
    opacity.value = withTiming(1, ANIM_FAST);
    bubbleScale.value = withTiming(1, ANIM_FAST);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const bubbleScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: bubbleScale.value }] }));

  const startDismiss = React.useCallback(() => {
    // eslint-disable-next-line deprecation/deprecation
    opacity.value = withTiming(0, ANIM_FAST, (done) => {
      if (done) runOnJS(onDismiss)();
    });
  }, [onDismiss, opacity]);

  const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

  // Decide whether to stack emoji-above + action-below or emoji-below + action-above.
  const spaceBelow = SCREEN_H - (layout.y + layout.height);
  const spaceAbove = layout.y;
  const emojiAbove = spaceBelow < STRIP_HEIGHT + ACTION_MENU_H + MARGIN * 3;

  const emojiTop = emojiAbove
    ? layout.y - STRIP_HEIGHT - MARGIN
    : layout.y + layout.height + MARGIN;

  const actionTop = emojiAbove
    ? layout.y + layout.height + MARGIN
    : emojiTop + STRIP_HEIGHT + MARGIN;

  // Clamp emoji strip horizontally so it stays on screen.
  const emojiLeft = Math.max(
    MARGIN,
    Math.min(SCREEN_W - STRIP_WIDTH - MARGIN, layout.x + layout.width / 2 - STRIP_WIDTH / 2)
  );

  // Action menu: align to the same side as the bubble.
  const actionLeft = isMine
    ? Math.max(MARGIN, SCREEN_W - 220 - MARGIN)
    : MARGIN;

  const actions: ActionItem[] = [
    { label: 'Reply', icon: 'reply', onPress: () => { startDismiss(); onReply(); } },
    { label: 'Forward', icon: 'forward', onPress: () => { startDismiss(); onForward(); } },
    { label: 'Copy', icon: 'content-copy', onPress: () => { startDismiss(); onCopy(); } },
    {
      label: message.is_pinned ? 'Unpin' : 'Pin',
      icon: 'push-pin',
      onPress: () => { startDismiss(); onPin(); },
    },
  ];

  return (
    <>
      <Modal
        transparent
        visible
        animationType="none"
        onRequestClose={startDismiss}
        statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
          {/* Blurred backdrop + tap-outside-to-dismiss. Kept as its own layer so
              the interactive content below isn't nested inside the BlurView —
              text selection handles/loupe don't work for Text inside expo-blur. */}
          <BlurView
            intensity={28}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={startDismiss} />
          </BlurView>

          {/* Emoji reaction strip */}
          <QuickEmojiStrip
            style={{ position: 'absolute', top: emojiTop, left: emojiLeft }}
            onReact={(emoji) => {
              onReact(emoji);
              startDismiss();
            }}
            onOpenDrawer={onOpenEmojiPicker}
          />

          {/* The selected bubble is the real in-list bubble component, rendered in
              an identical width context so it's pixel-identical to the original:
              a full-width row pinned at the bubble's measured y, with the same
              left gutter (the measured x) and 12px trailing inset the list uses.
              `selectable` lets the text be highlighted/copied in place. */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: layout.y,
              left: isMine ? 0 : layout.x,
              right: isMine ? 0 : 12,
              alignItems: isMine ? 'flex-end' : 'flex-start',
            }}>
            <Animated.View style={bubbleScaleStyle}>
              <BubbleContent message={message} isMine={isMine} senderName={senderName} selectable />
            </Animated.View>
          </View>

          {/* Action menu */}
          <ActionMenu
            items={actions}
            style={{ position: 'absolute', top: actionTop, left: actionLeft, width: 200 }}
          />
        </Animated.View>
      </Modal>
    </>
  );
}
