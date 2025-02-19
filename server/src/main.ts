import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_URL,
    methods: 'GET,POST,PATCH,DELETE',
  });

  app.use(json({ limit: '50mb' }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
