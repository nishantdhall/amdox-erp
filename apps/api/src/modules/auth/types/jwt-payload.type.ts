export interface JwtPayload {
  sub: string
  email: string
  tenantId: string
  role: string
  firstName: string
  lastName: string
  iat?: number
  exp?: number
}

export interface JwtTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    tenantId: string
  }
  tokens: JwtTokens
}