import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as dotenv from 'dotenv'

dotenv.config()



async function bootstrap() {
  const port = process.env.PORT ?? 4300;
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '300mb' }))
  app.use(urlencoded({ extended: true, limit: '300mb' }))

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