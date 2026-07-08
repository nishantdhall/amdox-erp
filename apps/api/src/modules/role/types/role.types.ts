// Role model type (mirrors Prisma schema)
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

// Permission model type
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

export type RoleWithPermissions = Role & {
  rolePermissions: {
    permission: Permission
  }[]
}

export type RoleWithRelations = Role & {
  rolePermissions: {
    permission: Permission
  }[]
  userRoles: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
    }
  }[]
}

export interface PaginatedRoles {
  data: RoleWithPermissions[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const ROLE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DELETED: 'DELETED',
} as const

export type RoleStatus = typeof ROLE_STATUS[keyof typeof ROLE_STATUS]