import type { Chat, Participant } from '@/api/types';

function participantLabel(p: Participant): string {
  return p.display_name || p.name || p.username || 'Unknown';
}

/**
 * Display title for a chat. Named chats use their name; unnamed (typically
 * 1-on-1 or small group) chats fall back to the other participants' names.
 */
export function chatDisplayTitle(chat: Chat, currentUserId: string): string {
  if (chat.name) return chat.name;
  const others = chat.participants.filter((p) => p.id !== currentUserId);
  if (others.length === 0) return 'Untitled chat';
  const names = others.map(participantLabel);
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}
