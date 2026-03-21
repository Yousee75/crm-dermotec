// ============================================================
// Dependency Injection Container — Serverless-friendly
// No DI framework. Factory functions + module-level singletons.
//
// Pattern: each request gets a fresh Container with the user's
// Supabase client (RLS-scoped). Repositories are cheap to create.
// Services that are expensive (Stripe, Resend) are lazy singletons.
//
// Inspired by Stripe's internal service locator pattern.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { SupabaseLeadRepository } from './repositories/supabase-lead.repository'
import { SupabaseActivityRepository, SupabaseAuditLogRepository } from './repositories/supabase-activity.repository'
import { InngestEventBus, ConsoleEventBus } from './events/inngest-event-bus'
import type { LeadRepository, ActivityRepository, AuditLogRepository } from '../domain/shared/repository'
import type { EventBus } from '../domain/shared/domain-events'

// --- Container interface ---

export interface Container {
  // Repositories (scoped to user's Supabase client / RLS)
  leadRepo: LeadRepository
  activityRepo: ActivityRepository
  auditRepo: AuditLogRepository

  // Infrastructure services
  eventBus: EventBus

  // Context
  userId: string | null
  userRole: string | null
}

// --- Factory: create container for a request ---

export function createContainer(
  supabase: SupabaseClient,
  userId: string | null = null,
  userRole: string | null = null
): Container {
  return {
    leadRepo: new SupabaseLeadRepository(supabase),
    activityRepo: new SupabaseActivityRepository(supabase),
    auditRepo: new SupabaseAuditLogRepository(supabase),
    eventBus: getEventBus(),
    userId,
    userRole,
  }
}

// --- Factory: create container with service role (bypasses RLS) ---

export async function createServiceContainer(): Promise<Container> {
  const { createServiceSupabase } = await import('@/lib/supabase-server')
  const supabase = await createServiceSupabase()

  return createContainer(supabase, null, 'system')
}

// --- Event bus singleton ---

let _eventBus: EventBus | null = null

function getEventBus(): EventBus {
  if (_eventBus) return _eventBus

  // Use console bus in test/dev without Inngest
  if (process.env.NODE_ENV === 'test') {
    _eventBus = new ConsoleEventBus()
  } else {
    _eventBus = new InngestEventBus()
  }

  return _eventBus
}

// --- Testing helpers ---

export function createTestContainer(overrides?: Partial<Container>): Container {
  return {
    leadRepo: {} as LeadRepository,
    activityRepo: {} as ActivityRepository,
    auditRepo: {} as AuditLogRepository,
    eventBus: new ConsoleEventBus(),
    userId: 'test-user-id',
    userRole: 'admin',
    ...overrides,
  }
}
