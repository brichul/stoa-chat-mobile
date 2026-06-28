import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAuthToken } from '@/api/client';
import * as chatsApi from '@/api/chats';
import { ChatSocket } from '@/api/chat-socket';
import type { Chat, ChatSocketEvent, Message, MessageAttachment } from '@/api/types';
import { uploadFile } from '@/api/uploads';
import { ChatHeader } from '@/components/chat/chat-header';
import { EmojiDrawer } from '@/components/chat/emoji-drawer';
import { MessageComposer, type Attachment } from '@/components/chat/message-composer';
import { MessageList } from '@/components/chat/message-list';
import { ReactionsSheet } from '@/components/chat/reactions-sheet';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/auth-context';
import { useChats } from '@/contexts/chats-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { useCurrentUserId } from '@/hooks/use-current-user-id';
import { extractFirstUrl, mockLinkPreview } from '@/lib/link-preview';
import { htmlToPlainText } from '@/lib/mentions';

import {
  MessageActionOverlay,
  type MessageLayout,
} from './message-action-overlay';

/** Apply a realtime `reaction` event to a message's actor-id reaction map
 *  (one reaction per actor — clear them from all emojis, then re-add on 'add'). */
function applyReactionEvent(
  m: Message,
  ev: Extract<ChatSocketEvent, { type: 'reaction' }>
): Message {
  const reactions: Record<string, string[]> = {};
  for (const [emoji, ids] of Object.entries(m.reactions ?? {})) {
    const filtered = ids.filter((id) => id !== ev.actor_id);
    if (filtered.length) reactions[emoji] = filtered;
  }
  if (ev.action === 'add') {
    reactions[ev.emoji] = [...(reactions[ev.emoji] ?? []), ev.actor_id];
  }
  return { ...m, reactions };
}

export function ChatScreen() {
  const { activeChat, openSidebar } = useWorkspace();
  const router = useRouter();
  const currentUserId = useCurrentUserId();
  const { user } = useAuth();
  const myName = user?.display_name || user?.username || 'You';

  // Local copy of the chat so realtime events (participant/node/vault adds) can
  // update it in place. Re-syncs when the active chat changes.
  const [chat, setChat] = React.useState<Chat | null>(activeChat);
  React.useEffect(() => {
    setChat(activeChat);
  }, [activeChat]);

  const [messages, setMessages] = React.useState<Message[]>([]);
  const socketRef = React.useRef<ChatSocket | null>(null);

  const chatId = chat?.id ?? null;

  // ─── History ──────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    let active = true;
    setMessages([]);
    chatsApi
      .listMessages(chatId)
      .then((res) => {
        if (active) setMessages(res.messages);
      })
      .catch(() => {
        /* surfaced via empty state for now */
      });
    return () => {
      active = false;
    };
  }, [chatId]);

  // ─── Realtime socket ───────────────────────────────────────────────────────────
  const handleEvent = React.useCallback((ev: ChatSocketEvent) => {
    switch (ev.type) {
      case 'message': {
        const msg = ev as Message;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        break;
      }
      case 'reaction':
        setMessages((prev) =>
          prev.map((m) => (m.id === ev.message_id ? applyReactionEvent(m, ev) : m))
        );
        break;
      case 'participant_added':
        setChat((prev) => {
          if (!prev) return prev;
          const p = ev.participant;
          if (!p.id || prev.participants.some((x) => x.id === p.id)) return prev;
          return { ...prev, participants: [...prev.participants, p as Chat['participants'][number]] };
        });
        break;
      case 'node_attached':
        setChat((prev) => {
          if (!prev || (prev.attached_nodes ?? []).includes(ev.node.id)) return prev;
          return {
            ...prev,
            attached_nodes: [...(prev.attached_nodes ?? []), ev.node.id],
            attached_nodes_detail: [...(prev.attached_nodes_detail ?? []), ev.node],
          };
        });
        break;
      case 'vault_attached':
        setChat((prev) => {
          if (!prev || (prev.attached_vaults ?? []).includes(ev.vault.id)) return prev;
          return {
            ...prev,
            attached_vaults: [...(prev.attached_vaults ?? []), ev.vault.id],
            attached_vaults_detail: [...(prev.attached_vaults_detail ?? []), ev.vault],
          };
        });
        break;
      case 'join':
      case 'leave':
      case 'system': {
        // Append as a system message, but skip the connection welcome frame.
        const e = ev as any;
        if (e.sender_id === 'system' && e.metadata) break;
        if (e.id && e.content) {
          setMessages((prev) =>
            prev.some((m) => m.id === e.id)
              ? prev
              : [...prev, { ...e, sender_name: e.sender_name ?? '' } as Message]
          );
        }
        break;
      }
      // 'typing' and 'read' are not surfaced in the UI yet.
    }
  }, []);

  React.useEffect(() => {
    const token = getAuthToken();
    if (!chatId || !token) return;
    const socket = new ChatSocket(chatId, token);
    socketRef.current = socket;
    const off = socket.onEvent(handleEvent);
    socket.connect();
    return () => {
      off();
      socket.close();
      socketRef.current = null;
    };
  }, [chatId, handleEvent]);

  // ─── Selection overlay ──────────────────────────────────────────────────────

  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const [selectedLayout, setSelectedLayout] = React.useState<MessageLayout | null>(null);
  const [selectedSenderName, setSelectedSenderName] = React.useState<string | undefined>(undefined);

  const handleLongPress = (message: Message, layout: MessageLayout, senderName?: string) => {
    setSelectedMessage(message);
    setSelectedLayout(layout);
    setSelectedSenderName(senderName);
  };

  const dismissOverlay = () => {
    setSelectedMessage(null);
    setSelectedLayout(null);
    setSelectedSenderName(undefined);
  };

  // ─── Full emoji picker ────────────────────────────────────────────────────────

  const [emojiPickerFor, setEmojiPickerFor] = React.useState<Message | null>(null);

  const handleOpenEmojiPicker = () => {
    const msg = selectedMessage;
    dismissOverlay();
    setTimeout(() => setEmojiPickerFor(msg), 60);
  };

  // ─── Reactions breakdown sheet ────────────────────────────────────────────────

  const [reactionsMessage, setReactionsMessage] = React.useState<Message | null>(null);

  // ─── Reply ──────────────────────────────────────────────────────────────────

  const [replyTo, setReplyTo] = React.useState<Message | null>(null);

  const handleSwipeReply = React.useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  const handleReply = () => {
    if (!selectedMessage) return;
    setReplyTo(selectedMessage);
    dismissOverlay();
  };

  // ─── Forward ────────────────────────────────────────────────────────────────
  // TODO(ui): open a chat-picker sheet, then call
  // chatsApi.forwardMessage(chat.id, message.id, targetChatId). Endpoint + API
  // client are ready; only the picker UI is outstanding.
  const handleForward = () => {
    dismissOverlay();
  };

  // ─── Copy ───────────────────────────────────────────────────────────────────

  const handleCopy = () => {
    if (selectedMessage) void Clipboard.setStringAsync(htmlToPlainText(selectedMessage.content));
    dismissOverlay();
  };

  // ─── Pin ────────────────────────────────────────────────────────────────────

  const handlePin = () => {
    if (!selectedMessage || !chatId) return;
    const target = selectedMessage;
    const willPin = !target.is_pinned;
    setMessages((prev) =>
      prev.map((m) => (m.id === target.id ? { ...m, is_pinned: willPin } : m))
    );
    const call = willPin
      ? chatsApi.pinMessage(chatId, target.id)
      : chatsApi.unpinMessage(chatId, target.id);
    call.catch(() => {
      // Revert on failure.
      setMessages((prev) =>
        prev.map((m) => (m.id === target.id ? { ...m, is_pinned: !willPin } : m))
      );
    });
    dismissOverlay();
  };

  // ─── React ──────────────────────────────────────────────────────────────────

  // One reaction per person: optimistic local update mirrors the backend, which
  // also broadcasts a `reaction` event that reconciles idempotently.
  const handleReact = (messageId: string, emoji: string) => {
    if (!chatId) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions ?? {}) };
        const alreadyReacted = reactions[emoji]?.includes(currentUserId) ?? false;
        for (const e of Object.keys(reactions)) {
          const filtered = reactions[e].filter((id) => id !== currentUserId);
          if (filtered.length) reactions[e] = filtered;
          else delete reactions[e];
        }
        if (!alreadyReacted) {
          reactions[emoji] = [...(reactions[emoji] ?? []), currentUserId];
        }
        return { ...m, reactions };
      })
    );
    chatsApi.addReaction(chatId, messageId, emoji).catch(() => {});
  };

  // ─── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async (text: string, attachments: Attachment[]) => {
    if (!chatId) return;

    // Upload binary attachments (image/file) to get durable URLs; pass refs and
    // text/link attachments through untouched.
    const msgAttachments: MessageAttachment[] = [];
    for (const a of attachments) {
      if ((a.kind === 'image' || a.kind === 'file') && a.uri) {
        try {
          const up = await uploadFile({ uri: a.uri, name: a.name, mimeType: a.mimeType });
          msgAttachments.push({
            kind: a.kind,
            name: up.name ?? a.name,
            uri: up.url,
            mimeType: up.mimeType ?? a.mimeType,
            size: up.size ?? a.size,
            width: a.width,
            height: a.height,
          });
        } catch (err) {
          // Surface the failure instead of silently sending an empty message.
          console.warn(`Attachment upload failed (${a.name}):`, err);
        }
      } else {
        msgAttachments.push({
          kind: a.kind,
          name: a.name,
          uri: a.uri,
          mimeType: a.mimeType,
          size: a.size,
          width: a.width,
          height: a.height,
          refId: a.refId,
          subtitle: a.subtitle,
          text: a.text,
        });
      }
    }

    const url = extractFirstUrl(htmlToPlainText(text));
    if (url && !msgAttachments.some((a) => a.kind === 'link')) {
      msgAttachments.push(mockLinkPreview(url));
    }

    const tempId = `local_${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      type: 'message',
      sender_id: currentUserId,
      sender_type: 'user',
      sender_name: myName,
      content: text,
      ...(msgAttachments.length ? { attachments: msgAttachments } : {}),
      timestamp: Date.now(),
      ...(replyTo
        ? {
            reply_to_id: replyTo.id,
            reply_to: {
              id: replyTo.id,
              sender_id: replyTo.sender_id,
              sender_name: replyTo.sender_name,
              content: replyTo.content,
            },
          }
        : {}),
    };
    setMessages((prev) => [...prev, optimistic]);
    const replyId = replyTo?.id;
    setReplyTo(null);

    try {
      const saved = await chatsApi.sendMessage(chatId, text, replyId, msgAttachments);
      // Replace the optimistic message; dedupe if the WS echo already landed it.
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return withoutTemp.some((m) => m.id === saved.id) ? withoutTemp : [...withoutTemp, saved];
      });
    } catch {
      // Mark the optimistic message as failed by leaving it; a retry UI can come later.
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!chat) {
    return <NoChatScreen onPressMenu={openSidebar} />;
  }

  return (
    <View className="bg-background flex-1">
      <ChatHeader
        chat={chat}
        onPressMenu={openSidebar}
        onPressTitle={() =>
          router.push({ pathname: '/chat-details', params: { chatId: chat.id } })
        }
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <MessageList
          key={chat.id}
          messages={messages}
          currentActorId={currentUserId}
          participants={chat.participants}
          onReact={handleReact}
          onLongPress={handleLongPress}
          onSwipeReply={handleSwipeReply}
          onShowReactions={setReactionsMessage}
          onOpenSidebar={openSidebar}
        />
        <MessageComposer
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          participants={chat.participants}
        />
      </KeyboardAvoidingView>

      {/* Long-press action overlay */}
      {selectedMessage && selectedLayout && (
        <MessageActionOverlay
          message={selectedMessage}
          layout={selectedLayout}
          isMine={selectedMessage.sender_id === currentUserId}
          currentActorId={currentUserId}
          onDismiss={dismissOverlay}
          onReact={(emoji) => handleReact(selectedMessage.id, emoji)}
          onReply={handleReply}
          onForward={handleForward}
          onCopy={handleCopy}
          onPin={handlePin}
          onOpenEmojiPicker={handleOpenEmojiPicker}
          senderName={selectedSenderName}
        />
      )}

      {/* Reactions breakdown sheet */}
      <ReactionsSheet
        visible={reactionsMessage !== null}
        reactions={reactionsMessage?.reactions ?? null}
        participants={chat.participants}
        currentActorId={currentUserId}
        onClose={() => setReactionsMessage(null)}
      />

      {/* Full emoji picker (reaction) */}
      <EmojiDrawer
        visible={emojiPickerFor !== null}
        onClose={() => setEmojiPickerFor(null)}
        onSelect={(emoji) => {
          if (emojiPickerFor) handleReact(emojiPickerFor.id, emoji);
          setEmojiPickerFor(null);
        }}
      />
    </View>
  );
}

/**
 * Shown when no chat is selected — most commonly right after signing in to an
 * account that has no conversations yet. Always renders a menu button so the
 * sidebar (new chat / upload data) stays reachable instead of a dead-end blank
 * screen.
 */
function NoChatScreen({ onPressMenu }: { onPressMenu: () => void }) {
  const insets = useSafeAreaInsets();
  const { loading, error } = useChats();

  return (
    <View className="bg-background flex-1">
      <View style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-3 py-3 pt-0">
          <Pressable
            onPress={onPressMenu}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center">
            <Icon name="menu" size={24} />
          </Pressable>
        </View>
      </View>

      <View className="flex-1 items-center justify-center gap-3 px-8">
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text className="text-foreground text-center text-xl">
              {error ? 'Couldn’t load your chats' : 'No conversations yet'}
            </Text>
            <Text className="text-muted-foreground text-center text-base">
              {error ?? 'Open the menu to start a new chat or upload data.'}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}
