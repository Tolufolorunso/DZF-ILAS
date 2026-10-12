/**
 * In-memory Realtime Event Bus for DZF-ILAS
 * Dispatches Server-Sent Events (SSE) across connected staff browser sessions.
 * Preserves singleton state across Next.js dev reloads via globalThis.
 */

export type RealtimeEventType =
  | 'connected'
  | 'ping'
  | 'task:created'
  | 'task:updated'
  | 'task:deleted'
  | 'comment:added'
  | 'comment:deleted'
  | 'notification:created'
  | 'broadcast';

export interface RealtimeEvent<T = unknown> {
  id?: string;
  type: RealtimeEventType;
  payload: T;
  recipients?: string[]; // Lowercase usernames. If omitted or empty, broadcasts to all authenticated staff
  timestamp: string;
}

type SubscriberCallback = (event: RealtimeEvent) => void;

interface Subscriber {
  id: string;
  username: string;
  role?: string;
  callback: SubscriberCallback;
}

class RealtimeEventBus {
  private subscribers: Map<string, Subscriber> = new Map();

  /**
   * Subscribes a staff user session to the realtime event stream.
   * Returns an unsubscribe function.
   */
  subscribe(username: string, role: string | undefined, callback: SubscriberCallback): () => void {
    const id = `${username}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const subscriber: Subscriber = {
      id,
      username: username.toLowerCase().trim(),
      role,
      callback,
    };
    this.subscribers.set(id, subscriber);

    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Dispatches an event to connected subscribers.
   * If recipients are specified, only subscribers matching those usernames receive the event.
   */
  dispatch<T = unknown>(event: Omit<RealtimeEvent<T>, 'timestamp'> & { timestamp?: string }) {
    const fullEvent: RealtimeEvent<T> = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    const targetRecipients = event.recipients && event.recipients.length > 0
      ? event.recipients.map((r) => r.toLowerCase().trim())
      : null;

    for (const sub of this.subscribers.values()) {
      if (targetRecipients && !targetRecipients.includes(sub.username)) {
        continue;
      }
      try {
        sub.callback(fullEvent);
      } catch (err) {
        console.error(`[REALTIME_DISPATCH_WARN] Failed delivery to ${sub.id}:`, err);
      }
    }
  }

  getActiveSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * Convenience alias to broadcast an event to all connected sessions.
   */
  broadcast<T = unknown>(event: { type: RealtimeEventType; data?: T; payload?: T; timestamp?: string }) {
    this.dispatch({
      type: event.type,
      payload: event.data !== undefined ? event.data : event.payload,
      timestamp: event.timestamp,
    });
  }
}

// Preserve single bus across module hot-reloading
const globalBusKey = Symbol.for('dzf.realtime.eventBus');
const globalScope = globalThis as unknown as { [key: symbol]: RealtimeEventBus };

export const realtimeEventBus: RealtimeEventBus =
  globalScope[globalBusKey] || (globalScope[globalBusKey] = new RealtimeEventBus());

export const eventBus = realtimeEventBus;
