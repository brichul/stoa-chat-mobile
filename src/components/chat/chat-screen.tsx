import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import type { Chat, Message, MessageAttachment } from '@/api/types';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageComposer, type Attachment } from '@/components/chat/message-composer';
import { MessageList } from '@/components/chat/message-list';
import { ReactionsSheet } from '@/components/chat/reactions-sheet';
import { useWorkspace } from '@/contexts/workspace-context';
import { CURRENT_USER_ID, MOCK_CHATS, MOCK_MESSAGES } from '@/data/mock';
import { extractFirstUrl, mockLinkPreview } from '@/lib/link-preview';
import { extractMentionsFromHtml, htmlToPlainText, type MentionRef } from '@/lib/mentions';

import {
  MessageActionOverlay,
  type MessageLayout,
} from './message-action-overlay';

export function ChatScreen() {
  const { activeChat, openSidebar } = useWorkspace();
  const router = useRouter();

  // Local copy of the chat so @-mentions can attach nodes/vaults and add
  // participants in-place. Re-syncs when the active chat changes.
  const [chat, setChat] = React.useState<Chat>(activeChat ?? MOCK_CHATS[0]);
  React.useEffect(() => {
    setChat(activeChat ?? MOCK_CHATS[0]);
  }, [activeChat]);

  const [messages, setMessages] = React.useState<Message[]>([]);
  React.useEffect(() => {
    setMessages(MOCK_MESSAGES[chat.id] ?? []);
  }, [chat.id]);

  // ─── Selection overlay ──────────────────────────────────────────────────────

  const [selectedMessage, setSelectedMessage] = React.useState<Message | null>(null);
  const [selectedLayout, setSelectedLayout] = React.useState<MessageLayout | null>(null);
  // The exact sender name the bubble rendered (undefined when it showed none),
  // so the overlay replica mirrors the in-list bubble precisely.
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

  // ─── Reactions breakdown sheet ────────────────────────────────────────────────

  const [reactionsMessage, setReactionsMessage] = React.useState<Message | null>(null);

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
    if (selectedMessage) void Clipboard.setStringAsync(htmlToPlainText(selectedMessage.content));
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

  // ─── Mention side effects ─────────────────────────────────────────────────────
  //
  // Referencing something with @ attaches it to the chat: a user is added as a
  // participant, a node/vault is attached. Applied to local chat state for now;
  // each branch marks where the backend call slots in.

  const applyMentionEffects = (refs: MentionRef[]) => {
    if (!refs.length) return;
    setChat((prev) => {
      let participants = prev.participants;
      let attachedNodes = prev.attached_nodes ?? [];
      let nodesDetail = prev.attached_nodes_detail ?? [];
      let attachedVaults = prev.attached_vaults ?? [];
      let vaultsDetail = prev.attached_vaults_detail ?? [];
      let changed = false;

      for (const ref of refs) {
        if (ref.kind === 'user') {
          if (participants.some((p) => p.id === ref.id)) continue;
          participants = [
            ...participants,
            {
              id: ref.id,
              type: 'user',
              permission: 'write',
              display_name: ref.label,
              username: ref.inserted,
              avatar_url: ref.avatar_url ?? null,
              last_read_message_id: null,
            },
          ];
          changed = true;
          // TODO: POST /v1/chats/${prev.id}/participants { user_id: ref.id }
        } else if (ref.kind === 'node') {
          if (attachedNodes.includes(ref.id)) continue;
          attachedNodes = [...attachedNodes, ref.id];
          nodesDetail = [...nodesDetail, { id: ref.id, title: ref.label }];
          changed = true;
          // TODO: POST /v1/chats/${prev.id}/nodes { node_id: ref.id }
        } else {
          if (attachedVaults.includes(ref.id)) continue;
          attachedVaults = [...attachedVaults, ref.id];
          vaultsDetail = [...vaultsDetail, { id: ref.id, name: ref.label }];
          changed = true;
          // TODO: POST /v1/chats/${prev.id}/vaults { vault_id: ref.id }
        }
      }

      if (!changed) return prev;
      return {
        ...prev,
        participants,
        attached_nodes: attachedNodes,
        attached_nodes_detail: nodesDetail,
        attached_vaults: attachedVaults,
        attached_vaults_detail: vaultsDetail,
      };
    });
  };

  // ─── Send ───────────────────────────────────────────────────────────────────

  const handleSend = (text: string, attachments: Attachment[]) => {
    const msgAttachments: MessageAttachment[] = attachments.map((a) => ({
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
    }));

    // Auto-detect a URL in the message and render it as a link preview card.
    // `text` is enriched HTML, so flatten it first or the URL grabs trailing tags.
    const url = extractFirstUrl(htmlToPlainText(text));
    if (url && !msgAttachments.some((a) => a.kind === 'link')) {
      msgAttachments.push(mockLinkPreview(url));
    }

    const newMessage: Message = {
      id: `local_${Date.now()}`,
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
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

    setMessages((prev) => [...prev, newMessage]);
    applyMentionEffects(extractMentionsFromHtml(text));
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
          isMine={selectedMessage.sender_id === CURRENT_USER_ID}
          currentActorId={CURRENT_USER_ID}
          onDismiss={dismissOverlay}
          onReact={(emoji) => handleReact(selectedMessage.id, emoji)}
          onReply={handleReply}
          onForward={handleForward}
          onCopy={handleCopy}
          onPin={handlePin}
          senderName={selectedSenderName}
        />
      )}

      {/* Reactions breakdown sheet */}
      <ReactionsSheet
        visible={reactionsMessage !== null}
        reactions={reactionsMessage?.reactions ?? null}
        participants={chat.participants}
        currentActorId={CURRENT_USER_ID}
        onClose={() => setReactionsMessage(null)}
      />
    </View>
  );
}
