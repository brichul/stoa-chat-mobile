import type { Chat, Message, UserProfile } from '@/api/types';

/**
 * Placeholder data for the scaffold. Swap these for the real API
 * (src/api/chats.ts) once auth + a tenant are wired up.
 */
const HOUR = 3600_000;
const now = Date.now();

export const CURRENT_USER_ID = 'user_me';

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
      created_at: new Date(now - 400 * 24 * HOUR).toISOString(),
    },
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
      created_at: new Date(now - 210 * 24 * HOUR).toISOString(),
    },
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
      created_at: new Date(now - 60 * 24 * HOUR).toISOString(),
    },
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
        created_at: new Date(now - 30 * 24 * HOUR).toISOString(),
      },
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
