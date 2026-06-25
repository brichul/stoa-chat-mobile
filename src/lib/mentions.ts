/**
 * @-mention references, backed by `react-native-enriched-html`.
 *
 * Message content is stored as the library's enriched HTML. A mention is a
 * `<mention text="Bob Roberts" indicator="@" kind="user" raw="bobroberts">…</mention>`
 * tag — `text`/`indicator` are the library's own attributes; `kind` and `raw`
 * are our custom attributes (stored flat and round-tripped by the parser). The
 * composer writes them via `setMention('@', label, { kind, raw })`.
 *
 * Resolution (raw → human label) is backed by the mock directories for now —
 * swap these for real lookups once the backend exposes user/node/vault search.
 */
import type { Participant } from '@/api/types';
import { MOCK_NODES, MOCK_USERS, MOCK_VAULTS } from '@/data/mock';

export type MentionKind = 'user' | 'node' | 'vault';

/** The single mention trigger character. */
export const MENTION_INDICATOR = '@';

export interface MentionRef {
  kind: MentionKind;
  /** Value stored in the tag's `raw` attribute: username for users, id for node/vault. */
  raw: string;
  /** Human label shown in chips/menus & passed as the mention's `text`. */
  label: string;
  /** Stable id for colour/avatar resolution (user id / node id / vault id). */
  id: string;
  /** Secondary line in the menu — the exact value embedded in the tag. */
  inserted: string;
  avatar_url?: string | null;
}

// ─── Resolution ────────────────────────────────────────────────────────────────

function resolveUser(raw: string): MentionRef {
  const u = MOCK_USERS.find((m) => m.username === raw || m.id === raw);
  return {
    kind: 'user',
    raw,
    id: u?.id ?? raw,
    label: u?.display_name ?? raw,
    inserted: u?.username ?? raw,
    avatar_url: u?.avatar_url ?? null,
  };
}

function resolveNode(raw: string): MentionRef {
  const n = MOCK_NODES.find((m) => m.id === raw);
  return { kind: 'node', raw, id: raw, label: n?.title ?? raw, inserted: raw };
}

function resolveVault(raw: string): MentionRef {
  const v = MOCK_VAULTS.find((m) => m.id === raw);
  return { kind: 'vault', raw, id: raw, label: v?.name ?? raw, inserted: raw };
}

export function resolveMention(kind: MentionKind, raw: string): MentionRef {
  if (kind === 'user') return resolveUser(raw);
  if (kind === 'node') return resolveNode(raw);
  return resolveVault(raw);
}

// ─── Enriched-HTML helpers ───────────────────────────────────────────────────────

const MENTION_TAG_RE = /<mention\b([^>]*)>([\s\S]*?)<\/mention>/gi;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function attr(attrStr: string, name: string): string | undefined {
  const m = attrStr.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'));
  return m ? decodeEntities(m[1]) : undefined;
}

/** True when the content is enriched HTML (vs. a bare plain-text string). */
export function isHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/** True when the content contains at least one mention chip. */
export function hasMentions(content: string): boolean {
  return /<mention\b/i.test(content);
}

/**
 * True when the content needs the native EnrichedText renderer — i.e. it has a
 * mention chip or a link. Plain messages can use a lighter <Text>.
 */
export function hasRichContent(content: string): boolean {
  return /<(mention|a)\b/i.test(content);
}

/**
 * Flatten enriched HTML to a readable plain string: a mention collapses to its
 * `text` attribute (which already includes the indicator, e.g. "@Bob Roberts"),
 * block tags become newlines, everything else is stripped. Used for reply
 * previews, copy, list previews, and anywhere chips can't render.
 */
export function htmlToPlainText(content: string): string {
  if (!content || !isHtml(content)) return content;
  let out = content.replace(MENTION_TAG_RE, (_m, attrs: string, inner: string) =>
    attr(attrs, 'text') ?? inner ?? ''
  );
  out = out
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(out).replace(/\n{3,}/g, '\n\n').trim();
}

/** Every resolved mention in the content, in order, deduped by kind+raw. */
export function extractMentionsFromHtml(content: string): MentionRef[] {
  const out: MentionRef[] = [];
  const seen = new Set<string>();
  for (const m of content.matchAll(MENTION_TAG_RE)) {
    const attrs = m[1];
    const kind = attr(attrs, 'kind') as MentionKind | undefined;
    const raw = attr(attrs, 'raw');
    if (!kind || !raw) continue;
    const key = `${kind}:${raw}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(resolveMention(kind, raw));
  }
  return out;
}

// ─── Composer suggestion search ──────────────────────────────────────────────────

export interface MentionDirectory {
  users: MentionRef[];
  nodes: MentionRef[];
  vaults: MentionRef[];
}

/**
 * The pool of things that can be mentioned. Chat participants are merged in
 * first (so people already in the chat rank ahead of the wider mock directory),
 * deduped by id.
 */
export function buildDirectory(participants: Participant[] = []): MentionDirectory {
  const users: MentionRef[] = [];
  const seen = new Set<string>();

  for (const p of participants) {
    if (p.type !== 'user' || seen.has(p.id)) continue;
    seen.add(p.id);
    const username = p.username ?? MOCK_USERS.find((m) => m.id === p.id)?.username ?? p.id;
    users.push({
      kind: 'user',
      raw: username,
      id: p.id,
      label: p.display_name ?? p.name ?? username,
      inserted: username,
      avatar_url: p.avatar_url ?? null,
    });
  }
  for (const m of MOCK_USERS) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    users.push({
      kind: 'user',
      raw: m.username,
      id: m.id,
      label: m.display_name,
      inserted: m.username,
      avatar_url: m.avatar_url ?? null,
    });
  }

  return {
    users,
    nodes: MOCK_NODES.map((n) => resolveNode(n.id)),
    vaults: MOCK_VAULTS.map((v) => resolveVault(v.id)),
  };
}

function matches(ref: MentionRef, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return ref.label.toLowerCase().includes(needle) || ref.inserted.toLowerCase().includes(needle);
}

/** Filter the directory by the active `@query`. */
export function searchDirectory(dir: MentionDirectory, query: string): MentionDirectory {
  return {
    users: dir.users.filter((r) => matches(r, query)),
    nodes: dir.nodes.filter((r) => matches(r, query)),
    vaults: dir.vaults.filter((r) => matches(r, query)),
  };
}
