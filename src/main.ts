import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const port = process.env.PORT ?? 4300;
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = (
    process.env.CORS_ORIGINS ??
    process.env.CORS_ORIGIN ??
    ''
  )
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowedOrigins = new Set([
    'https://flixnext.com.br',
    'https://www.flixnext.com.br',
    'https://flixnext.netlify.app',
    ...configuredOrigins,
  ]);
  const isAllowedOrigin = (origin: string): boolean => {
    try {
      const url = new URL(origin);
      return (
        allowedOrigins.has(origin.replace(/\/$/, '')) ||
        ['localhost', '127.0.0.1'].includes(url.hostname)
      );
    } catch {
      return false;
    }
  };

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );
    next();
  });

  app.use(json({ limit: '300mb' }));
  app.use(urlencoded({ extended: true, limit: '300mb' }));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Origem não permitida pelo CORS.'), false);
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'key', 'Accept'],
    credentials: true,
    maxAge: 86400,
  });

  await app.listen(port);
  console.log(`Servidor de gerenciamento de conteúdo online! Porta ${port}`);
}
bootstrap();
