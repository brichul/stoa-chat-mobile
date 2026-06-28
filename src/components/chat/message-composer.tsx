import * as DocumentPicker from 'expo-document-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  EnrichedTextInput,
  type EnrichedTextInputInstance,
  type OnChangeMentionEvent,
  type OnChangeTextEvent,
} from 'react-native-enriched-html';
import type { NativeSyntheticEvent } from 'react-native';

import { ANIM_FAST } from '@/constants/animation';

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
import { listBots } from '@/api/bots';
import { listNodeDirectory } from '@/api/nodes';
import { listUsers } from '@/api/users';
import { listVaults } from '@/api/vaults';
import { Text } from '@/components/ui/text';
import { Colors, Fonts, Palette } from '@/constants/theme';
import {
  buildDirectory,
  htmlToPlainText,
  MENTION_INDICATOR,
  type MentionDirectorySource,
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

// A single change that inserts at least this many characters is treated as a
// paste and lifted out into a `text` attachment rather than flooding the input.
const PASTE_AS_ATTACHMENT_THRESHOLD = 300;

/**
 * The chunk inserted between `prev` and `next`, found by trimming the shared
 * prefix and suffix. Handles a paste at any cursor position.
 */
function insertedChunk(prev: string, next: string): string {
  let start = 0;
  const minLen = Math.min(prev.length, next.length);
  while (start < minLen && prev[start] === next[start]) start++;
  let endPrev = prev.length - 1;
  let endNext = next.length - 1;
  while (endNext >= start && endPrev >= start && prev[endPrev] === next[endNext]) {
    endPrev--;
    endNext--;
  }
  return next.slice(start, endNext + 1);
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

  // Paste-as-attachment bookkeeping. `prevPlainRef` is the plain text before the
  // latest change (to diff for pastes); `lastHtmlRef` is a recent HTML snapshot
  // we can revert to — restoring it preserves any mention/link chips a plain
  // revert would flatten. The snapshot refresh is debounced to avoid parsing
  // HTML on every keystroke.
  const prevPlainRef = React.useRef('');
  const lastHtmlRef = React.useRef('');
  const htmlRefreshTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active @-mention query (null when no mention is being edited).
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);

  const insets = useSafeAreaInsets();

  React.useEffect(
    () => () => {
      if (htmlRefreshTimer.current) clearTimeout(htmlRefreshTimer.current);
    },
    []
  );

  // Fetch the tenant directory (people / bots / nodes / vaults) once for @-mentions.
  const [dirSource, setDirSource] = React.useState<MentionDirectorySource | null>(null);
  React.useEffect(() => {
    let active = true;
    Promise.all([listUsers(), listBots(), listNodeDirectory(), listVaults()])
      .then(([users, bots, nodes, vaults]) => {
        if (active) setDirSource({ users, bots, nodes, vaults });
      })
      .catch(() => {
        /* mentions just stay limited to chat participants on failure */
      });
    return () => {
      active = false;
    };
  }, []);

  const directory = React.useMemo(
    () => buildDirectory(participants, dirSource ?? undefined),
    [participants, dirSource]
  );
  const suggestions = React.useMemo(
    () => (mentionQuery == null ? null : searchDirectory(directory, mentionQuery)),
    [directory, mentionQuery]
  );

  const canSend = plainText.trim().length > 0 || attachments.length > 0;

  // ── Compose bubble: a black bubble grows from the bottom-left to fill the
  //    input while the user is writing (text flips to white over it).
  const composing = plainText.trim().length > 0;
  const fill = useSharedValue(0);
  React.useEffect(() => {
    fill.value = withTiming(composing ? 1 : 0, ANIM_FAST);
  }, [composing, fill]);
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: fill.value }, { scaleY: fill.value }],
  }));

  const handleSend = async () => {
    if (!canSend) return;
    const hasText = plainText.trim().length > 0;
    const html = hasText ? (await inputRef.current?.getHTML()) ?? '' : '';
    onSend(html, attachments);
    resetInput();
    setAttachments([]);
    setMentionQuery(null);
  };

  const addAttachments = (next: Attachment[]) => {
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  };

  // Debounced HTML snapshot so a paste can revert to pre-paste content (chips
  // intact) without parsing HTML on every keystroke.
  const scheduleHtmlSnapshot = () => {
    if (htmlRefreshTimer.current) clearTimeout(htmlRefreshTimer.current);
    htmlRefreshTimer.current = setTimeout(async () => {
      lastHtmlRef.current = (await inputRef.current?.getHTML()) ?? '';
    }, 150);
  };

  const resetInput = () => {
    inputRef.current?.setValue('');
    prevPlainRef.current = '';
    lastHtmlRef.current = '';
    setPlainText('');
  };

  // Detect a large single insertion (a paste) and lift it into a `text`
  // attachment, reverting the editor to its pre-paste HTML snapshot.
  const handleChangeText = (value: string) => {
    const prev = prevPlainRef.current;
    if (value.length - prev.length >= PASTE_AS_ATTACHMENT_THRESHOLD) {
      const chunk = insertedChunk(prev, value);
      if (chunk.length >= PASTE_AS_ATTACHMENT_THRESHOLD) {
        addAttachments([{ kind: 'text', name: 'Pasted text', text: chunk.trim() }]);
        const beforeHtml = lastHtmlRef.current;
        const beforePlain = beforeHtml ? htmlToPlainText(beforeHtml) : prev;
        inputRef.current?.setValue(beforeHtml || prev);
        prevPlainRef.current = beforePlain;
        setPlainText(beforePlain);
        return;
      }
    }
    prevPlainRef.current = value;
    setPlainText(value);
    scheduleHtmlSnapshot();
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
    // Normalize every pick to JPEG. iOS hands back HEIC, which neither off-Apple
    // clients nor the agent's vision pipeline accept; converting here fixes both
    // display and the agent relay in one place.
    const converted = await Promise.all(
      res.assets.map(async (a, i) => {
        let uri = a.uri;
        let width = a.width;
        let height = a.height;
        try {
          const out = await ImageManipulator.manipulate(a.uri).renderAsync();
          const saved = await out.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
          uri = saved.uri;
          width = saved.width;
          height = saved.height;
        } catch (e) {
          console.warn('Image JPEG conversion failed; using original:', e);
        }
        const base = (a.fileName ?? `image-${i + 1}`).replace(/\.[^.]+$/, '');
        return {
          kind: 'image' as const,
          name: `${base}.jpg`,
          uri,
          mimeType: 'image/jpeg',
          width,
          height,
        };
      })
    );
    addAttachments(converted);
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

        <Animated.View
          layout={LinearTransition.duration(160)}
          style={{ flex: 1, position: 'relative' }}>
          {/* Black bubble that grows from the bottom-left to fill the input. */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: Palette.black,
                transformOrigin: 'left bottom',
              },
              fillStyle,
            ]}
          />
          <EnrichedTextInput
            ref={inputRef}
            mentionIndicators={[MENTION_INDICATOR]}
            // No markdown-style shortcuts (e.g. "- " → list); messages stay plain
            // text + mentions + links. Link auto-detection stays on (default
            // linkRegex) so typed URLs become tappable <a> chips.
            textShortcuts={[]}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            cursorColor={composing ? Palette.white : Palette.accentStart}
            selectionColor={Palette.accentStart}
            htmlStyle={MENTION_INPUT_HTML_STYLE}
            onChangeText={(e: NativeSyntheticEvent<OnChangeTextEvent>) =>
              handleChangeText(e.nativeEvent.value)
            }
            onStartMention={() => setMentionQuery('')}
            onChangeMention={(e: OnChangeMentionEvent) => setMentionQuery(e.text)}
            onEndMention={() => setMentionQuery(null)}
            style={{
              alignSelf: 'stretch',
              minHeight: 48,
              maxHeight: 140,
              borderWidth: 2,
              borderColor: '#131211',
              paddingHorizontal: 12,
              paddingVertical: 12,
              backgroundColor: 'transparent',
              color: composing ? Palette.white : theme.text,
              fontFamily: Fonts.sans,
              fontSize: 16,
              lineHeight: 20,
            }}
          />
        </Animated.View>

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
