import { WS_BASE_URL } from './config';
import type { ChatSocketEvent } from './types';

type Listener = (event: ChatSocketEvent) => void;
type StatusListener = (status: ChatSocketStatus) => void;
export type ChatSocketStatus = 'connecting' | 'open' | 'closed';

/**
 * Thin wrapper over the chat WebSocket (/v1/chats/{id}/ws?token=...).
 * Outbound: {type:'message', content} | {type:'typing'} | {type:'read', message_id}.
 * Inbound events are forwarded to subscribers as ChatSocketEvent.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private closedByUser = false;

  constructor(
    private chatId: string,
    private token: string
  ) {}

  connect(): void {
    this.closedByUser = false;
    this.setStatus('connecting');
    const url = `${WS_BASE_URL}/v1/chats/${this.chatId}/ws?token=${encodeURIComponent(this.token)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => this.setStatus('open');
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as ChatSocketEvent;
        this.listeners.forEach((l) => l(data));
      } catch {
        // ignore non-JSON frames
      }
    };
    ws.onclose = () => {
      this.setStatus('closed');
      if (!this.closedByUser) setTimeout(() => this.connect(), 1500);
    };
    ws.onerror = () => ws.close();
  }

  send(content: string): void {
    this.raw({ type: 'message', content });
  }

  sendTyping(): void {
    this.raw({ type: 'typing' });
  }

  sendRead(messageId: string): void {
    this.raw({ type: 'read', message_id: messageId });
  }

  private raw(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload));
  }

  onEvent(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(status: ChatSocketStatus): void {
    this.statusListeners.forEach((l) => l(status));
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.statusListeners.clear();
  }
}
