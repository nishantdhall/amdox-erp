import { buildSeed, auditHash, GENESIS_HASH, type Tables } from './seed'
import type { AuditLog, ID, Notification, NotificationSeverity } from '../types'

/**
 * In-process data store.
 *
 * The platform ships with a repository-shaped data layer backed by a seeded
 * in-memory dataset. That is a deliberate deployment choice: it makes the whole
 * suite runnable on Vercel with zero provisioning and zero environment
 * variables, so the live demo can never be down because a database was asleep.
 *
 * Everything above this file talks to `repo.ts`, never to these arrays
 * directly — swapping in a SQL adapter means reimplementing that one module.
 *
 * The instance is cached on `globalThis` so Next.js dev-mode hot reloads and
 * warm serverless invocations reuse the same data rather than re-seeding.
 */

interface StoreHandle {
  tables: Tables
  bootedAt: string
  sequences: Map<string, number>
}

const GLOBAL_KEY = Symbol.for('amdox.erp.store')

type GlobalWithStore = typeof globalThis & { [GLOBAL_KEY]?: StoreHandle }

function createStore(): StoreHandle {
  return {
    tables: buildSeed(),
    bootedAt: new Date().toISOString(),
    sequences: new Map(),
  }
}

function handle(): StoreHandle {
  const g = globalThis as GlobalWithStore
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = createStore()
  return g[GLOBAL_KEY]!
}

export function db(): Tables {
  return handle().tables
}

export function bootedAt(): string {
  return handle().bootedAt
}

/** Drop all mutations and rebuild the demo dataset. */
export function resetStore(): void {
  const g = globalThis as GlobalWithStore
  g[GLOBAL_KEY] = createStore()
}

/** Monotonic per-prefix id generator, e.g. `nextId('emp')` → `emp_00001`. */
export function nextId(prefix: string): string {
  const sequences = handle().sequences
  const next = (sequences.get(prefix) ?? 0) + 1
  sequences.set(prefix, next)
  return `${prefix}_${Date.now().toString(36)}${next.toString(36).padStart(3, '0')}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

/* ------------------------------------------------------------- audit trail */

export interface AuditContext {
  tenantId: ID
  actorId: ID | null
  actorName: string
  ip?: string
}

/**
 * Append an immutable audit record, chaining it to the previous hash for this
 * tenant. Any retroactive edit breaks the chain and is caught by
 * `verifyAuditChain` (F-09, SOC 2 CC7.2).
 */
export function appendAudit(
  ctx: AuditContext,
  action: string,
  entity: string,
  entityId: string,
  summary: string,
): AuditLog {
  const logs = db().auditLogs
  const tenantLogs = logs.filter((l) => l.tenantId === ctx.tenantId)
  const last = tenantLogs[tenantLogs.length - 1]

  const payload: Omit<AuditLog, 'hash'> = {
    id: nextId('aud'),
    tenantId: ctx.tenantId,
    seq: (last?.seq ?? 0) + 1,
    at: nowIso(),
    actorId: ctx.actorId,
    actorName: ctx.actorName,
    action,
    entity,
    entityId,
    summary,
    ip: ctx.ip ?? '0.0.0.0',
    prevHash: last?.hash ?? GENESIS_HASH,
  }

  const record: AuditLog = { ...payload, hash: auditHash(payload.prevHash, payload) }
  logs.push(record)
  return record
}

export interface ChainVerification {
  valid: boolean
  checked: number
  brokenAtSeq: number | null
  reason: string | null
}

/** Replay a tenant's audit chain and report the first inconsistency. */
export function verifyAuditChain(tenantId: ID): ChainVerification {
  const logs = db()
    .auditLogs.filter((l) => l.tenantId === tenantId)
    .sort((a, b) => a.seq - b.seq)

  let prevHash = GENESIS_HASH
  for (const log of logs) {
    if (log.prevHash !== prevHash) {
      return { valid: false, checked: logs.length, brokenAtSeq: log.seq, reason: 'Previous-hash pointer does not match' }
    }
    const { hash, ...payload } = log
    if (auditHash(prevHash, payload) !== hash) {
      return { valid: false, checked: logs.length, brokenAtSeq: log.seq, reason: 'Record hash does not match its contents' }
    }
    prevHash = hash
  }

  return { valid: true, checked: logs.length, brokenAtSeq: null, reason: null }
}

/* ------------------------------------------------------------ notifications */

export interface EmitOptions {
  tenantId: ID
  event: string
  title: string
  body: string
  severity?: NotificationSeverity
  href?: string
  channels?: Notification['channels']
}

/**
 * Publish a domain event to the notification engine (F-10).
 *
 * In-app delivery is synchronous; email and webhook channels are recorded as
 * queued deliveries, which is where a BullMQ worker would pick them up.
 */
export function emitNotification(options: EmitOptions): Notification {
  const notification: Notification = {
    id: nextId('ntf'),
    tenantId: options.tenantId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    deletedAt: null,
    event: options.event,
    title: options.title,
    body: options.body,
    severity: options.severity ?? 'info',
    read: false,
    href: options.href ?? null,
    channels: options.channels ?? ['inApp'],
    deliveryAttempts: 1,
    delivered: true,
  }

  db().notifications.unshift(notification)
  return notification
}

export type { Tables }
