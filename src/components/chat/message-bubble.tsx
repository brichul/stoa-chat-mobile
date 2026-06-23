import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ANIM_FAST } from '@/constants/animation';

import type { Message, Participant } from '@/api/types';
import type { IconName } from '@/components/icons/icon';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors, Palette } from '@/constants/theme';

import { ParticipantAvatar, participantLabel } from './participant-avatar';

// ─── Layout constants ─────────────────────────────────────────────────────────

const AVATAR_SIZE = 28;
const AVATAR_SPACE = AVATAR_SIZE + 8;
const FULL_R = 18;
const FLAT_R = 4;
const REPLY_THRESHOLD = 60; // drag distance that fires the reply callback
const MAX_DRAG = 80;        // maximum bubble translation

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bubbleRadius(isMine: boolean, isFirst: boolean, isLast: boolean) {
  const [tl, tr, br, bl] = isMine
    ? [FULL_R, isFirst ? FULL_R : FLAT_R, isLast ? FULL_R : FLAT_R, FULL_R]
    : [isFirst ? FULL_R : FLAT_R, FULL_R, FULL_R, isLast ? FULL_R : FLAT_R];
  return { borderTopLeftRadius: tl, borderTopRightRadius: tr, borderBottomRightRadius: br, borderBottomLeftRadius: bl };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
}

// ─── System event pill ────────────────────────────────────────────────────────

const SYSTEM_ICONS: Partial<Record<string, IconName>> = {
  join: 'person-add',
  leave: 'exit-to-app',
  participant_added: 'person-add',
  node_attached: 'hub',
  vault_attached: 'folder',
  system: 'info',
};

function SystemPill({ message }: { message: Message }) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const icon: IconName = SYSTEM_ICONS[message.type] ?? 'info';
  return (
    <View className="my-2 items-center px-4">
      <View className="bg-secondary flex-row items-center gap-1.5 rounded-2xl px-3 py-1.5">
        <Icon name={icon} size={11} color={theme.textSecondary} />
        <Text className="text-muted-foreground text-xs">{message.content}</Text>
      </View>
    </View>
  );
}

// ─── Reactions row ────────────────────────────────────────────────────────────

function ReactionsRow({
  reactions,
  currentActorId,
  messageId,
  isMine,
  onReact,
}: {
  reactions: Record<string, string[]>;
  currentActorId: string;
  messageId: string;
  isMine: boolean;
  onReact?: (messageId: string, emoji: string) => void;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const entries = Object.entries(reactions).filter(([, ids]) => ids.length > 0);
  if (!entries.length) return null;
  return (
    <View
      className="mt-1 flex-row flex-wrap gap-1"
      style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
      {entries.map(([emoji, userIds]) => {
        const reacted = userIds.includes(currentActorId);
        return (
          <Pressable
            key={emoji}
            onPress={() => onReact?.(messageId, emoji)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              backgroundColor: reacted ? 'rgba(152,81,75,0.15)' : theme.backgroundElement,
              borderWidth: reacted ? 1 : 0,
              borderColor: reacted ? Palette.accentStart : 'transparent',
            }}>
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: reacted ? Palette.accentStart : theme.textSecondary,
              }}>
              {userIds.length}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Read receipts ────────────────────────────────────────────────────────────

function ReadReceipts({ readBy }: { readBy: Participant[] }) {
  if (!readBy.length) return null;
  return (
    <View className="flex-row items-center" style={{ gap: -2 }}>
      {readBy.slice(0, 5).map((p) => (
        <ParticipantAvatar key={p.id} participant={p} size={14} />
      ))}
      {readBy.length > 5 && (
        <Text className="text-muted-foreground ml-1 text-[9px]">+{readBy.length - 5}</Text>
      )}
    </View>
  );
}

// ─── Bubble content ───────────────────────────────────────────────────────────

function BubbleContent({
  message,
  isMine,
  radius,
}: {
  message: Message;
  isMine: boolean;
  radius: ReturnType<typeof bubbleRadius>;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <View
      style={[
        { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 8 },
        radius,
        isMine
          ? { backgroundColor: Palette.black }
          : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: '#131211' },
      ]}>
      {message.is_forwarded && (
        <View className="mb-1 flex-row items-center gap-1">
          <Icon name="forward" size={12} color={isMine ? '#aaa' : theme.textSecondary} />
          <Text style={{ fontSize: 11, color: isMine ? '#aaa' : theme.textSecondary }}>
            Forwarded
          </Text>
        </View>
      )}

      {message.reply_to && (
        <View
          style={{
            borderLeftWidth: 2,
            borderLeftColor: Palette.accentStart,
            paddingLeft: 8,
            marginBottom: 6,
            opacity: 0.75,
          }}>
          <Text
            style={{ fontSize: 11, fontWeight: '600', color: isMine ? '#ccc' : theme.textSecondary }}>
            {message.reply_to.sender_name}
          </Text>
          <Text
            style={{ fontSize: 12, color: isMine ? '#bbb' : theme.textSecondary }}
            numberOfLines={2}>
            {message.reply_to.content}
          </Text>
        </View>
      )}

      <Text className="text-base leading-5" style={{ color: isMine ? Palette.white : theme.text }}>
        {message.content}
      </Text>
    </View>
  );
}

// ─── Main MessageRow ──────────────────────────────────────────────────────────

export interface MessageLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MessageRowProps {
  message: Message;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  isGroup: boolean;
  participant?: Participant;
  readBy: Participant[];
  currentActorId: string;
  /** Shared value from MessageList — opacity 0→1 for all timestamps simultaneously. */
  showTimestamps: SharedValue<number>;
  onReact?: (messageId: string, emoji: string) => void;
  onLongPress?: (message: Message, layout: MessageLayout) => void;
  /** Fired when the user swipes this bubble past the reply threshold. */
  onSwipeReply?: (message: Message) => void;
}

export function MessageRow({
  message,
  isMine,
  isFirstInGroup,
  isLastInGroup,
  isGroup,
  participant,
  readBy,
  currentActorId,
  showTimestamps,
  onReact,
  onLongPress,
  onSwipeReply,
}: MessageRowProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // ── Swipe-right to reply ────────────────────────────────────────────────────
  const replyDrag = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  // Combine right-swipe reply drag (positive) and left-swipe timestamp reveal (negative)
  // so both gestures drive the same bubble translation.
  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: replyDrag.value - showTimestamps.value * 80 }],
  }));

  const replyIconAnimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(replyDrag.value, [0, 30, REPLY_THRESHOLD], [0, 0.4, 1], 'clamp'),
    transform: [{ scale: interpolate(replyDrag.value, [0, REPLY_THRESHOLD], [0.5, 1], 'clamp') }],
  }));

  // ── Global timestamp reveal (driven by parent) ──────────────────────────────
  const tsAnimStyle = useAnimatedStyle(() => ({
    opacity: showTimestamps.value,
  }));

  // ── Stable callback via refs so the gesture is never recreated ──────────────
  const onSwipeReplyRef = React.useRef(onSwipeReply);
  onSwipeReplyRef.current = onSwipeReply;
  const messageRef = React.useRef(message);
  messageRef.current = message;

  const triggerReply = React.useCallback(() => {
    onSwipeReplyRef.current?.(messageRef.current);
  }, []);

  const replyPan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([8, 999])
        .failOffsetY([-12, 12])
        .onBegin(() => {
          hasTriggered.value = false;
        })
        .onUpdate((e) => {
          replyDrag.value = Math.min(MAX_DRAG, Math.max(0, e.translationX));
          if (!hasTriggered.value && e.translationX >= REPLY_THRESHOLD) {
            hasTriggered.value = true;
            // eslint-disable-next-line deprecation/deprecation
            runOnJS(triggerReply)();
          }
        })
        .onEnd(() => {
          replyDrag.value = withTiming(0, ANIM_FAST);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // gesture created once; refs keep callbacks fresh
  );

  // ── Long-press for overlay ──────────────────────────────────────────────────
  const bubbleRef = React.useRef<View>(null);

  const handleLongPress = () => {
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress?.(message, { x, y, width, height });
    });
  };

  // ── Early return for system events (hooks already called above) ────────────
  if (message.type !== 'message') {
    return <SystemPill message={message} />;
  }

  const radius = bubbleRadius(isMine, isFirstInGroup, isLastInGroup);
  const topGap = isFirstInGroup ? 6 : 2;

  // Reply icon sits at the left edge of the content area (left of bubble for others,
  // left gutter of screen for mine — revealed as the bubble slides right).
  const replyIconLeft = !isMine ? AVATAR_SPACE : 4;

  return (
    <View style={{ marginTop: topGap }}>
      {/* Pinned banner */}
      {message.is_pinned && (
        <View
          style={{
            paddingLeft: !isMine ? AVATAR_SPACE + 4 : 0,
            paddingRight: isMine ? 12 : 0,
            flexDirection: 'row',
            justifyContent: isMine ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            gap: 3,
            marginBottom: 2,
          }}>
          <Icon name="push-pin" size={10} color={theme.textSecondary} />
          <Text className="text-muted-foreground text-[10px]">Pinned</Text>
        </View>
      )}

      {/* Sender name */}
      {isFirstInGroup && isGroup && !isMine && participant && (
        <Text
          className="text-muted-foreground text-[11px]"
          style={{ marginLeft: AVATAR_SPACE + 4, marginBottom: 2 }}>
          {participantLabel(participant)}
        </Text>
      )}

      {/* Row: swipeable content + absolutely-positioned overlays */}
      <View style={{ position: 'relative' }}>
        {/* Timestamp — fades in globally when list is swiped left */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', right: 10, top: 0, bottom: 0, justifyContent: 'center' },
            tsAnimStyle,
          ]}>
          <Text className="text-muted-foreground text-[11px]">{formatTime(message.timestamp)}</Text>
        </Animated.View>

        {/* Reply icon — revealed behind the bubble as it slides right */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: replyIconLeft, top: 0, bottom: 0, justifyContent: 'center' },
            replyIconAnimStyle,
          ]}>
          <Icon name="reply" size={20} color={theme.textSecondary} />
        </Animated.View>

        {/* Swipeable bubble row */}
        <GestureDetector gesture={replyPan}>
          <Animated.View style={bubbleAnimStyle}>
            <View className="flex-row items-end">
              {/* Avatar gutter */}
              {!isMine && (
                <View style={{ width: AVATAR_SPACE, alignItems: 'flex-end', paddingRight: 8 }}>
                  {isLastInGroup && isGroup && participant && (
                    <ParticipantAvatar participant={participant} size={AVATAR_SIZE} />
                  )}
                </View>
              )}

              {/* Content column */}
              <View style={{ flex: 1, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <Pressable
                  ref={bubbleRef}
                  onLongPress={handleLongPress}
                  delayLongPress={350}>
                  <BubbleContent message={message} isMine={isMine} radius={radius} />
                </Pressable>

                {/* Reactions */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <ReactionsRow
                    reactions={message.reactions}
                    currentActorId={currentActorId}
                    messageId={message.id}
                    isMine={isMine}
                    onReact={onReact}
                  />
                )}

                {/* Read receipts */}
                {isLastInGroup && readBy.length > 0 && (
                  <View
                    className="mt-0.5 flex-row items-center gap-1"
                    style={{ justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <ReadReceipts readBy={readBy} />
                  </View>
                )}
              </View>

              {!isMine && <View style={{ width: 12 }} />}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}
