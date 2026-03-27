/**
 * core/events.ts
 * In-process event bus for Solomon's Chamber.
 * No external dependencies — pure TypeScript.
 *
 * Usage:
 *   import { bus, EVENTS } from "./events.ts";
 *   bus.on(EVENTS.NOTE_CREATED, (payload) => console.log(payload));
 *   bus.emit(EVENTS.NOTE_CREATED, { path: "05-Self-Notes/daily/2026-03-27.md" });
 */

// ---------------------------------------------------------------------------
// Pre-defined event type constants
// ---------------------------------------------------------------------------

export const EVENTS = {
  /** Fired when a new item lands in 00-Inbox */
  INBOX_ITEM_ADDED: "inbox:item_added",

  /** Fired when a daily or standalone note is created */
  NOTE_CREATED: "note:created",

  /** Fired when a project's state changes (created, updated, archived) */
  PROJECT_UPDATED: "project:updated",

  /** Fired when a new StoryChain story or contribution is created */
  STORY_CREATED: "story:created",

  /** Fired when an image or video generation job is queued */
  GENERATION_QUEUED: "generation:queued",

  /** Fired when a voice memo is captured */
  VOICE_MEMO_CAPTURED: "voice:memo_captured",

  /** Fired when the vault state is updated */
  STATE_UPDATED: "state:updated",

  /** Fired when a route is dispatched */
  ROUTE_DISPATCHED: "router:dispatched",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS] | string;

// ---------------------------------------------------------------------------
// EventBus class
// ---------------------------------------------------------------------------

type Handler = (payload: unknown) => void;

export class EventBus {
  private listeners: Map<string, Set<Handler>> = new Map();
  private errorHandler: ((error: Error, event: string) => void) | null = null;

  /**
   * Register a handler for a given event name.
   */
  on(event: EventName, handler: Handler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Emit an event, calling all registered handlers synchronously.
   * Errors in individual handlers are caught and routed to the error handler
   * (if set) to prevent one bad handler from blocking others.
   */
  emit(event: EventName, payload: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (err) {
        if (this.errorHandler) {
          this.errorHandler(
            err instanceof Error ? err : new Error(String(err)),
            event
          );
        } else {
          console.error(`[EventBus] Error in handler for "${event}":`, err);
        }
      }
    }
  }

  /**
   * Remove a specific handler for an event.
   */
  off(event: EventName, handler: Handler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Register a one-time handler that auto-removes after first call.
   */
  once(event: EventName, handler: Handler): void {
    const wrapper: Handler = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Remove all handlers for a given event (or all events if none specified).
   */
  removeAll(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Set a global error handler for handler exceptions.
   */
  onError(handler: (error: Error, event: string) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Return a list of all event names that have active listeners.
   */
  activeEvents(): string[] {
    return [...this.listeners.keys()];
  }

  /**
   * Return the number of listeners for a given event.
   */
  listenerCount(event: EventName): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// ---------------------------------------------------------------------------
// Shared singleton bus instance
// ---------------------------------------------------------------------------

export const bus = new EventBus();
