import type {
  EnrichedTextHtmlStyle,
  HtmlStyle,
} from 'react-native-enriched-html';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/icons/icon';
import { Text } from '@/components/ui/text';

import { MENTION_INDICATOR, type MentionKind, type MentionRef } from '@/lib/mentions';
import { avatarColor } from './participant-avatar';

// ─── Per-kind colour ────────────────────────────────────────────────────────────

export const KIND_COLOR: Record<MentionKind, string> = {
  user: '#98514B',
  bot: '#7A5BA6',
  node: '#5B7FA6',
  vault: '#5B8C6B',
};

const KIND_ICON: Record<Exclude<MentionKind, 'user'>, IconName> = {
  bot: 'smart-toy',
  node: 'data-object',
  vault: 'data-array',
};

function tint(hex: string, alpha = 0.15): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ─── Shared mention styling for the enriched components ─────────────────────────
//
// The library styles every mention of a given indicator the same way (we use a
// single "@"), so user/node/vault share one chip style. Per-kind colour isn't
// expressible here — that's a known trade-off of moving to the native component.

const MENTION_COLOR = KIND_COLOR.user;
const LINK_COLOR = KIND_COLOR.node;

// The library applies mention styling per indicator, so the config must be keyed
// by the indicator ("@") — a single un-keyed config lands on an internal default
// key the native renderer ignores, leaving the blue/yellow/underline defaults.

/** Shared `htmlStyle` (mention chips + links) for the editable EnrichedTextInput. */
export const MENTION_INPUT_HTML_STYLE: HtmlStyle = {
  mention: {
    [MENTION_INDICATOR]: {
      color: MENTION_COLOR,
      backgroundColor: tint(MENTION_COLOR),
      textDecorationLine: 'none',
    },
  },
  a: {
    color: LINK_COLOR,
    textDecorationLine: 'underline',
  },
};

/** Shared `htmlStyle` (mention chips + links) for the read-only EnrichedText. */
export const MENTION_TEXT_HTML_STYLE: EnrichedTextHtmlStyle = {
  mention: {
    [MENTION_INDICATOR]: {
      color: MENTION_COLOR,
      backgroundColor: tint(MENTION_COLOR),
      textDecorationLine: 'none',
      pressColor: MENTION_COLOR,
      pressBackgroundColor: tint(MENTION_COLOR, 0.28),
    },
  },
  a: {
    color: LINK_COLOR,
    textDecorationLine: 'underline',
    pressColor: LINK_COLOR,
  },
};

// ─── Small glyph: user avatar initial, or node/vault icon (used in the picker) ──

export function MentionGlyph({ mention, size = 18 }: { mention: MentionRef; size?: number }) {
  if (mention.kind === 'user') {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarColor(mention.id),
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
        <Text style={{ color: '#fff', fontSize: size * 0.5, fontWeight: '600' }}>
          {mention.label.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 5,
        backgroundColor: tint(KIND_COLOR[mention.kind]),
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name={KIND_ICON[mention.kind]} size={size * 0.62} color={KIND_COLOR[mention.kind]} />
    </View>
  );
}
