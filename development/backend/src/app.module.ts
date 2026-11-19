import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AgeGateModule } from './modules/age-gate/age-gate.module';
import { ProductsModule } from './modules/products/products.module';
import { DispensariesModule } from './modules/dispensaries/dispensaries.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AdminModule } from './modules/admin/admin.module';
import { LiveShowsModule } from './modules/live-shows/live-shows.module';
import { BrandsModule } from './modules/brands/brands.module';
import { AccountModule } from './modules/account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AgeGateModule,
    ProductsModule,
    DispensariesModule,
    CartModule,
    OrdersModule,
    CheckoutModule,
    WebhooksModule,
    AdminModule,
    LiveShowsModule,
    BrandsModule,
    AccountModule,
  ],
})
export class AppModule {}

