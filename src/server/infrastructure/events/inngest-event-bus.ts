// ============================================================
// Inngest Event Bus — Infrastructure implementation
// Maps domain events to Inngest events.
// Domain events are fire-and-forget: use cases publish events,
// Inngest functions handle side effects (emails, webhooks, etc.)
// ============================================================

import { inngest } from '@/lib/inngest'
import type { EventBus, CRMDomainEvent } from '../../domain/shared/domain-events'

export class InngestEventBus implements EventBus {
  async publish(event: CRMDomainEvent): Promise<void> {
    try {
      await inngest.send({
        name: event.name,
        data: {
          ...event.data,
          _meta: {
            timestamp: event.timestamp,
            actor_id: event.actor_id,
            org_id: event.org_id,
            correlation_id: event.correlation_id,
          },
        },
      })
    } catch (err) {
      // Event publishing is non-blocking: log but never throw
      console.error(`[EventBus] Failed to publish ${event.name}:`, err)
    }
  }

  async publishMany(events: CRMDomainEvent[]): Promise<void> {
    if (events.length === 0) return

    try {
      await inngest.send(
        events.map((event) => ({
          name: event.name,
          data: {
            ...event.data,
            _meta: {
              timestamp: event.timestamp,
              actor_id: event.actor_id,
              org_id: event.org_id,
              correlation_id: event.correlation_id,
            },
          },
        }))
      )
    } catch (err) {
      console.error(`[EventBus] Failed to publish ${events.length} events:`, err)
    }
  }
}

// --- Singleton factory (serverless-friendly) ---

let _eventBus: InngestEventBus | null = null

export function getEventBus(): EventBus {
  if (!_eventBus) {
    _eventBus = new InngestEventBus()
  }
  return _eventBus
}

// ============================================================
// Console Event Bus — For development/testing
// ============================================================

export class ConsoleEventBus implements EventBus {
  private events: CRMDomainEvent[] = []

  async publish(event: CRMDomainEvent): Promise<void> {
    this.events.push(event)
    console.log(`[EventBus:Console] ${event.name}`, JSON.stringify(event.data, null, 2))
  }

  async publishMany(events: CRMDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  /** For testing: get all published events */
  getPublished(): CRMDomainEvent[] {
    return [...this.events]
  }

  /** For testing: clear published events */
  clear(): void {
    this.events = []
  }
}
