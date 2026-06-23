import type { Chat, Message } from '@/api/types';

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
        last_read_message_id: null,
      },
      {
        id: 'user_sam',
        type: 'user',
        permission: 'write',
        display_name: 'Sam',
        avatar_url: null,
        last_read_message_id: null,
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
  chat_3: [],
};

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
