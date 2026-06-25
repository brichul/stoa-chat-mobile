import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeMentionEvent,
  type OnChangeTextEvent,
} from 'react-native-enriched-html';
import type { NativeSyntheticEvent } from 'react-native';

import type { Message, Participant } from '@/api/types';
import { Icon } from '@/components/icons/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemTitle,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Text } from '@/components/ui/text';
import { Colors, Fonts, Palette } from '@/constants/theme';
import {
  buildDirectory,
  htmlToPlainText,
  MENTION_INDICATOR,
  type MentionRef,
  searchDirectory,
} from '@/lib/mentions';
import { cn } from '@/lib/utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AttachPickerSheet, type AttachPickerMode } from './attach-picker-sheet';
import { AttachmentItem } from './message-attachments';
import { MentionSuggestions } from './mention-suggestions';
import { MENTION_INPUT_HTML_STYLE } from './mention-views';

export type AttachmentKind = 'file' | 'image' | 'node' | 'vault' | 'text';

export interface Attachment {
  kind: AttachmentKind;
  /** Display label: file/image name, node title, or vault name. */
  name: string;
  /** Local URI for file/image attachments. */
  uri?: string;
  mimeType?: string;
  /** Byte size for files, when known. */
  size?: number;
  /** Intrinsic image dimensions, used to size the preview. */
  width?: number;
  height?: number;
  /** Backend id for node/vault references. */
  refId?: string;
  /** Secondary label, e.g. vault type or node status. */
  subtitle?: string;
  /** Full body for `text` attachments (long pasted text). */
  text?: string;
}

export interface MessageComposerProps {
  /** `text` is the enriched HTML of the message (empty when only attachments). */
  onSend: (text: string, attachments: Attachment[]) => void;
  placeholder?: string;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  /** Chat participants, ranked first in the @-mention directory. */
  participants?: Participant[];
}

export function MessageComposer({
  onSend,
  placeholder = 'Message',
  replyTo,
  onCancelReply,
  participants = [],
}: MessageComposerProps) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const inputRef = React.useRef<EnrichedTextInputInstance>(null);

  // The editor is uncontrolled (native); we mirror only the plain text for
  // enable/placeholder logic and read the HTML on demand via getHTML().
  const [plainText, setPlainText] = React.useState('');
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [pickerMode, setPickerMode] = React.useState<AttachPickerMode>(null);

  // Active @-mention query (null when no mention is being edited).
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);

  const insets = useSafeAreaInsets();

  const directory = React.useMemo(() => buildDirectory(participants), [participants]);
  const suggestions = React.useMemo(
    () => (mentionQuery == null ? null : searchDirectory(directory, mentionQuery)),
    [directory, mentionQuery]
  );

  const canSend = plainText.trim().length > 0 || attachments.length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    const hasText = plainText.trim().length > 0;
    const html = hasText ? (await inputRef.current?.getHTML()) ?? '' : '';
    onSend(html, attachments);
    inputRef.current?.setValue('');
    setPlainText('');
    setAttachments([]);
    setMentionQuery(null);
  };

  const addAttachments = (next: Attachment[]) => {
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  };

  // A picker selection finalizes the in-progress mention as a chip. setMention
  // replaces the typed indicator with `text` verbatim (it does not re-add the
  // "@"), so we include it to get a "@Label" chip.
  const insertMention = (ref: MentionRef) => {
    inputRef.current?.setMention(MENTION_INDICATOR, `${MENTION_INDICATOR}${ref.label}`, {
      kind: ref.kind,
      raw: ref.raw,
    });
    setMentionQuery(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleAttachFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    addAttachments(
      res.assets.map((a) => ({ kind: 'file', name: a.name, uri: a.uri, mimeType: a.mimeType, size: a.size }))
    );
  };

  const handleAttachImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    // Defaults to images; multiple selection where the platform supports it.
    const res = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true });
    if (res.canceled) return;
    addAttachments(
      res.assets.map((a, i) => ({
        kind: 'image',
        name: a.fileName ?? `image-${i + 1}.jpg`,
        uri: a.uri,
        mimeType: a.mimeType,
        width: a.width,
        height: a.height,
      }))
    );
  };

  return (
    <View
      className="border-border bg-background border-t-hairline px-3 pb-2 pt-2"
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
              {htmlToPlainText(replyTo.content)}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={10}>
            <Icon name="close" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>
      )}

      {attachments.length > 0 ? (
        <View className="mb-2 mt-1.5 flex-row flex-wrap gap-3">
          {attachments.map((a, i) => (
            <View key={`${a.refId ?? a.uri}-${i}`} style={{ position: 'relative' }}>
              <AttachmentItem attachment={a} compact />
              <Pressable
                onPress={() => setAttachments((p) => p.filter((_, idx) => idx !== i))}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.text,
                }}>
                <Icon name="close" size={12} color={theme.background} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {/* @-mention autocomplete, floating above the input */}
      {suggestions && (
        <MentionSuggestions directory={suggestions} onSelect={insertMention} />
      )}

      <View className="flex-row items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Pressable hitSlop={8} className="h-12 w-12 items-center bg-secondary justify-center border-2 border-solid border-[#131211]">
              <Icon name="add" size={24} color={theme.textSecondary} />
            </Pressable>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuLabel>Attach</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onPress={handleAttachImage}>
              <Icon name="image" size={16} color={theme.textSecondary} />
              <DropdownMenuItemTitle>Photo</DropdownMenuItemTitle>
            </DropdownMenuItem>
            <DropdownMenuItem onPress={handleAttachFile}>
              <Icon name="insert-drive-file" size={16} color={theme.textSecondary} />
              <DropdownMenuItemTitle>File</DropdownMenuItemTitle>
            </DropdownMenuItem>
            <DropdownMenuItem onPress={() => setPickerMode('node')}>
              <Icon name="data-object" size={16} color={theme.textSecondary} />
              <DropdownMenuItemTitle>Node</DropdownMenuItemTitle>
            </DropdownMenuItem>
            <DropdownMenuItem onPress={() => setPickerMode('vault')}>
              <Icon name="data-array" size={16} color={theme.textSecondary} />
              <DropdownMenuItemTitle>Vault</DropdownMenuItemTitle>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <EnrichedTextInput
          ref={inputRef}
          mentionIndicators={[MENTION_INDICATOR]}
          // No markdown-style shortcuts (e.g. "- " → list); messages stay plain
          // text + mentions + links. Link auto-detection stays on (default
          // linkRegex) so typed URLs become tappable <a> chips.
          textShortcuts={[]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          cursorColor={Palette.accentStart}
          selectionColor={Palette.accentStart}
          htmlStyle={MENTION_INPUT_HTML_STYLE}
          onChangeText={(e: NativeSyntheticEvent<OnChangeTextEvent>) =>
            setPlainText(e.nativeEvent.value)
          }
          onStartMention={() => setMentionQuery('')}
          onChangeMention={(e: OnChangeMentionEvent) => setMentionQuery(e.text)}
          onEndMention={() => setMentionQuery(null)}
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 140,
            borderWidth: 2,
            borderColor: '#131211',
            paddingHorizontal: 12,
            paddingVertical: 12,
            color: theme.text,
            fontFamily: Fonts.sans,
            fontSize: 16,
            lineHeight: 20,
          }}
        />

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

      <AttachPickerSheet
        mode={pickerMode}
        onClose={() => setPickerMode(null)}
        onSelect={(ref) =>
          addAttachments([{ kind: ref.kind, name: ref.name, refId: ref.id, subtitle: ref.subtitle }])
        }
      />
    </View>
  );
}
