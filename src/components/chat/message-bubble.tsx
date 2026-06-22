import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import type { Message } from '@/api/types';
import { Text } from '@/components/ui/text';
import { AccentGradient, Palette } from '@/constants/theme';
import { cn } from '@/lib/utils';

export interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  /** Show the sender name above the bubble (group chats, others' messages). */
  showSender?: boolean;
}

export function MessageBubble({ message, isMine, showSender }: MessageBubbleProps) {
  if (message.type === 'system') {
    return (
      <View className="my-2 items-center px-4">
        <Text className="text-muted-foreground text-xs">{message.content}</Text>
      </View>
    );
  }

  if (isMine) {
    // User messages use the accent gradient (STYLING.md: #98514B -> #F9B764).
    return (
      <View className="my-0.5 w-full items-end px-3">
        <View className="max-w-[80%] overflow-hidden rounded-2xl rounded-br-md">
          <LinearGradient
            colors={AccentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text className="text-base leading-5" style={{ color: Palette.white }}>
              {message.content}
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View className="my-0.5 w-full items-start px-3">
      {showSender ? (
        <Text className="text-muted-foreground mb-0.5 ml-3 text-xs">{message.sender_name}</Text>
      ) : null}
      <View className="bg-secondary max-w-[80%] rounded-2xl rounded-bl-md px-3.5 py-2">
        <Text className="text-foreground text-base leading-5">{message.content}</Text>
      </View>
    </View>
  );
}
