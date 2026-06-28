import { Image } from 'expo-image';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Linking, Pressable, View } from 'react-native';

import type { MessageAttachment, MessageAttachmentKind } from '@/api/types';
import { Icon, type IconName } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { authImageSource } from '@/lib/auth-image';

import { ImageViewer } from './image-viewer';
import { TextAttachmentDrawer } from './text-attachment-drawer';

// Photos and link cards share a fixed width so a column of them lines up.
const MEDIA_WIDTH = 240;
const DEFAULT_ASPECT = 4 / 3;

const KIND_ICON: Record<MessageAttachmentKind, IconName> = {
  file: 'insert-drive-file',
  image: 'image',
  node: 'data-object',
  vault: 'data-array',
  link: 'link',
  text: 'subject',
};

function formatBytes(bytes?: number): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function hostname(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Node / vault / file — identical chip, differing only by icon and subtitle. */
function Chip({ attachment, compact }: { attachment: MessageAttachment; compact?: boolean }) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const subtitle =
    attachment.subtitle ??
    (attachment.kind === 'file' ? formatBytes(attachment.size) : undefined);

  const tile = compact ? 24 : 34;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: compact ? 6 : 10,
        maxWidth: compact ? 170 : MEDIA_WIDTH,
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 5 : 8,
        borderRadius: compact ? 10 : 12,
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: '#131211',
      }}>
      <View
        style={{
          width: tile,
          height: tile,
          borderRadius: compact ? 6 : 9,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.backgroundSelected,
        }}>
        <Icon name={KIND_ICON[attachment.kind]} size={compact ? 14 : 18} color={theme.text} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text
          style={{ color: theme.text }}
          className={compact ? 'text-xs font-semibold' : 'text-sm font-semibold'}
          numberOfLines={1}>
          {attachment.name}
        </Text>
        {subtitle && !compact ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/**
 * A photo — just the image, no bubble or border. Compact = a small square thumb.
 * Tapping a full-size photo (`onPress`) opens the full-screen zoomable viewer.
 */
function Photo({
  attachment,
  compact,
  onPress,
}: {
  attachment: MessageAttachment;
  compact?: boolean;
  onPress?: () => void;
}) {
  if (compact) {
    return (
      <Image
        source={authImageSource(attachment.uri)}
        style={{ width: 56, height: 56, borderRadius: 10 }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  const aspect =
    attachment.width && attachment.height
      ? attachment.width / attachment.height
      : DEFAULT_ASPECT;
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Image
        source={authImageSource(attachment.uri)}
        style={{ width: MEDIA_WIDTH, aspectRatio: aspect, borderRadius: 14 }}
        contentFit="cover"
        transition={150}
      />
    </Pressable>
  );
}

/** Link preview — title plus an OpenGraph image when one is available. */
function LinkCard({ attachment }: { attachment: MessageAttachment }) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <Pressable
      onPress={() => attachment.url && Linking.openURL(attachment.url)}
      style={{
        width: MEDIA_WIDTH,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: theme.backgroundElement,
        borderWidth: 1,
        borderColor: '#131211',
      }}>
      {attachment.previewImageUrl ? (
        <Image
          source={authImageSource(attachment.previewImageUrl)}
          style={{ width: MEDIA_WIDTH, height: 130 }}
          contentFit="cover"
          transition={150}
        />
      ) : null}
      <View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
        <Text style={{ color: theme.text }} className="text-sm font-semibold" numberOfLines={2}>
          {attachment.name}
        </Text>
        {hostname(attachment.url) ? (
          <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
            {hostname(attachment.url)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Pasted long text. Compact = a small square thumb (matching photos) filled with
 * the text; otherwise a node-like card showing a few lines. Either way, tapping
 * opens the full body in a scrollable drawer.
 */
function TextSnippet({ attachment, compact }: { attachment: MessageAttachment; compact?: boolean }) {
  const { colorScheme } = useColorScheme();
  const theme = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const [open, setOpen] = React.useState(false);
  const body = attachment.text ?? attachment.name;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={
          compact
            ? {
                width: 56,
                height: 56,
                borderRadius: 10,
                padding: 6,
                overflow: 'hidden',
                backgroundColor: theme.backgroundElement,
                borderWidth: 1,
                borderColor: '#131211',
              }
            : {
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                width: MEDIA_WIDTH,
                padding: 10,
                borderRadius: 12,
                backgroundColor: theme.backgroundElement,
                borderWidth: 1,
                borderColor: '#131211',
              }
        }>
        {compact ? (
          <Text style={{ color: theme.text, fontSize: 7, lineHeight: 9 }} numberOfLines={7}>
            {body}
          </Text>
        ) : (
          <>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.backgroundSelected,
              }}>
              <Icon name={KIND_ICON.text} size={18} color={theme.text} />
            </View>
            <Text
              style={{ color: theme.text, flexShrink: 1, fontSize: 13, lineHeight: 18 }}
              numberOfLines={5}>
              {body}
            </Text>
          </>
        )}
      </Pressable>
      <TextAttachmentDrawer visible={open} text={body} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * A single attachment. `compact` shrinks it for previews (e.g. the composer):
 * photos become small thumbnails and links collapse into a chip.
 */
export function AttachmentItem({
  attachment,
  compact = false,
  onPressImage,
}: {
  attachment: MessageAttachment;
  compact?: boolean;
  /** Tap handler for full-size photos — opens the full-screen viewer. */
  onPressImage?: () => void;
}) {
  if (attachment.kind === 'image')
    return <Photo attachment={attachment} compact={compact} onPress={onPressImage} />;
  if (attachment.kind === 'text') return <TextSnippet attachment={attachment} compact={compact} />;
  if (attachment.kind === 'link' && !compact) return <LinkCard attachment={attachment} />;
  return <Chip attachment={attachment} compact={compact} />;
}

/**
 * Renders a message's attachments as a vertical stack: photos bare, links as
 * preview cards, and files/nodes/vaults as identical chips. Used by both the
 * in-list bubble and the long-press overlay replica so they stay in sync.
 */
export function MessageAttachments({
  attachments,
  align,
}: {
  attachments: MessageAttachment[];
  align: 'flex-start' | 'flex-end';
}) {
  // The full-screen viewer scrolls across all photos in this message, so map each
  // photo to its position within that subset.
  const images = React.useMemo(
    () => attachments.filter((a) => a.kind === 'image' && a.uri),
    [attachments]
  );
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  if (!attachments.length) return null;
  return (
    <View style={{ alignItems: align, gap: 4 }}>
      {attachments.map((a, i) => {
        const imageIndex = a.kind === 'image' && a.uri ? images.indexOf(a) : -1;
        return (
          <AttachmentItem
            key={`${a.refId ?? a.uri ?? a.url ?? a.name}-${i}`}
            attachment={a}
            onPressImage={imageIndex >= 0 ? () => setViewerIndex(imageIndex) : undefined}
          />
        );
      })}

      {images.length > 0 && (
        <ImageViewer
          images={images.map((a) => ({ uri: a.uri!, width: a.width, height: a.height }))}
          initialIndex={viewerIndex ?? 0}
          visible={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </View>
  );
}
