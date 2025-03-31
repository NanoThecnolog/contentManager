import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'https://flixnext.com.br', 'https://flixnext.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'key'],
    credentials: true,
  });

  await app.listen(port ?? 5647);
  console.log(`Servidor de gerenciamento de conteúdo online! Porta ${port}`)
}
bootstrap();