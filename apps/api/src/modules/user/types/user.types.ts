export interface User {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  role: string
  status: string
  lastLogin: Date | null
  refreshToken: string | null
  refreshTokenExp: Date | null
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

export type UserWithRoles = Omit<User, 'passwordHash' | 'refreshToken'> & {
  userRoles: {
    role: Role
  }[]
}

export interface PaginatedUsers {
  data: UserWithRoles[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
