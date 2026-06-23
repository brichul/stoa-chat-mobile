import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import type { Message } from '@/api/types';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageComposer, type Attachment } from '@/components/chat/message-composer';
import { MessageList } from '@/components/chat/message-list';
import { useWorkspace } from '@/contexts/workspace-context';
import { CURRENT_USER_ID, MOCK_CHATS, MOCK_MESSAGES } from '@/data/mock';

import {
  MessageActionOverlay,
  type MessageLayout,
} from './message-action-overlay';

export function ChatScreen() {
  const { activeChat, openSidebar } = useWorkspace();
  const router = useRouter();

  const chat = activeChat ?? MOCK_CHATS[0];

  const [messages, setMessages] = React.useState<Message[]>([]);
  React.useEffect(() => {
    setMessages(MOCK_MESSAGES[chat.id] ?? []);
  }, [chat.id]);

  // ─── Selection overlay ──────────────────────────────────────────────────────

  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const [selectedLayout, setSelectedLayout] = React.useState<MessageLayout | null>(null);

  const handleLongPress = (message: Message, layout: MessageLayout) => {
    setSelectedMessage(message);
    setSelectedLayout(layout);
  };

  const dismissOverlay = () => {
    setSelectedMessage(null);
    setSelectedLayout(null);
  };

  // ─── Reply ──────────────────────────────────────────────────────────────────

  const [replyTo, setReplyTo] = React.useState<Message | null>(null);

  // Quick reply from swipe gesture (no overlay needed)
  const handleSwipeReply = React.useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  // Reply from long-press overlay
  const handleReply = () => {
    if (!selectedMessage) return;
    setReplyTo(selectedMessage);
    dismissOverlay();
  };

  // ─── Forward ────────────────────────────────────────────────────────────────
  // TODO: open a chat-picker sheet and call forwardMessage(chat.id, message.id, targetChatId)

  const handleForward = () => {
    dismissOverlay();
  };

  // ─── Copy ───────────────────────────────────────────────────────────────────

  const handleCopy = () => {
    if (selectedMessage) void Clipboard.setStringAsync(selectedMessage.content);
    dismissOverlay();
  };

  // ─── Pin ────────────────────────────────────────────────────────────────────
  // TODO: call pinMessage API once endpoint exists

  const handlePin = () => {
    if (!selectedMessage) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === selectedMessage.id ? { ...m, is_pinned: !m.is_pinned } : m
      )
    );
    dismissOverlay();
  };

  // ─── React ──────────────────────────────────────────────────────────────────

  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions ?? {}) };
        const current = reactions[emoji] ?? [];
        if (current.includes(CURRENT_USER_ID)) {
          const next = current.filter((id) => id !== CURRENT_USER_ID);
          if (next.length === 0) delete reactions[emoji];
          else reactions[emoji] = next;
        } else {
          reactions[emoji] = [...current, CURRENT_USER_ID];
        }
        return { ...m, reactions };
      })
    );
    // TODO: wire to addReaction(chat.id, messageId, emoji)
  };

  // ─── Send ───────────────────────────────────────────────────────────────────

  const handleSend = (text: string, attachments: Attachment[]) => {
    const content = attachments.length
      ? `${text}${text ? '\n' : ''}${attachments.map((a) => `📎 ${a.name}`).join('\n')}`
      : text;

    const newMessage: Message = {
      id: `local_${Date.now()}`,
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content,
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

    setMessages((prev) => [...prev, newMessage]);
    setReplyTo(null);
    // TODO: call sendMessage(chat.id, content, replyTo?.id)
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

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
          messages={messages}
          currentActorId={CURRENT_USER_ID}
          participants={chat.participants}
          onReact={handleReact}
          onLongPress={handleLongPress}
          onSwipeReply={handleSwipeReply}
          onOpenSidebar={openSidebar}
        />
        <MessageComposer
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </KeyboardAvoidingView>

      {/* Long-press action overlay */}
      {selectedMessage && selectedLayout && (
        <MessageActionOverlay
          message={selectedMessage}
          layout={selectedLayout}
          isMine={selectedMessage.sender_id === CURRENT_USER_ID}
          currentActorId={CURRENT_USER_ID}
          onDismiss={dismissOverlay}
          onReact={(emoji) => handleReact(selectedMessage.id, emoji)}
          onReply={handleReply}
          onForward={handleForward}
          onCopy={handleCopy}
          onPin={handlePin}
        />
      )}
    </View>
  );
}
