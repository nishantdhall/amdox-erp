import { HttpException, HttpStatus } from '@nestjs/common'
import { AUTH_ERRORS } from '../constants/auth.constants'

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED)
  }
}

export class UserNotFoundException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.USER_NOT_FOUND, HttpStatus.NOT_FOUND)
  }
}

export class UserInactiveException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.USER_INACTIVE, HttpStatus.FORBIDDEN)
  }
}

export class UserSuspendedException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.USER_SUSPENDED, HttpStatus.FORBIDDEN)
  }
}

export class UserDeletedException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.USER_DELETED, HttpStatus.FORBIDDEN)
  }
}

export class TenantNotFoundException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.TENANT_NOT_FOUND, HttpStatus.NOT_FOUND)
  }
}

export class TenantInactiveException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.TENANT_INACTIVE, HttpStatus.FORBIDDEN)
  }
}

export class InvalidRefreshTokenException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED)
  }
}

export class ExpiredRefreshTokenException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.EXPIRED_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED)
  }
}

export class InvalidTokenException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.INVALID_TOKEN, HttpStatus.UNAUTHORIZED)
  }
}

export class ExpiredTokenException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.EXPIRED_TOKEN, HttpStatus.UNAUTHORIZED)
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS, HttpStatus.FORBIDDEN)
  }
}

export class PasswordMismatchException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.PASSWORD_MISMATCH, HttpStatus.BAD_REQUEST)
  }
}

export class WeakPasswordException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.WEAK_PASSWORD, HttpStatus.BAD_REQUEST)
  }
}

export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(AUTH_ERRORS.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT)
  }
}