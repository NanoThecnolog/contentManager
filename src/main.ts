import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port ?? 5647);
  console.log(`Servidor de gerenciamento de conteúdo online! Porta ${port}`)
}
bootstrap();
