export interface Permission {
  id: string
  tenantId: string
  resource: string
  action: string
  description: string | null
  isSystem: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Role {
  id: string
  tenantId: string
  name: string
  code: string
  description: string | null
  isSystem: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type PermissionWithRoles = Permission & {
  rolePermissions: {
    role: Role
  }[]
}

export interface PaginatedPermissions {
  data: PermissionWithRoles[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const PERMISSION_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const

export type PermissionStatus = typeof PERMISSION_STATUS[keyof typeof PERMISSION_STATUS]

export interface PermissionResource {
  resource: string
  actions: string[]
  description?: string
}