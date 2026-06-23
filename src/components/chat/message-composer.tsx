import * as DocumentPicker from 'expo-document-picker';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';

import type { Message } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface Attachment {
  name: string;
  uri: string;
  mimeType?: string;
}

export interface MessageComposerProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

const LINE_HEIGHT = 20;
const VERTICAL_PADDING = 18; // top + bottom inside the input
const MIN_HEIGHT = LINE_HEIGHT + VERTICAL_PADDING;
const MAX_HEIGHT = LINE_HEIGHT * 5 + VERTICAL_PADDING; // grow up to 5 lines

export function MessageComposer({
  onSend,
  placeholder = 'Message',
  replyTo,
  onCancelReply,
}: MessageComposerProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [text, setText] = React.useState('');
  const [height, setHeight] = React.useState(MIN_HEIGHT);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

  const insets = useSafeAreaInsets();

  const canSend = text.trim().length > 0 || attachments.length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend(text.trim(), attachments);
    setText('');
    setAttachments([]);
    setHeight(MIN_HEIGHT);
  };

  const handleAttach = async () => {
    const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    setAttachments((prev) => [
      ...prev,
      ...res.assets.map((a) => ({ name: a.name, uri: a.uri, mimeType: a.mimeType })),
    ]);
  };

  return (
    <View className="border-border bg-background border-t-hairline px-3 pb-2 pt-2"
    style={{ paddingBottom: insets.bottom }}>
      {/* Reply preview bar */}
      {replyTo && (
        <View className="border-border mb-2 flex-row items-center gap-2 border-b pb-2">
          <View
            style={{ width: 2, borderRadius: 2, alignSelf: 'stretch', backgroundColor: '#98514B' }}
          />
          <View className="flex-1">
            <Text className="text-[11px] font-semibold" style={{ color: '#98514B' }}>
              {replyTo.sender_name}
            </Text>
            <Text className="text-muted-foreground text-[12px]" numberOfLines={1}>
              {replyTo.content}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={10}>
            <Icon name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {attachments.length > 0 ? (
        <View className="mb-2 flex-row flex-wrap gap-2">
          {attachments.map((a, i) => (
            <View key={`${a.uri}-${i}`} className="bg-secondary flex-row items-center gap-1 rounded-lg px-2 py-1">
              <Icon name="insert-drive-file" size={14} color={theme.textSecondary} />
              <Text className="text-foreground max-w-[120px] text-xs" numberOfLines={1}>
                {a.name}
              </Text>
              <Pressable onPress={() => setAttachments((p) => p.filter((_, idx) => idx !== i))} hitSlop={8}>
                <Icon name="close" size={14} color={theme.textSecondary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-end gap-2">
        <Pressable onPress={handleAttach} hitSlop={8} className="h-12 w-12 items-center bg-secondary justify-center border-2 border-solid border-[#131211]">
          <Icon name="attach-file" size={22} color={theme.textSecondary} />
        </Pressable>

        <View className="h-12 flex-1 justify-center border-2 border-solid border-[#131211] px-3">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline
            style={{ height, lineHeight: LINE_HEIGHT, color: theme.text, paddingVertical: VERTICAL_PADDING / 2 }}
            onContentSizeChange={(e) =>
              setHeight(Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, e.nativeEvent.contentSize.height)))
            }
            scrollEnabled={height >= MAX_HEIGHT}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className={cn(
            'h-12 w-12 items-center justify-center border-2 border-solid border-[#131211]',
            canSend ? 'bg-primary' : 'bg-primary'
          )}>
          <Icon name="arrow-upward" size={22} color={canSend ? theme.background : theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
