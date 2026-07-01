import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { AppLogger } from './common/logger/app.logger'
import { AppConfigModule } from './config/app-config.module'
import { PrismaModule } from './database/prisma.module'
import { GlobalExceptionFilter } from './filters/global-exception.filter'
import { AppThrottlerGuard } from './guards/app-throttler.guard'
import { LoggingInterceptor } from './interceptors/logging.interceptor'
import { ResponseInterceptor } from './interceptors/response.interceptor'
import { RequestIdMiddleware } from './middleware/request-id.middleware'
import { AttendanceModule } from './modules/attendance/attendance.module'
import { AuthModule } from './modules/auth/auth.module'
import { DepartmentsModule } from './modules/departments/departments.module'
import { EmployeesModule } from './modules/employees/employees.module'
import { HealthModule } from './modules/health/health.module'
import { LeaveModule } from './modules/leave/leave.module'
import { PayrollModule } from './modules/payroll/payroll.module'
import { UserModule } from './modules/user/user.module'
import { RoleModule } from './modules/role/role.module'
import { PermissionModule } from './modules/permission/permission.module'
import { AuditLogModule } from './modules/audit/audit-log.module'

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('security.throttleTtl', 60000),
            limit: configService.get<number>('security.throttleLimit', 100),
          },
        ],
      }),
    }),
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    HealthModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AuditLogModule,
  ],
  providers: [
    AppLogger,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
  }
}
