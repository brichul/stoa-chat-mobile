import { useRouter } from 'expo-router';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import type { Message } from '@/api/types';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageComposer, type Attachment } from '@/components/chat/message-composer';
import { MessageList } from '@/components/chat/message-list';
import { useWorkspace } from '@/contexts/workspace-context';
import { CURRENT_USER_ID, MOCK_CHATS, MOCK_MESSAGES } from '@/data/mock';

/**
 * The primary messaging surface (iMessage / Slack style). Header with the chat
 * name (tap to open details), message bubbles, and an auto-growing composer.
 */
export function ChatScreen() {
  const { activeChatId, openSidebar } = useWorkspace();
  const router = useRouter();

  const chat = React.useMemo(
    () => MOCK_CHATS.find((c) => c.id === activeChatId) ?? MOCK_CHATS[0],
    [activeChatId]
  );

  const [messages, setMessages] = React.useState<Message[]>([]);
  React.useEffect(() => {
    setMessages(MOCK_MESSAGES[chat.id] ?? []);
  }, [chat.id]);

  const isGroup = chat.participants.filter((p) => p.permission === 'write').length > 2;

  const handleSend = (text: string, attachments: Attachment[]) => {
    const content = attachments.length
      ? `${text}${text ? '\n' : ''}${attachments.map((a) => `📎 ${a.name}`).join('\n')}`
      : text;
    setMessages((prev) => [
      ...prev,
      {
        id: `local_${Date.now()}`,
        type: 'message',
        sender_id: CURRENT_USER_ID,
        sender_type: 'user',
        sender_name: 'You',
        content,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <View className="bg-background flex-1">
      <ChatHeader
        title={chat.name ?? 'Untitled chat'}
        subtitle={`${chat.participants.length} participants`}
        onPressMenu={openSidebar}
        onPressTitle={() => router.push({ pathname: '/chat-details', params: { chatId: chat.id } })}
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <MessageList messages={messages} currentActorId={CURRENT_USER_ID} showSenders={isGroup} />
        <MessageComposer onSend={handleSend} />
      </KeyboardAvoidingView>
    </View>
  );
}
