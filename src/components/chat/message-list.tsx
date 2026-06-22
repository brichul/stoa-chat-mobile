import * as React from 'react';
import { FlatList, View } from 'react-native';

import type { Message } from '@/api/types';
import { Text } from '@/components/ui/text';

import { MessageBubble } from './message-bubble';

export interface MessageListProps {
  messages: Message[];
  currentActorId: string;
  /** When true, render sender names (group conversations). */
  showSenders?: boolean;
}

export function MessageList({ messages, currentActorId, showSenders }: MessageListProps) {
  const ref = React.useRef<FlatList<Message>>(null);

  if (messages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-muted-foreground text-center text-sm">
          No messages yet. Say hello to get started.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={ref}
      className="flex-1"
      data={messages}
      keyExtractor={(m) => m.id}
      contentContainerClassName="py-3"
      onContentSizeChange={() => ref.current?.scrollToEnd({ animated: false })}
      renderItem={({ item, index }) => {
        const prev = messages[index - 1];
        const isMine = item.sender_id === currentActorId;
        const showSender = !!showSenders && !isMine && prev?.sender_id !== item.sender_id;
        return <MessageBubble message={item} isMine={isMine} showSender={showSender} />;
      }}
    />
  );
}
