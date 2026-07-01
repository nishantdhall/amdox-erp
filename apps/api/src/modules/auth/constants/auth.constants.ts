export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS]

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const

export type TenantStatus = typeof TENANT_STATUS[keyof typeof TENANT_STATUS]

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_COOKIE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
} as const

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_INACTIVE: 'User account is inactive',
  USER_SUSPENDED: 'User account is suspended',
  USER_DELETED: 'User account has been deleted',
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_INACTIVE: 'Tenant is inactive',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  EXPIRED_REFRESH_TOKEN: 'Refresh token has expired',
  INVALID_TOKEN: 'Invalid token',
  EXPIRED_TOKEN: 'Token has expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  PASSWORD_MISMATCH: 'Current password is incorrect',
  WEAK_PASSWORD: 'Password is too weak',
  EMAIL_ALREADY_EXISTS: 'Email already exists in this tenant',
} as const