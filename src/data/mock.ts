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
    participants: [
      { id: CURRENT_USER_ID, type: 'user', permission: 'write', display_name: 'You' },
      { id: 'user_amir', type: 'user', permission: 'write', display_name: 'Amir' },
    ],
    updated_at: new Date(now - HOUR).toISOString(),
  },
  {
    id: 'chat_2',
    chat_type: 'conversation',
    name: 'Q3 knowledge graph cleanup and ontology review',
    owner_id: 'user_amir',
    owner_type: 'user',
    status: 'active',
    participants: [
      { id: CURRENT_USER_ID, type: 'user', permission: 'write', display_name: 'You' },
      { id: 'bot_atlas', type: 'bot', permission: 'write', name: 'Atlas' },
    ],
    updated_at: new Date(now - 5 * HOUR).toISOString(),
  },
  {
    id: 'chat_3',
    chat_type: 'conversation',
    name: 'Onboarding docs',
    owner_id: CURRENT_USER_ID,
    owner_type: 'user',
    status: 'active',
    participants: [
      { id: CURRENT_USER_ID, type: 'user', permission: 'write', display_name: 'You' },
      { id: 'user_lin', type: 'user', permission: 'write', display_name: 'Lin' },
      { id: 'user_sam', type: 'user', permission: 'write', display_name: 'Sam' },
    ],
    updated_at: new Date(now - 26 * HOUR).toISOString(),
  },
];

export const MOCK_MESSAGES: Record<string, Message[]> = {
  chat_1: [
    {
      id: 'm1',
      type: 'message',
      sender_id: 'user_amir',
      sender_type: 'user',
      sender_name: 'Amir',
      content: 'Hey — did the new sidebar layout land?',
      timestamp: now - HOUR - 600_000,
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
    },
    {
      id: 'm4',
      type: 'message',
      sender_id: CURRENT_USER_ID,
      sender_type: 'user',
      sender_name: 'You',
      content: 'Wipes in from the left over the chat. Placeholder for now.',
      timestamp: now - HOUR - 60_000,
    },
  ],
  chat_2: [
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
