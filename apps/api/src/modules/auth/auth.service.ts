import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../../database/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { JwtPayload, JwtTokens, AuthResponse } from './types/jwt-payload.type'
import { ROLES, USER_STATUS, TENANT_STATUS, JWT_CONFIG, AUTH_ERRORS } from './constants/auth.constants'
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserInactiveException,
  UserSuspendedException,
  UserDeletedException,
  TenantNotFoundException,
  TenantInactiveException,
  InvalidRefreshTokenException,
  ExpiredRefreshTokenException,
  PasswordMismatchException,
  EmailAlreadyExistsException,
} from './exceptions/auth.exceptions'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private readonly jwtSecret: string
  private readonly jwtRefreshSecret: string
  private readonly saltRounds = 10

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.jwtSecret = this.configService.get<string>('auth.jwtSecret', '')
    this.jwtRefreshSecret = this.configService.get<string>('auth.jwtRefreshSecret', this.jwtSecret + '_refresh')
    
    if (!this.jwtSecret) {
      this.logger.warn('JWT_SECRET is not set in environment variables')
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    // Find tenant by company code
    const tenant = await this.prisma.tenant.findUnique({
      where: { companyCode: registerDto.tenantCode },
    })

    if (!tenant) {
      throw new TenantNotFoundException()
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new TenantInactiveException()
    }

    // Check if user already exists in this tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: registerDto.email,
        tenantId: tenant.id,
      },
    })

    if (existingUser) {
      throw new EmailAlreadyExistsException()
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, this.saltRounds)

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash,
        role: registerDto.role || ROLES.EMPLOYEE,
        tenantId: tenant.id,
        status: USER_STATUS.ACTIVE,
      },
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Update user with refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tokens,
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find tenant by company code
    const tenant = await this.prisma.tenant.findUnique({
      where: { companyCode: loginDto.tenantCode },
    })

    if (!tenant) {
      throw new TenantNotFoundException()
    }

    if (tenant.status !== TENANT_STATUS.ACTIVE) {
      throw new TenantInactiveException()
    }

    // Find user by email and tenant
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
        tenantId: tenant.id,
      },
    })

    if (!user) {
      throw new InvalidCredentialsException()
    }

    // Check user status
    await this.validateUserStatus(user)

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new InvalidCredentialsException()
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Generate tokens
    const tokens = await this.generateTokens(user)

    // Update user with refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
      tokens,
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExp: null,
      },
    })

    return { message: 'Logged out successfully' }
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.jwtRefreshSecret,
      })

      // Find user by ID from token
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      })

      if (!user) {
        throw new UserNotFoundException()
      }

      // Check user status
      await this.validateUserStatus(user)

      // Verify refresh token matches stored token
      if (!user.refreshToken || user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new InvalidRefreshTokenException()
      }

      // Check if refresh token is expired
      if (user.refreshTokenExp && user.refreshTokenExp < new Date()) {
        throw new ExpiredRefreshTokenException()
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user)

      // Update user with new refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken)

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
        tokens,
      }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ExpiredRefreshTokenException()
      }
      throw new InvalidRefreshTokenException()
    }
  }

  async getProfile(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLogin: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            companyName: true,
            companyCode: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeCode: true,
            designation: true,
            department: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    await this.validateUserStatus(user)

    return user
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    await this.validateUserStatus(user)

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.passwordHash)
    if (!isCurrentPasswordValid) {
      throw new PasswordMismatchException()
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, this.saltRounds)

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        refreshToken: null,
        refreshTokenExp: null,
      },
    })

    return { message: 'Password changed successfully' }
  }

  async validateUser(payload: JwtPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new UserNotFoundException()
    }

    await this.validateUserStatus(user)

    return user
  }

  private async generateTokens(user: any): Promise<JwtTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    })

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.jwtRefreshSecret,
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      },
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    }
  }

  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenExp = new Date()
    refreshTokenExp.setDate(refreshTokenExp.getDate() + 7) // 7 days from now

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExp,
      },
    })
  }

  private async validateUserStatus(user: any): Promise<void> {
    if (user.status === USER_STATUS.INACTIVE) {
      throw new UserInactiveException()
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new UserSuspendedException()
    }

    if (user.status === USER_STATUS.DELETED || user.deletedAt) {
      throw new UserDeletedException()
    }
  }
}
