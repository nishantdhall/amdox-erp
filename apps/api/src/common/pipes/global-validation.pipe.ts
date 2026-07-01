import { BadRequestException, Injectable, ValidationError, ValidationPipe } from '@nestjs/common'

@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const details = errors.map((error) => ({
          field: error.property,
          constraints: error.constraints ?? {},
        }))

        return new BadRequestException({
          message: 'Validation failed',
          errors: details,
        })
      },
    })
  }
}
