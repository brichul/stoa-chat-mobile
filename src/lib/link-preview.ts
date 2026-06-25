import type { MessageAttachment } from '@/api/types';

// Stop at whitespace and at HTML tag/quote characters so a URL pulled from
// enriched HTML never swallows a trailing tag (e.g. "…com</p>").
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/i;

/** First http(s) URL in a string, trimmed of trailing punctuation. */
export function extractFirstUrl(text: string): string | undefined {
  const match = text.match(URL_RE);
  if (!match) return undefined;
  return match[0].replace(/[)\].,!?]+$/, '');
}

/**
 * Mock OpenGraph metadata. The backend can't resolve link previews yet, so we
 * fake a title (and sometimes a preview image) for a few known hosts and fall
 * back to the bare hostname otherwise.
 */
const MOCK_PREVIEWS: Record<string, { title: string; previewImageUrl?: string }> = {
  'github.com': {
    title: 'GitHub · Build and ship software',
    previewImageUrl: 'https://picsum.photos/seed/github/600/300',
  },
  'stoa.dev': {
    title: 'Stoa — the knowledge graph for teams',
    previewImageUrl: 'https://picsum.photos/seed/stoa/600/300',
  },
  'news.ycombinator.com': { title: 'Hacker News' },
};

export function mockLinkPreview(url: string): MessageAttachment {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // Leave host as the raw url if it doesn't parse.
  }
  const meta = MOCK_PREVIEWS[host];
  return {
    kind: 'link',
    name: meta?.title ?? host,
    url,
    previewImageUrl: meta?.previewImageUrl,
  };
}
