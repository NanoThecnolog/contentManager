import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'
import { json, urlencoded } from 'express';

dotenv.config()

const port = process.env.PORT ?? 4300;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '100mb' }))
  app.use(urlencoded({ extended: true, limit: '100mb' }))

  app.enableCors({
    origin: ['http://localhost:3000', 'https://flixnext.com.br', 'https://flixnext.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'key', 'Accept'],
    credentials: true,
  });

  await app.listen(port);
  console.log(`Servidor de gerenciamento de conteúdo online! Porta ${port}`)
}
bootstrap();