import type { Role, SessionUser } from '../types'
import { ROLE_RANK, satisfiesRole } from './tokens'

/**
 * Permission catalogue (F-01).
 *
 * Permissions are granted per role rather than per user, and every mutating
 * API route and server action checks one before touching the repository.
 */

export const PERMISSIONS = [
  'dashboard.view',
  'analytics.view',
  'analytics.export',
  'employee.view',
  'employee.manage',
  'attendance.self',
  'attendance.manage',
  'leave.apply',
  'leave.approve',
  'payroll.view',
  'payroll.run',
  'finance.view',
  'finance.post',
  'finance.close_period',
  'invoice.approve',
  'payment.record',
  'inventory.view',
  'inventory.adjust',
  'po.view',
  'po.approve',
  'po.reorder_run',
  'project.view',
  'project.manage',
  'forecast.view',
  'forecast.run',
  'audit.view',
  'notification.manage',
  'tenant.manage',
  'system.reset',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const VIEWER: Permission[] = ['dashboard.view', 'analytics.view', 'forecast.view', 'project.view']

const EMPLOYEE: Permission[] = [
  ...VIEWER,
  'employee.view',
  'attendance.self',
  'leave.apply',
  'inventory.view',
  'po.view',
  'analytics.export',
  'notification.manage',
]

const MANAGER: Permission[] = [
  ...EMPLOYEE,
  'employee.manage',
  'attendance.manage',
  'leave.approve',
  'payroll.view',
  'payroll.run',
  'finance.view',
  'finance.post',
  'invoice.approve',
  'payment.record',
  'inventory.adjust',
  'po.approve',
  'po.reorder_run',
  'project.manage',
  'forecast.run',
  'audit.view',
]

const TENANT_ADMIN: Permission[] = [...MANAGER, 'finance.close_period', 'tenant.manage']

const SUPER_ADMIN: Permission[] = [...TENANT_ADMIN, 'system.reset']

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  Viewer: VIEWER,
  Employee: EMPLOYEE,
  Manager: MANAGER,
  TenantAdmin: TENANT_ADMIN,
  SuperAdmin: SUPER_ADMIN,
}

export function can(user: Pick<SessionUser, 'role'> | null | undefined, permission: Permission): boolean {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Your role does not grant "${permission}"`)
    this.name = 'ForbiddenError'
  }
}

export function assertCan(user: Pick<SessionUser, 'role'> | null | undefined, permission: Permission): void {
  if (!can(user, permission)) throw new ForbiddenError(permission)
}

/** Roles a user is allowed to assign — never above their own level. */
export function assignableRoles(role: Role): Role[] {
  return (Object.keys(ROLE_RANK) as Role[]).filter((candidate) => satisfiesRole(role, candidate))
}

export { satisfiesRole, ROLE_RANK }
