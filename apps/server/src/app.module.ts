import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { LicenseModule } from './modules/license/license.module';
import { MemberLevelModule } from './modules/member/levels/member-level.module';
import { RechargeModule } from './modules/recharge/recharge.module';
import { ServiceModule } from './modules/service/service.module';
import { AuditModule } from './modules/audit/audit.module';
import { MemberModule } from './modules/member/member.module';
import { StaffModule } from './modules/staff/staff.module';
import { PlatformAuthModule } from './modules/platform/auth/platform-auth.module';
import { ShopManagementModule } from './modules/platform/shop-management/shop-management.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LicenseModule,
    MemberLevelModule,
    RechargeModule,
    ServiceModule,
    AuditModule,
    MemberModule,
    StaffModule,
    PlatformAuthModule,
    ShopManagementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
