import type { Chat, Message, NodeRef, UserProfile, VaultRef } from '@/api/types';

/**
 * Placeholder data for the scaffold. Swap these for the real API
 * (src/api/chats.ts) once auth + a tenant are wired up.
 */
const HOUR = 3600_000;
const now = Date.now();

export const CURRENT_USER_ID = 'user_me';

/** Nodes the user can attach to a chat (mock — no backend picker yet). */
export const MOCK_NODES: NodeRef[] = [
  { id: 'node_ontology_root', title: 'Ontology root', status: 'active' },
  { id: 'node_q3_findings', title: 'Q3 findings summary', status: 'active' },
  { id: 'node_security_review', title: 'Security review checklist', status: 'draft' },
  { id: 'node_onboarding_steps', title: 'Onboarding steps', status: 'active' },
];

/** Vaults the user can attach to a chat (mock — no backend picker yet). */
export const MOCK_VAULTS: VaultRef[] = [
  { id: 'vault_q3', name: 'Q3 Research', type: 'knowledge' },
  { id: 'vault_onboarding', name: 'Onboarding', type: 'docs' },
  { id: 'vault_ontology', name: 'Core Ontology', type: 'knowledge' },
];

/**
 * Directory of users that can be @-mentioned in a message — including people not
 * yet in the chat (mentioning them is how you'd add them). The `username` is the
 * value embedded in the wire format `<user>username</user>`; the `id` resolves
 * the chip's avatar/colour. Mock — there's no backend user-search endpoint yet.
 */
export interface MockUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
}

export const MOCK_USERS: MockUser[] = [
  { id: 'user_amir', username: 'amir', display_name: 'Amir Haddad', avatar_url: null },
  { id: 'user_lin', username: 'linwei', display_name: 'Lin Wei', avatar_url: null },
  { id: 'user_sam', username: 'samokafor', display_name: 'Sam Okafor', avatar_url: null },
  { id: 'user_bob', username: 'bobroberts', display_name: 'Bob Roberts', avatar_url: null },
  { id: 'user_nadia', username: 'nadiak', display_name: 'Nadia Khan', avatar_url: null },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat_1',
    chat_type: 'conversation',
    name: 'Design sync',
    owner_id: CURRENT_USER_ID,
    owner_type: 'user',
    status: 'active',
    is_one_on_one: true,
    goal: null,
    participants: [
      {
        id: CURRENT_USER_ID,
        type: 'user',
        permission: 'write',
        display_name: 'You',
        avatar_url: null,
        last_read_message_id: 'm4',
      },
      {
        id: 'user_amir',
        type: 'user',
        permission: 'write',
        display_name: 'Amir',
        avatar_url: null,
        last_read_message_id: 'm4',
      },
    ],
    attached_nodes: [],
    attached_vaults: [],
    attached_nodes_detail: [],
    attached_vaults_detail: [],
    created_at: new Date(now - 72 * HOUR).toISOString(),
    updated_at: new Date(now - HOUR).toISOString(),
  },
  {
    id: 'chat_2',
    chat_type: 'conversation',
    name: 'Q3 knowledge graph cleanup and ontology review',
    owner_id: 'user_amir',
    owner_type: 'user',
    status: 'active',
    is_one_on_one: false,
    goal: null,
    participants: [
      {
        id: CURRENT_USER_ID,
        type: 'user',
        permission: 'write',
        display_name: 'You',
        avatar_url: null,
        last_read_message_id: 'm5',
      },
      {
        id: 'bot_atlas',
        type: 'bot',
        permission: 'write',
        name: 'Atlas',
        display_name: 'Atlas',
        avatar_url: null,
        last_read_message_id: null,
      },
    ],
    attached_nodes: ['node_ontology_root'],
    attached_vaults: ['vault_q3'],
    attached_nodes_detail: [{ id: 'node_ontology_root', title: 'Ontology root', status: 'active' }],
    attached_vaults_detail: [{ id: 'vault_q3', name: 'Q3 Research', type: 'knowledge' }],
    created_at: new Date(now - 48 * HOUR).toISOString(),
    updated_at: new Date(now - 5 * HOUR).toISOString(),
  },
  {
    id: 'chat_3',
    chat_type: 'conversation',
    name: 'Onboarding docs',
    owner_id: CURRENT_USER_ID,
    owner_type: 'user',
    status: 'active',
    is_one_on_one: false,
    goal: null,
    participants: [
      {
        id: CURRENT_USER_ID,
        type: 'user',
        permission: 'write',
        display_name: 'You',
        avatar_url: null,
        last_read_message_id: null,
      },
      {
        id: 'user_lin',
        type: 'user',
        permission: 'write',
        display_name: 'Lin',
        avatar_url: null,
        last_read_message_id: 'g7',
      },
      {
        id: 'user_sam',
        type: 'user',
        permission: 'write',
        display_name: 'Sam',
        avatar_url: null,
        last_read_message_id: 'g7',
      },
    ],
    attached_nodes: [],
    attached_vaults: ['vault_onboarding'],
    attached_nodes_detail: [],
    attached_vaults_detail: [{ id: 'vault_onboarding', name: 'Onboarding', type: 'docs' }],
    created_at: new Date(now - 120 * HOUR).toISOString(),
    updated_at: new Date(now - 26 * HOUR).toISOString(),
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  chat_1: [
    {
      id: 'sys_join',
      type: 'join',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Amir joined the conversation',
      timestamp: now - 72 * HOUR,
    },
    {
      id: 'm1',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Hey — did the new sidebar layout land?',
      timestamp: now - HOUR - 600_000,
      reactions: { '😊': [CURRENT_USER_ID] },
    },
    {
      id: 'm2',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Scaffolding it right now. Swipe right opens the sidebar, swipe left flips to the AI view.',
      timestamp: now - HOUR - 540_000,
      reply_to_id: 'm1',
      reply_to: {
        id: 'm1',
        sender_id: 'user_amir',
        sender_name: 'Amir',
        content: 'Hey — did the new sidebar layout land?',
      },
    },
    {
      id: 'm3',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Love it. And the graph?',
      timestamp: now - HOUR - 480_000,
      reactions: { '👍': [CURRENT_USER_ID, 'user_amir'] },
    },
    {
      id: 'm4',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Wipes in from the left over the chat. Placeholder for now.',
      timestamp: now - HOUR - 60_000,
      is_pinned: true,
    },
    {
      id: 'm5',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Here’s the mock I was describing 👇',
      timestamp: now - 50 * 60_000,
      attachments: [
        {
          kind: 'image',
          name: 'sidebar-mock.png',
          uri: 'https://picsum.photos/seed/sidebar/640/480',
          width: 640,
          height: 480,
        },
      ],
    },
    {
      id: 'm6',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: '',
      timestamp: now - 49 * 60_000,
      attachments: [
        {
          kind: 'file',
          name: 'design-spec.pdf',
          mimeType: 'application/pdf',
          size: 248_000,
        },
      ],
    },
    {
      id: 'm7',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Pulled the ontology root and the research vault for context.',
      timestamp: now - 40 * 60_000,
      attachments: [
        { kind: 'node', name: 'Ontology root', refId: 'node_ontology_root', subtitle: 'active' },
        { kind: 'vault', name: 'Q3 Research', refId: 'vault_q3', subtitle: 'knowledge' },
      ],
    },
    {
      id: 'm8',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Good background reading on graph layouts:',
      timestamp: now - 30 * 60_000,
      attachments: [
        {
          kind: 'link',
          name: 'Stoa — the knowledge graph for teams',
          url: 'https://stoa.dev',
          previewImageUrl: 'https://picsum.photos/seed/stoa/600/300',
        },
      ],
    },
    {
      id: 'm9',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Here are the raw notes from the call — tap to read the whole thing.',
      timestamp: now - 20 * 60_000,
      attachments: [
        {
          kind: 'text',
          name: 'Pasted text',
          text:
            'Meeting notes — graph ontology review\n\n' +
            '1. The ontology root needs a clearer split between "concepts" and "artifacts". ' +
            'Right now everything hangs off a single root which makes traversal slow and the ' +
            'graph view crowded.\n\n' +
            '2. Orphaned nodes: Scout flagged 12 nodes with no inbound links. Most are leftovers ' +
            'from the Q2 import. Proposal: auto-link by embedding similarity above 0.82, and queue ' +
            'the rest for manual review.\n\n' +
            '3. Vault permissions: we still grant "contribute" too liberally. Tighten the default ' +
            'to "read" and require an explicit invite for write access.\n\n' +
            '4. Next steps: Amir to draft the new root schema, Lin to run the similarity pass, and ' +
            'I will write up the permission change for review by Friday.',
        },
      ],
    },
  ],
  chat_2: [
    {
      id: 'sys_vault',
      type: 'vault_attached',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Vault "Q3 Research" was added to the context',
      timestamp: now - 6 * HOUR,
    },
    {
      id: 'm5',
      type: 'message',
      sender_id: 'bot_atlas',
      sender_type: 'bot',
      sender_name: 'Atlas',
      content: 'I found 12 orphaned nodes in the ontology vault. Want me to propose links?',
      timestamp: now - 5 * HOUR,
    },
  ],
  chat_3: [
    {
      id: 'sys_lin_join',
      type: 'join',
      sender_id: 'user_sam',
      sender_type: 'user',
      sender_name: 'Sam',
      content: 'Sam joined the conversation',
      timestamp: now - 4 * HOUR,
    },
    {
      id: 'g1',
      type: 'message',
      sender_id: 'user_lin',
      sender_type: 'user',
      sender_name: 'Lin',
      content: 'Morning! I just pushed the new onboarding checklist to the vault.',
      timestamp: now - 3 * HOUR,
      is_pinned: true,
    },
    {
      id: 'g2',
      type: 'message',
      sender_id: 'user_lin',
      sender_type: 'user',
      sender_name: 'Lin',
      content: 'Section 3 still needs a security review though.',
      timestamp: now - 3 * HOUR + 30_000,
    },
    {
      id: 'g3',
      type: 'message',
      sender_id: 'user_sam',
      sender_type: 'user',
      sender_name: 'Sam',
      content: 'Nice — I can take the security section.',
      timestamp: now - 3 * HOUR + 300_000,
      reactions: { '👍': ['user_lin', CURRENT_USER_ID] },
    },
    {
      id: 'g4',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Thanks Sam. Lin — is this the checklist in the Onboarding vault?',
      timestamp: now - 3 * HOUR + 480_000,
      reply_to_id: 'g1',
      reply_to: {
        id: 'g1',
        sender_id: 'user_lin',
        sender_name: 'Lin',
        content: 'Morning! I just pushed the new onboarding checklist to the vault.',
      },
    },
    {
      id: 'g5',
      type: 'message',
      sender_id: 'user_lin',
      sender_type: 'user',
      sender_name: 'Lin',
      content: 'Yep, that one. Pinned it up top so it’s easy to find.',
      timestamp: now - 3 * HOUR + 540_000,
    },
    {
      id: 'g6',
      type: 'message',
      sender_id: 'user_sam',
      sender_type: 'user',
      sender_name: 'Sam',
      content: 'Pushed a first pass at the security steps — let me know what you think.',
      timestamp: now - 3 * HOUR + 2_400_000,
      reactions: { '🔥': [CURRENT_USER_ID, 'user_lin'], '❤️': ['user_lin'] },
    },
    {
      id: 'g7',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Looks great. Merging it in now.',
      timestamp: now - 3 * HOUR + 2_700_000,
    },
    {
      id: 'g8',
      type: 'message',
      sender_id: 'user_lin',
      sender_type: 'user',
      sender_name: 'Lin',
      // Enriched HTML produced by the composer. Mentions are <mention> tags
      // whose `text` attribute includes the indicator (e.g. "@Bob Roberts"),
      // plus our custom kind/raw attributes.
      content:
        '<html><p>Thanks <mention text="@Sam Okafor" indicator="@" kind="user" raw="samokafor">@Sam Okafor</mention>! Pulling in <mention text="@Bob Roberts" indicator="@" kind="user" raw="bobroberts">@Bob Roberts</mention> for the security pass — see <mention text="@Security review checklist" indicator="@" kind="node" raw="node_security_review">@Security review checklist</mention> in <mention text="@Onboarding" indicator="@" kind="vault" raw="vault_onboarding">@Onboarding</mention>.</p></html>',
      timestamp: now - 3 * HOUR + 3_000_000,
    },
  ],
};

/**
 * Mock public profiles keyed by user id. The profile screen reads from here
 * instead of the backend for now (see src/app/profile.tsx). The real contract
 * lives in src/api/profile.ts (GET /v1/users/:id/profile).
 */
export const MOCK_PROFILES: Record<string, UserProfile> = {
  user_amir: {
    profile: {
      id: 'user_amir',
      username: 'amir',
      display_name: 'Amir Haddad',
      avatar_url: null,
      job_title: 'Principal Knowledge Engineer',
      bio: 'Building the ontology that ties our knowledge graph together. Big on clean schemas and well-linked nodes.',
      current_projects: [
        { title: 'Ontology v2', description: 'Splitting the root into concepts vs. artifacts for faster traversal.' },
        { title: 'Orphan sweep', description: 'Auto-linking nodes with no inbound edges using embedding similarity.' },
      ],
      created_at: new Date(now - 400 * 24 * HOUR).toISOString(),
    },
    teams: [
      { id: 'team_kg', name: 'Knowledge Graph', parent_team_id: 'team_eng' },
      { id: 'team_eng', name: 'Engineering', parent_team_id: null },
    ],
    bots: [
      {
        id: 'bot_atlas',
        name: 'Atlas',
        display_name: 'Atlas',
        description: 'Maps and maintains the company knowledge graph ontology.',
        avatar_url: null,
        expertise_tags: ['ontology', 'graph-cleanup', 'research'],
        availability_status: 'available',
        reputation_score: 1280,
        model_tier: 'smartest',
        created_at: new Date(now - 300 * 24 * HOUR).toISOString(),
      },
      {
        id: 'bot_scout',
        name: 'Scout',
        display_name: 'Scout',
        description: 'Finds and links orphaned nodes across vaults.',
        avatar_url: null,
        expertise_tags: ['discovery', 'linking'],
        availability_status: 'busy',
        reputation_score: 540,
        model_tier: 'everyday',
        created_at: new Date(now - 120 * 24 * HOUR).toISOString(),
      },
    ],
    vaults: [
      {
        id: 'vault_q3',
        name: 'Q3 Research',
        type: 'public',
        description: 'Shared research notes and ontology drafts for Q3.',
        node_count: 142,
        created_at: new Date(now - 90 * 24 * HOUR).toISOString(),
      },
      {
        id: 'vault_ontology',
        name: 'Core Ontology',
        type: 'public',
        description: 'The canonical entity and relationship definitions.',
        node_count: 67,
        created_at: new Date(now - 250 * 24 * HOUR).toISOString(),
      },
    ],
  },
  user_lin: {
    profile: {
      id: 'user_lin',
      username: 'lin',
      display_name: 'Lin Wei',
      avatar_url: null,
      job_title: 'Onboarding Lead',
      bio: 'Helping new hires get productive in week one. Docs nerd.',
      current_projects: [
        { title: 'New-hire checklist', description: 'A guided path through the Onboarding vault for every role.' },
      ],
      created_at: new Date(now - 210 * 24 * HOUR).toISOString(),
    },
    teams: [{ id: 'team_people', name: 'People Ops', parent_team_id: null }],
    bots: [
      {
        id: 'bot_onboard',
        name: 'Onboarder',
        display_name: 'Onboarder',
        description: 'Walks new hires through the onboarding docs.',
        avatar_url: null,
        expertise_tags: ['onboarding', 'docs'],
        availability_status: 'available',
        reputation_score: 310,
        model_tier: 'everyday',
        created_at: new Date(now - 100 * 24 * HOUR).toISOString(),
      },
    ],
    vaults: [
      {
        id: 'vault_onboarding',
        name: 'Onboarding',
        type: 'public',
        description: 'Everything a new hire needs in their first week.',
        node_count: 38,
        created_at: new Date(now - 180 * 24 * HOUR).toISOString(),
      },
    ],
  },
  user_sam: {
    profile: {
      id: 'user_sam',
      username: 'sam',
      display_name: 'Sam Okafor',
      avatar_url: null,
      job_title: 'Security Engineer',
      bio: 'Reviewing the things before they ship.',
      current_projects: [],
      created_at: new Date(now - 60 * 24 * HOUR).toISOString(),
    },
    teams: [
      { id: 'team_security', name: 'Security', parent_team_id: 'team_eng' },
      { id: 'team_eng', name: 'Engineering', parent_team_id: null },
    ],
    bots: [],
    vaults: [],
  },
};

/** Falls back to a minimal generated profile for any unknown user id. */
export function getMockProfile(userId: string): UserProfile {
  return (
    MOCK_PROFILES[userId] ?? {
      profile: {
        id: userId,
        username: userId.replace(/^user_/, ''),
        display_name: null,
        avatar_url: null,
        job_title: null,
        bio: null,
        current_projects: [],
        created_at: new Date(now - 30 * 24 * HOUR).toISOString(),
      },
      teams: [],
      bots: [],
      vaults: [],
    }
  );
}

export const MOCK_AI_MESSAGES: Message[] = [
  {
    id: 'ai1',
    type: 'message',
    sender_id: 'stoa_agent',
    sender_type: 'bot',
    sender_name: 'Stoa',
    content: 'Hi! Ask me anything about your knowledge graph, or upload data to get started.',
    timestamp: now - 2 * HOUR,
  },
];
