import * as React from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  // eslint-disable-next-line deprecation/deprecation
  runOnJS,
  type SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ANIM_FAST } from '@/constants/animation';

import type { Message, Participant } from '@/api/types';
import { Text } from '@/components/ui/text';

import { MessageRow, type MessageLayout } from './message-bubble';

// ─── Types ───────────────────────────────────────────────────────────────────

type DateHeaderItem = {
  kind: 'date';
  key: string;
  label: string;
};

type MessageItem = {
  kind: 'message';
  key: string;
  message: Message;
  isMine: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  participant?: Participant;
  readBy: Participant[];
};

type ListItem = DateHeaderItem | MessageItem;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GROUP_GAP_MS = 5 * 60 * 1000;

// How many list items (messages + date headers) to reveal per lazy-load page.
const PAGE_SIZE = 30;

function formatDateHeader(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const msgStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayStart - msgStart) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(diffDays > 365 ? { year: 'numeric' } : {}),
  });
}

function sameGroup(a: Message, b: Message): boolean {
  return (
    a.type === 'message' &&
    b.type === 'message' &&
    a.sender_id === b.sender_id &&
    Math.abs(a.timestamp - b.timestamp) < GROUP_GAP_MS
  );
}

function buildListItems(
  messages: Message[],
  currentActorId: string,
  participants: Participant[]
): ListItem[] {
  const items: ListItem[] = [];
  let lastDateLabel = '';

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  const readAtMessage = new Map<string, Participant[]>();
  for (const p of participants) {
    if (p.id === currentActorId || !p.last_read_message_id) continue;
    const bucket = readAtMessage.get(p.last_read_message_id) ?? [];
    bucket.push(p);
    readAtMessage.set(p.last_read_message_id, bucket);
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    const dateLabel = formatDateHeader(msg.timestamp);
    if (dateLabel !== lastDateLabel) {
      items.push({ kind: 'date', key: `date_${i}`, label: dateLabel });
      lastDateLabel = dateLabel;
    }

    const isMine = msg.sender_id === currentActorId;
    const isFirstInGroup = !prev || !sameGroup(prev, msg);
    const isLastInGroup = !next || !sameGroup(msg, next);
    const participant = !isMine ? participantMap.get(msg.sender_id) : undefined;
    const readBy = (readAtMessage.get(msg.id) ?? []).filter((p) => p.id !== currentActorId);

    items.push({
      kind: 'message',
      key: msg.id,
      message: msg,
      isMine,
      isFirstInGroup,
      isLastInGroup,
      participant,
      readBy,
    });
  }

  return items;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DateHeader({ label }: { label: string }) {
  return (
    <View className="my-3 items-center">
      <View className="bg-secondary px-3 py-1">
        <Text className="text-muted-foreground text-[11px] font-semibold">{label}</Text>
      </View>
    </View>
  );
}

// ─── MessageList ─────────────────────────────────────────────────────────────

export interface MessageListProps {
  messages: Message[];
  currentActorId: string;
  participants: Participant[];
  onReact?: (messageId: string, emoji: string) => void;
  onLongPress?: (message: Message, layout: MessageLayout, senderName?: string) => void;
  /** Fired when a message bubble is swiped right past the reply threshold. */
  onSwipeReply?: (message: Message) => void;
  /** Tapping a reaction pill → open the read-only breakdown of who reacted. */
  onShowReactions?: (message: Message) => void;
  /** Called when the user swipes right from the left edge of the chat area. */
  onOpenSidebar?: () => void;
}

export function MessageList({
  messages,
  currentActorId,
  participants,
  onReact,
  onLongPress,
  onSwipeReply,
  onShowReactions,
  onOpenSidebar,
}: MessageListProps) {
  const listRef = React.useRef<FlatList<ListItem>>(null);

  const isGroup = participants.filter((p) => p.permission === 'write').length > 2;

  const items = React.useMemo(
    () => buildListItems(messages, currentActorId, participants),
    [messages, currentActorId, participants]
  );

  // ── Shared animated value: drives timestamp reveal across all rows ──────────
  const showTimestamps = useSharedValue(0);

  // ── Lazy load: render only the most recent window, revealing older ones as the
  //    user scrolls toward the top. `atBottom` gates auto-scroll so loading older
  //    pages (which prepend) doesn't yank the view to the bottom.
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const atBottomRef = React.useRef(true);
  const windowStart = Math.max(0, items.length - limit);
  const windowed = React.useMemo(() => items.slice(windowStart), [items, windowStart]);

  // Messages created after the screen opened animate in; the initial batch doesn't.
  const mountTimeRef = React.useRef(Date.now());

  // ── Reply-jump: scroll to the original message and flash it ──────────────────
  const highlightedId = useSharedValue<string | null>(null);

  const scrollToMessage = React.useCallback(
    (messageId: string) => {
      const fullIndex = items.findIndex(
        (it) => it.kind === 'message' && it.message.id === messageId
      );
      if (fullIndex < 0) return; // not loaded at all
      // Make sure the target is inside the rendered window, expanding it if needed.
      const targetLimit = Math.max(limit, items.length - fullIndex + 4);
      if (targetLimit !== limit) setLimit(targetLimit);
      const start = Math.max(0, items.length - targetLimit);
      const index = fullIndex - start;
      highlightedId.value = null;
      setTimeout(
        () => {
          listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
          setTimeout(() => {
            highlightedId.value = messageId;
          }, 250);
        },
        targetLimit !== limit ? 80 : 0
      );
    },
    [items, limit, highlightedId]
  );

  const handleScroll = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      atBottomRef.current =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 48;
      if (contentOffset.y < 80) {
        setLimit((l) => (l < items.length ? Math.min(items.length, l + PAGE_SIZE) : l));
      }
    },
    [items.length]
  );

  // Track where the touch began (to restrict sidebar gesture to left edge).
  const gestureStartX = useSharedValue(0);

  // Stable ref so the gesture closure never captures a stale callback.
  const onOpenSidebarRef = React.useRef(onOpenSidebar);
  onOpenSidebarRef.current = onOpenSidebar;
  const callOpenSidebar = React.useCallback(() => {
    onOpenSidebarRef.current?.();
  }, []);

  const listPan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-25, 25])
        .onBegin((e) => {
          gestureStartX.value = e.x;
        })
        .onUpdate((e) => {
          // Left swipe: fade timestamps in proportionally
          if (e.translationX < 0) {
            // 80px swipe = full reveal; matches the bubble's max leftward translation
            showTimestamps.value = Math.min(1, Math.abs(e.translationX) / 80);
          }
        })
        .onEnd((e) => {
          // Always fade timestamps back out on release
          showTimestamps.value = withTiming(0, ANIM_FAST);

          // Right swipe from the left-edge dead zone (< 30px) → open sidebar.
          // Message content never starts in this zone (avatar gutter = 36px),
          // so this never conflicts with the per-bubble reply gesture.
          if (gestureStartX.value < 30 && e.translationX > 50) {
            // eslint-disable-next-line deprecation/deprecation
            runOnJS(callOpenSidebar)();
          }
        }),
    [callOpenSidebar, gestureStartX, showTimestamps]
  );

  const emptyView = (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-muted-foreground text-center text-sm">
        No messages yet. Say hello to get started.
      </Text>
    </View>
  );

  return (
    <GestureDetector gesture={listPan}>
      <Animated.View style={{ flex: 1 }}>
        {messages.length === 0 ? (
          emptyView
        ) : (
          <FlatList
            ref={listRef}
            data={windowed}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingVertical: 8 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={32}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={() => {
              // Pin to the bottom on initial load and when a new message lands while
              // the user is already at the bottom — but never when loading older pages.
              if (atBottomRef.current) listRef.current?.scrollToEnd({ animated: false });
            }}
            onScrollToIndexFailed={({ index }) => {
              // No getItemLayout, so a distant index can fail; nudge then retry.
              listRef.current?.scrollToOffset({ offset: index * 64, animated: true });
              setTimeout(() => {
                listRef.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true });
              }, 120);
            }}
            renderItem={({ item }) => {
              if (item.kind === 'date') {
                return <DateHeader label={item.label} />;
              }
              return (
                <MessageRow
                  message={item.message}
                  isMine={item.isMine}
                  isFirstInGroup={item.isFirstInGroup}
                  isLastInGroup={item.isLastInGroup}
                  isGroup={isGroup}
                  participant={item.participant}
                  readBy={item.readBy}
                  currentActorId={currentActorId}
                  showTimestamps={showTimestamps}
                  highlightedId={highlightedId}
                  onReact={onReact}
                  onLongPress={onLongPress}
                  onSwipeReply={onSwipeReply}
                  onShowReactions={onShowReactions}
                  onPressReply={scrollToMessage}
                  animateIn={item.message.timestamp >= mountTimeRef.current}
                />
              );
            }}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}
