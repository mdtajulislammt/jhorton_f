import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Global Middlewares
  app.use(cookieParser());

  // Global Prefix: /api
  app.setGlobalPrefix('api');

  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://owtlet.com',
      'https://www.owtlet.com',
      'https://owtlet.live',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Cart-Token',
      'X-Owtlet-Signature',
      'X-Owtlet-Timestamp',
      'X-Owtlet-Dispensary',
    ],
  });

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Owtlet™ Cannabis Marketplace API')
    .setDescription(
      'Compliant 21+ Cannabis Marketplace & Live Shopping Multi-Dispensary Routing Engine (Edith)'
    )
    .setVersion('1.0')
    .addTag('Health', 'Health check & database connectivity')
    .addTag('Age Gate', '21+ Age attestation & audit logging')
    .addTag('Products', 'Cannabis catalog, pricing, and live show resolution')
    .addTag('Dispensaries', 'Partner store eligibility, hours, and coverage routing')
    .addTag('Cart', '30-minute hold cannabis cart management')
    .addTag('Orders & Distribution', 'Multi-dispensary allocation, parent/sub-orders')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Owtlet Backend (NestJS) running on http://localhost:${port}/api`);
  console.log(`📚 Swagger Documentation available at http://localhost:${port}/api/docs`);
}

bootstrap();

