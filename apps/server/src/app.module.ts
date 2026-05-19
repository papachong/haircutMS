import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { OrderModule } from './modules/order/order.module';
import { ShopManagementModule } from './modules/platform/shop-management/shop-management.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { PassCardModule } from './modules/pass-card/pass-card.module';
import { StaffStatsModule } from './modules/staff-stats/staff-stats.module';
import { PlatformOverviewModule } from './modules/platform/overview/platform-overview.module';
import { PlatformLicenseModule } from './modules/platform/platform-license/platform-license.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { ThrottlerRedisStorage } from './common/storage/throttler-redis.storage';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 requests per minute globally
    // Uses ThrottlerRedisStorage which falls back to in-memory if REDIS_URL is not set
    ThrottlerModule.forRoot({
      storage: new ThrottlerRedisStorage(),
      throttlers: [
        {
          name: 'default',
          ttl: 60_000, // 1 minute
          limit: 100,
        },
      ],
    }),
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
    OrderModule,
    ShopManagementModule,
    DashboardModule,
    CouponModule,
    PassCardModule,
    StaffStatsModule,
    PlatformOverviewModule,
    PlatformLicenseModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // ThrottlerGuard runs BEFORE JwtAuthGuard so rate limiting applies to all requests
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
