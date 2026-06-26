import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  interpolate,
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { ANIM_FAST } from '@/constants/animation';

import type { Message, Participant } from '@/api/types';
import type { IconName } from '@/components/icons/icon';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors, Fonts, Palette } from '@/constants/theme';

import { EnrichedText } from 'react-native-enriched-html';

import { extractFirstUrl } from '@/lib/link-preview';
import { hasRichContent, htmlToPlainText } from '@/lib/mentions';

import { MENTION_TEXT_HTML_STYLE } from './mention-views';
import { MessageAttachments } from './message-attachments';
import { avatarColor, ParticipantAvatar, participantLabel } from './participant-avatar';

// ─── Layout constants ─────────────────────────────────────────────────────────

const AVATAR_SIZE = 28;
const AVATAR_SPACE = AVATAR_SIZE + 8;
const FULL_R = 0;
const FLAT_R = 0;
const REPLY_THRESHOLD = 60; // drag distance that fires the reply callback
const MAX_DRAG = 80;        // maximum bubble translation
const LONG_PRESS_MS = 350;  // hold duration before the action overlay opens
const PRESS_GROW = 1.06;    // how much the bubble swells while held

// Animate the Pressable directly (rather than wrapping the bubble in an extra
// view) so the press-grow scale doesn't change how the bubble's maxWidth resolves.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
      <View className="bg-secondary flex-row items-center gap-1.5 px-3 py-1.5">
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
  isMine,
  onShowReactions,
}: {
  reactions: Record<string, string[]>;
  currentActorId: string;
  isMine: boolean;
  /** Tapping any pill opens the read-only breakdown of who reacted with what. */
  onShowReactions?: () => void;
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
            onPress={onShowReactions}
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

function ReadReceipts({ readBy, isGroup }: { readBy: Participant[]; isGroup: boolean }) {
  if (!readBy.length) return null;

  // 1-on-1: there's only ever one other reader, so a stack of avatars is noise —
  // show a plain "Read" label under the last seen message instead.
  if (!isGroup) {
    return <Text className="text-muted-foreground text-[11px]">Read</Text>;
  }

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

export function BubbleContent({
  message,
  isMine,
  radius,
  senderName,
  onPressReply,
  selectable = false,
}: {
  message: Message;
  isMine: boolean;
  radius?: ReturnType<typeof bubbleRadius>;
  /** Group chats: name of the sender, shown inside the first bubble of a group. */
  senderName?: string;
  /** Tapping the inline reply snippet jumps to the original message. */
  onPressReply?: (replyToId: string) => void;
  /** Make the message text natively selectable (used by the long-press overlay). */
  selectable?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const attachments = message.attachments ?? [];
  const hasAttachments = attachments.length > 0;
  const align = isMine ? 'flex-end' : 'flex-start';

  // When the whole message is just a URL that's already shown as a link preview
  // card, drop the redundant inline link and let the card speak for itself.
  const plain = htmlToPlainText(message.content).trim();
  const hasLinkCard = attachments.some((a) => a.kind === 'link');
  const isBareLink = hasLinkCard && plain.length > 0 && extractFirstUrl(plain) === plain;
  const hasText = plain.length > 0 && !isBareLink;

  // Mentions/links need the native EnrichedText (which fills its container
  // width); plain messages use a plain Text so the bubble hugs its content.
  const renderContent = (color: string, extraStyle?: object) =>
    hasRichContent(message.content) ? (
      <View style={{maxWidth: message.content.replace(/<[^>]*>/g, '').length * 8 - 12}}>
        <EnrichedText
          selectable={selectable}
          htmlStyle={MENTION_TEXT_HTML_STYLE}
          className='text-base leading-5'
          onLinkPress={(e) => Linking.openURL(e.url)}
          style={{ color, fontFamily: Fonts.sans, ...extraStyle }}>
          {message.content}
        </EnrichedText>
      </View>
    ) : (
      <Text selectable={selectable} className="text-base leading-5" style={{ color, ...extraStyle }}>
        {htmlToPlainText(message.content)}
      </Text>
    );

  const senderNameEl = senderName ? (
    <Text
      style={{ fontSize: 12, fontWeight: '600', color: avatarColor(message.sender_id), marginBottom: 2 }}>
      {senderName}
    </Text>
  ) : null;

  const forwardedEl = message.is_forwarded ? (
    <View className="mb-1 flex-row items-center gap-1">
      <Icon name="forward" size={12} color={isMine && !hasAttachments ? '#aaa' : theme.textSecondary} />
      <Text style={{ fontSize: 11, color: isMine && !hasAttachments ? '#aaa' : theme.textSecondary }}>
        Forwarded
      </Text>
    </View>
  ) : null;

  const replyEl = message.reply_to ? (
    <Pressable
      onPress={() => message.reply_to && onPressReply?.(message.reply_to.id)}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: Palette.accentStart,
        paddingLeft: 8,
        marginBottom: 6,
        opacity: 0.75,
      }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: isMine && !hasAttachments ? '#ccc' : theme.textSecondary }}>
        {message.reply_to.sender_name}
      </Text>
      <Text style={{ fontSize: 12, color: isMine && !hasAttachments ? '#bbb' : theme.textSecondary }} numberOfLines={1}>
        {htmlToPlainText(message.reply_to.content)}
      </Text>
    </Pressable>
  ) : null;

  // Attachment messages drop the bubble chrome: photos render bare, chips/cards
  // carry their own. The caption (if any) is attached directly underneath the
  // item with no separation; ownership is conveyed by alignment alone.
  if (hasAttachments) {
    return (
      <View style={{ maxWidth: '80%', alignItems: align }}>
        {senderNameEl}
        {forwardedEl}
        {replyEl}
        <MessageAttachments attachments={attachments} align={align} />
        {hasText && renderContent(theme.text, { marginTop: 3, alignSelf: 'stretch' })}
      </View>
    );
  }

  return (
    <View
      style={[
        { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 8 },
        radius,
        isMine
          ? { backgroundColor: Palette.black }
          : { backgroundColor: theme.backgroundElement, borderWidth: 1, borderColor: '#131211' },
      ]}>
      {senderNameEl}
      {forwardedEl}
      {replyEl}

      {renderContent(isMine ? Palette.white : theme.text)}
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
  /** Carries the id of the message that should briefly flash (reply jump target). */
  highlightedId: SharedValue<string | null>;
  onReact?: (messageId: string, emoji: string) => void;
  onLongPress?: (message: Message, layout: MessageLayout, senderName?: string) => void;
  /** Fired when the user swipes this bubble past the reply threshold. */
  onSwipeReply?: (message: Message) => void;
  /** Tap a reaction pill → open the read-only breakdown of who reacted. */
  onShowReactions?: (message: Message) => void;
  /** Tap the inline reply snippet → jump to the original message. */
  onPressReply?: (replyToId: string) => void;
  /** Animate the row in from below (only for messages that arrive after mount). */
  animateIn?: boolean;
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
  highlightedId,
  onReact,
  onLongPress,
  onSwipeReply,
  onShowReactions,
  onPressReply,
  animateIn,
}: MessageRowProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // ── Swipe-right to reply ────────────────────────────────────────────────────
  const replyDrag = useSharedValue(0);
  const hasTriggered = useSharedValue(false);

  // ── Press-and-hold grow: bubble swells during the long-press, then the
  //    overlay replica picks up at this scale and settles back to 1.0.
  const pressScale = useSharedValue(1);
  const pressScaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  // "mine" bubbles slide left to reveal the timestamp (right side has room).
  // "others" bubbles stay put — they're near the left edge and would go off-screen.
  const bubbleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isMine
      ? replyDrag.value - showTimestamps.value * 80
      : replyDrag.value }],
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

  // Right swipe ≥8px → reply.
  const replyPan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(8)
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
    [] // refs keep callbacks fresh; no recreate needed
  );

  // Left swipe ≥8px → reveal timestamps for all bubbles via shared value.
  const tsPan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX(-8)
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          showTimestamps.value = Math.min(1, Math.abs(e.translationX) / 80);
        })
        .onEnd(() => {
          showTimestamps.value = withTiming(0, ANIM_FAST);
        }),
    [showTimestamps]
  );

  // ── Double-tap to heart ─────────────────────────────────────────────────────
  const onReactRef = React.useRef(onReact);
  onReactRef.current = onReact;
  const heart = React.useCallback(() => {
    onReactRef.current?.(messageRef.current.id, '❤️');
  }, []);

  const doubleTap = React.useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(300)
        .onEnd((_e, success) => {
          if (success) {
            // eslint-disable-next-line deprecation/deprecation
            runOnJS(heart)();
          }
        }),
    [heart]
  );

  // Race: first to reach its activation threshold wins; the other is cancelled.
  const bubbleGesture = React.useMemo(
    () => Gesture.Race(replyPan, tsPan, doubleTap),
    [replyPan, tsPan, doubleTap]
  );

  // ── Reply-jump highlight flash ──────────────────────────────────────────────
  const flash = useSharedValue(0);
  useAnimatedReaction(
    () => highlightedId.value,
    (cur) => {
      if (cur === message.id) {
        flash.value = withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0, { duration: 700 })
        );
      }
    }
  );
  const flashStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(152,81,75,${0.18 * flash.value})`,
  }));

  // Sender name lives inside the first bubble of a group (others only). Computed
  // here so the long-press handler can hand the overlay the exact same value,
  // keeping the selected replica an exact mirror of the in-list bubble.
  const senderName =
    isFirstInGroup && isGroup && !isMine && participant
      ? participantLabel(participant)
      : undefined;

  // ── Long-press for overlay ──────────────────────────────────────────────────
  const bubbleRef = React.useRef<View>(null);

  const handleLongPress = () => {
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      // The bubble is mid press-grow (scaled to ~PRESS_GROW about its center) when
      // measured, so the raw rect is inflated and shifted up-left. Divide the live
      // scale back out — the center is scale-invariant — so the overlay anchors to
      // the bubble's true resting rect and lines up exactly with the in-list one.
      const s = pressScale.value || 1;
      const w = width / s;
      const h = height / s;
      onLongPress?.(
        message,
        { x: x + (width - w) / 2, y: y + (height - h) / 2, width: w, height: h },
        senderName
      );
    });
  };

  // ── Early return for system events (hooks already called above) ────────────
  if (message.type !== 'message') {
    return <SystemPill message={message} />;
  }

  const radius = bubbleRadius(isMine, isFirstInGroup, isLastInGroup);
  const topGap = isFirstInGroup ? 6 : 2;

  // Group chats reserve a gutter on the left for the sender avatar; 1-on-1 chats
  // have no avatar, so the bubble hugs the edge with only a small inset.
  const gutter = isGroup ? AVATAR_SPACE : 12;

  // Reply icon sits at the left edge of the content area (left of bubble for others,
  // left gutter of screen for mine — revealed as the bubble slides right).
  const replyIconLeft = !isMine ? gutter : 4;

  return (
    <Animated.View
      style={{ marginTop: topGap }}
      entering={animateIn ? FadeInDown.duration(160) : undefined}>
      {/* Pinned banner */}
      {message.is_pinned && (
        <View
          style={{
            paddingLeft: !isMine ? gutter + 4 : 0,
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

      {/*
        Bubble row only — position:relative spans ONLY the bubble height so the
        absolute timestamp aligns with the bubble, not reactions/read-receipts.
        The flash layer paints behind the bubble when it's a reply-jump target.
      */}
      <Animated.View style={[{ position: 'relative' }, flashStyle]}>
        {/* Reply icon revealed as bubble slides right */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: replyIconLeft, top: 0, bottom: 0, justifyContent: 'center' },
            replyIconAnimStyle,
          ]}>
          <Icon name="reply" size={20} color={theme.textSecondary} />
        </Animated.View>

        {/* Timestamp: right edge of screen, vertically centered to bubble height */}
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', right: 8, top: 0, bottom: 0, justifyContent: 'center' },
            tsAnimStyle,
          ]}>
          <Text className="text-muted-foreground text-[11px]">{formatTime(message.timestamp)}</Text>
        </Animated.View>

        {/* Race: right-swipe → reply; left-swipe → timestamps; double-tap → heart */}
        <GestureDetector gesture={bubbleGesture}>
          <Animated.View style={bubbleAnimStyle}>
            <View className="flex-row items-end">
              {!isMine && (
                <View style={{ width: gutter, alignItems: 'flex-end', paddingRight: 8 }}>
                  {isLastInGroup && isGroup && participant && (
                    <ParticipantAvatar participant={participant} size={AVATAR_SIZE} />
                  )}
                </View>
              )}
              <View style={{ flex: 1, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <AnimatedPressable
                  ref={bubbleRef}
                  onLongPress={handleLongPress}
                  delayLongPress={LONG_PRESS_MS}
                  onPressIn={() => {
                    pressScale.value = withTiming(PRESS_GROW, { duration: LONG_PRESS_MS });
                  }}
                  onPressOut={() => {
                    pressScale.value = withTiming(1, ANIM_FAST);
                  }}
                  style={pressScaleStyle}>
                  <BubbleContent
                    message={message}
                    isMine={isMine}
                    radius={radius}
                    senderName={senderName}
                    onPressReply={onPressReply}
                  />
                </AnimatedPressable>
              </View>
              {!isMine && <View style={{ width: 12 }} />}
            </View>
          </Animated.View>
        </GestureDetector>
      </Animated.View>

      {/* Reactions — outside the relative container so they don't affect timestamp height */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <View style={{ paddingLeft: !isMine ? gutter + 4 : 0, paddingRight: isMine ? 12 : 0 }}>
          <ReactionsRow
            reactions={message.reactions}
            currentActorId={currentActorId}
            isMine={isMine}
            onShowReactions={() => onShowReactions?.(message)}
          />
        </View>
      )}

      {/* Read receipts — same reasoning */}
      {isLastInGroup && readBy.length > 0 && (
        <View
          className="mt-0.5 flex-row items-center gap-1"
          style={{ paddingLeft: !isMine ? gutter + 4 : 0, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
          <ReadReceipts readBy={readBy} isGroup={isGroup} />
        </View>
      )}
    </Animated.View>
  );
}
