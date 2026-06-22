import * as DocumentPicker from 'expo-document-picker';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Icon } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { cn } from '@/lib/utils';

export interface Attachment {
  name: string;
  uri: string;
  mimeType?: string;
}

export interface MessageComposerProps {
  onSend: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
}

const LINE_HEIGHT = 20;
const VERTICAL_PADDING = 18; // top + bottom inside the input
const MIN_HEIGHT = LINE_HEIGHT + VERTICAL_PADDING;
const MAX_HEIGHT = LINE_HEIGHT * 5 + VERTICAL_PADDING; // grow up to 5 lines

export function MessageComposer({ onSend, placeholder = 'Message' }: MessageComposerProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [text, setText] = React.useState('');
  const [height, setHeight] = React.useState(MIN_HEIGHT);
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);

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
    <View className="border-border bg-background border-t-hairline px-3 pb-2 pt-2">
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
        <Pressable onPress={handleAttach} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Icon name="attach-file" size={22} color={theme.textSecondary} />
        </Pressable>

        <View className="border-input bg-secondary/40 flex-1 justify-center rounded-2xl border-hairline px-3">
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
            'h-10 w-10 items-center justify-center rounded-full',
            canSend ? 'bg-primary' : 'bg-secondary'
          )}>
          <Icon name="arrow-upward" size={22} color={canSend ? theme.background : theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
