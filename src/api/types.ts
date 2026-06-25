/**
 * Wire types mirroring the Stoa backend (../stoa-backend/app/routers).
 * These are intentionally permissive — fields the UI doesn't yet use are
 * left optional so the scaffold tolerates backend additions.
 */

export type ActorType = 'user' | 'bot';
export type Permission = 'read' | 'write';
export type ChatType = 'conversation' | 'session';
export type ChatStatus = 'active' | 'pending' | 'completed' | 'archived' | 'timeout';

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  [key: string]: unknown;
}

export interface LoginResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token: string;
  user: User;
}

export interface Participant {
  id: string;
  type: ActorType;
  permission: Permission;
  display_name?: string | null;
  username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  last_read_message_id?: string | null;
  last_read_at?: string | null;
}

export interface NodeRef {
  id: string;
  title?: string;
  status?: string;
}

export interface VaultRef {
  id: string;
  name?: string;
  type?: string;
}

export interface Chat {
  id: string;
  chat_type: ChatType;
  name: string | null;
  owner_id: string;
  owner_type: ActorType;
  participants: Participant[];
  attached_nodes?: string[];
  attached_vaults?: string[];
  attached_nodes_detail?: NodeRef[];
  attached_vaults_detail?: VaultRef[];
  is_one_on_one?: boolean;
  goal?: string | null;
  status: ChatStatus;
  updated_at?: string;
  created_at?: string;
  websocket_url?: string;
}

export interface Mention {
  id: string;
  type: ActorType;
}

export interface MessageReplySnippet {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
}

export type MessageAttachmentKind = 'file' | 'image' | 'node' | 'vault' | 'link' | 'text';

/**
 * Something attached to a message and rendered above its text: an uploaded file
 * or photo, a referenced node/vault, or a link preview. The backend doesn't
 * persist these yet — for now they're built client-side (see chat-screen).
 */
export interface MessageAttachment {
  kind: MessageAttachmentKind;
  /** Display label: file/photo name, node title, vault name, or link title. */
  name: string;
  /** Local or remote URI for image/file attachments. */
  uri?: string;
  mimeType?: string;
  /** Byte size for files, when known. */
  size?: number;
  /** Intrinsic dimensions for images, used to size the preview. */
  width?: number;
  height?: number;
  /** Backend id for node/vault references. */
  refId?: string;
  /** Secondary label, e.g. vault type or node status. */
  subtitle?: string;
  /** Target URL for link attachments. */
  url?: string;
  /** OpenGraph-style preview image for link attachments, if one exists. */
  previewImageUrl?: string;
  /** Full body for `text` attachments (long pasted text). */
  text?: string;
}

export interface Message {
  id: string;
  type: 'message' | 'system' | string;
  sender_id: string;
  sender_type: ActorType;
  sender_name: string;
  content: string;
  attachments?: MessageAttachment[];
  mentions?: Mention[];
  /** Epoch milliseconds. */
  timestamp: number;
  reactions?: Record<string, string[]>;
  is_pinned?: boolean;
  /** Set when this message is a reply. */
  reply_to_id?: string | null;
  /** Inline snippet of the replied-to message (populated by the API). */
  reply_to?: MessageReplySnippet | null;
  /** True when this message was forwarded from another chat. */
  is_forwarded?: boolean;
  forwarded_from_chat_id?: string | null;
  forwarded_from_message_id?: string | null;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  body?: string;
  status?: string;
  tags?: string[];
  vault_id?: string;
  links?: NodeLink[];
  confidence?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface NodeLink {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relation?: string;
}

export interface Vault {
  id: string;
  name: string;
  type?: string;
  description?: string;
}

/** A single entry in a user's "current projects" list. */
export interface ProjectItem {
  title: string;
  description?: string;
}

/** Public-facing user info — what GET /v1/users/:id/profile exposes. */
export interface PublicProfile {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  /** Job title (free-text), not the permission role. */
  job_title?: string | null;
  bio?: string | null;
  current_projects?: ProjectItem[];
  created_at?: string;
}

/** A team the user belongs to (their team plus its ancestors). */
export interface PublicTeam {
  id: string;
  name?: string | null;
  parent_team_id?: string | null;
}

/** Public subset of a bot owned by a user. */
export interface PublicBot {
  id: string;
  name?: string;
  display_name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  expertise_tags?: string[];
  availability_status?: string;
  reputation_score?: number;
  model_tier?: string;
  created_at?: string;
}

/** Public vault surfaced on a user's profile. */
export interface PublicVault {
  id: string;
  name?: string;
  type?: string;
  description?: string | null;
  node_count?: number;
  created_at?: string;
}

/** Response shape of GET /v1/users/:id/profile. */
export interface UserProfile {
  profile: PublicProfile;
  teams: PublicTeam[];
  bots: PublicBot[];
  vaults: PublicVault[];
}

export interface SearchResult {
  node_id: string;
  title: string;
  score: number;
  snippet?: string;
}

/** Inbound realtime events on /v1/chats/{id}/ws (see app/realtime/chat.py). */
export type ChatSocketEvent =
  | (Message & { type: 'message' })
  | { type: 'typing'; sender_id: string; sender_name?: string; is_typing?: boolean }
  | { type: 'read'; participant_id: string; message_id: string; timestamp: number }
  | { type: 'join' | 'leave' | 'system'; content?: string; sender_id?: string; timestamp: number }
  | { type: 'participant_added'; participant: Partial<Participant>; timestamp: number }
  | { type: 'node_attached'; node: NodeRef; attached_by?: string; timestamp: number }
  | { type: 'vault_attached'; vault: VaultRef; attached_by?: string; timestamp: number }
  | {
      type: 'reaction';
      message_id: string;
      emoji: string;
      actor_id: string;
      action: 'add' | 'remove';
      counts: Record<string, number>;
      timestamp: number;
    };
