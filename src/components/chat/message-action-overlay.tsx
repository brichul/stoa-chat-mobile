import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
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
import { Colors, Palette } from '@/constants/theme';

import { EmojiDrawer } from './emoji-drawer';
import { avatarColor } from './participant-avatar';

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

// ─── Bubble content replica (no avatar / sender chrome) ──────────────────────

function BubbleCopy({
  message,
  isMine,
  senderName,
}: {
  message: Message;
  isMine: boolean;
  senderName?: string;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <View
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: isMine ? Palette.black : theme.backgroundElement,
        borderWidth: isMine ? 0 : 1,
        borderColor: '#131211',
      }}>
      {senderName && (
        <Text
          style={{ fontSize: 12, fontWeight: '600', color: avatarColor(message.sender_id), marginBottom: 2 }}>
          {senderName}
        </Text>
      )}

      {message.reply_to && (
        <View
          style={{
            borderLeftWidth: 2,
            borderLeftColor: Palette.accentStart,
            paddingLeft: 8,
            marginBottom: 6,
            opacity: 0.7,
          }}>
          <Text style={{ color: isMine ? '#ddd' : theme.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {message.reply_to.sender_name}
          </Text>
          <Text style={{ color: isMine ? '#ddd' : theme.textSecondary, fontSize: 12 }} numberOfLines={1}>
            {message.reply_to.content}
          </Text>
        </View>
      )}
      {/*
        Rendered as a read-only TextInput rather than <Text selectable> so iOS
        gives real selection — drag handles + partial highlight. A plain Text
        only exposes a "Copy everything" callout with no granular selection.
      */}
      <TextInput
        value={message.content}
        editable={false}
        multiline
        scrollEnabled={false}
        className='text-base font-sans leading-5'
        // Android only allows selection on editable inputs; keep it editable
        // there but suppress the keyboard/caret so it reads as static text.
        {...(Platform.OS === 'android'
          ? { editable: true, showSoftInputOnFocus: false, caretHidden: true }
          : null)}
        style={{
          // fontSize: 16,
          // lineHeight: 20,
          padding: 0,
          margin: 0,
          color: isMine ? Palette.white : theme.text,
          ...(Platform.OS === 'android' ? { includeFontPadding: false, textAlignVertical: 'top' } : null),
        }}
      />
    </View>
  );
}

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
  senderName,
}: MessageActionOverlayProps) {
  const { colorScheme } = useColorScheme();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Fade in on mount; fade out before calling onDismiss.
  const opacity = useSharedValue(0);
  React.useEffect(() => {
    opacity.value = withTiming(1, ANIM_FAST);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
            onOpenDrawer={() => setDrawerOpen(true)}
          />

          {/* Bubble replica at its original position — selectable so the selected
              message's text can be highlighted/copied in place. */}
          <View
            style={{
              position: 'absolute',
              top: layout.y,
              left: layout.x,
              width: layout.width,
              height: layout.height,
              justifyContent: 'center',
            }}>
            <BubbleCopy message={message} isMine={isMine} senderName={senderName} />
          </View>

          {/* Action menu */}
          <ActionMenu
            items={actions}
            style={{ position: 'absolute', top: actionTop, left: actionLeft, width: 200 }}
          />
        </Animated.View>
      </Modal>

      {/* Full emoji drawer (separate modal on top) */}
      <EmojiDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSelect={(emoji) => {
          onReact(emoji);
          startDismiss();
        }}
      />
    </>
  );
}
