/**
 * ═══════════════════════════════════════════════════════════════
 * DOMAIN - DOMAIN EVENTS
 * ═══════════════════════════════════════════════════════════════
 */

export interface DomainEvent {
  readonly type: string;
  readonly payload: unknown;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export interface EventBus {
  readonly publish: <T>(event: DomainEvent) => void;
  readonly subscribe: <T>(
    eventType: string,
    handler: (event: DomainEvent) => void
  ) => () => void;
}

class EventBusImpl implements EventBus {
  private handlers = new Map<string, Set<(event: DomainEvent) => void>>();

  publish(event: DomainEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (err) {
          console.error(`Event handler error for ${event.type}:`, err);
        }
      });
    }
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }
}

export const eventBus = new EventBusImpl();
